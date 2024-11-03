
import { isTimeBox, Model, TimeBox } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import { TimeBoxDTO, IssueDTO, PlannedItemDTO, AssigneeDTO } from "../dto/models.js";
import * as vscode from 'vscode';

export class TimeBoxApplication extends AbstractApplication {
    
    timeBoxesCreated: Map<string,TimeBox>
    timeBoxesFullCreated: Map<string,TimeBox>
    timeBoxes : TimeBox[]
    model: Model
    USCreated: Map<String,IssueDTO>

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter) {

        super(email,apiToken,host,projectKey,target_folder,eventEmitter)       
        this.jsonFile = "timebox.json"

        this.timeBoxesCreated = new Map();
        
        this.timeBoxesFullCreated = new Map();
        
        this.USCreated = new Map();

        this.model = model

        this.timeBoxes = this.model.components.filter(isTimeBox);

        this.eventEmitter.on('timBoxCreated', this.addSprintCreated.bind(this));  

        this.eventEmitter.on('allUSCreated', this.addUSCreated.bind(this));  

        this.eventEmitter.on('allTimeBoxesCreated', this.addTimeBoxCreated.bind(this));  

    }

    private async addUSCreated (USCreated: Map<String,IssueDTO>){
        this.USCreated = USCreated
        this.moveUS()
    }
    private async addTimeBoxCreated (timeBoxesCreated: Map<string,TimeBox>){
        this.timeBoxesFullCreated = timeBoxesCreated
        this.moveUS()
    } 
    //Move os elementos 
    private async moveUS(){

        if ((this.USCreated.size > 0) && (this.timeBoxesFullCreated.size >0)){
            console.log (`${this.USCreated.size} - ${this.timeBoxesFullCreated.size}`) 
            
            let issues: string[] = [];
            
            let plannedItem: Map<string,PlannedItemDTO> = new Map();
            
            let timeboxID: string = ""
            
            this.timeBoxesFullCreated.forEach(async (value , key) => {
                timeboxID = key
                
                value.planning?.planningItems.map (planningItem => {
                    
                    //Verificando o ID, pegando apenas US
                    const id = planningItem.item?.ref?.id.toLowerCase() || ""
            
                    const issueDTO = this.USCreated.get(id)
            
                    if (issueDTO?.key){
                    
                        const plannedItemDTO : PlannedItemDTO = {
                            email:planningItem.assignee?.ref?.email ?? "",
                            startDate:planningItem.startdate?? "",
                            dueDate:planningItem.duedate ?? "" ,
                            id: issueDTO.key
                        }

                        plannedItem.set(issueDTO.key,plannedItemDTO) 
                        issues.push (issueDTO?.key)
                    }
                    

                })
                if (issues.length > 0) {
                    // Movendo uma história de usuário
                    await this.jiraIntegrationService.moveIssueToSprint(issues, timeboxID);
                    this.eventEmitter.emit('plannedItemMoved', plannedItem);  
                }
                issues = []
            })
            
            
        }

    }



    private async addSprintCreated(timeBox: TimeBox, timeBoxDTO: TimeBoxDTO){
       
        this.timeBoxesCreated.set(timeBoxDTO.id,timeBox)
        
        //Informando que todo os US foram criados
        if (this.timeBoxes.length == this.timeBoxesCreated.size){                
            this.eventEmitter.emit('allTimeBoxesCreated', this.timeBoxesCreated);   
            
        }
        
    }  
    
    

    public async create(timeBox: TimeBox) {
        
        const id = `${timeBox.id.toLowerCase()}`
        const value = await this._idExists(id)
        
        if (!value){
            
            try {
                await this.jiraIntegrationService.createSprint(
                    timeBox.name ?? timeBox.id, 
                    timeBox.description ?? '-', 
                    timeBox.startDate ?? "", 
                    timeBox.endDate ?? ""
                ).then (async (result) => {
            
                    const timeBoxID = timeBox.id.toLowerCase()
        
                    const timeBoxDTO: TimeBoxDTO = 
                    {
                        internalId: timeBoxID,
                        startDate:timeBox.startDate ?? "", 
                        endDate: timeBox.endDate ?? "",
                        name: timeBox.name ??timeBox.id, 
                        id: (result).id,
                        self: (result).self,
                    };
        
                    await this.save(timeBoxDTO)   
                          
                    this.eventEmitter.emit('timBoxCreated', timeBox, timeBoxDTO);                
                    
                    }).catch(error => {
                        console.error(error);
                });    

                
            } catch (error) {
                console.error('Error creating sprint:', error);
            }       
            
        }
        
    }


    public override async execute(data: any): Promise<boolean> {
        
        const id = data.sprintId
        const result = await this.retriveByExternal(id)
        const tasks = new Array<AssigneeDTO>();

        data?.tasks.forEach(async (task:any) =>{
           
            const assigneeDTO: AssigneeDTO = {
                name:task.fields.assignee?.displayName,
                account: task.fields.assignee?.accountId,
                issue: task.key
            };
    
            tasks.push(assigneeDTO)
        
          });
      


        const timeBoxDTO: TimeBoxDTO = 
                    {
                        internalId: "",
                        startDate:data.startDate ?? "", 
                        endDate: data.endDate ?? "",
                        name: data.sprintName, 
                        id: data.sprintId,
                        self: data.self,
                        state: data.state,
                        completeDate: data.completeDate,
                        createdDate: data.createdDate,
                        assignees: tasks
                    };
            
        if (result){
            console.log ("encontrou")
            await this.update (id, timeBoxDTO)
        }
        else{
            console.log ("novo")
            await this.save(timeBoxDTO)   
            
        }
        return true
    }

    public async synchronized(){
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Sincronizando com Jira",
            cancellable: true
          }, async (progress, token) => {
            try {
              // Etapas da sincronização
              const steps = [
                { message: "Conectando ao Jira...", increment: 10 },
                { message: "Buscando Sprints e Issues...", increment: 30 },
                { message: "Atualizando dados locais...", increment: 40 },
                { message: "Finalizando sincronização...", increment: 20 }
              ];
      
              // Para cada etapa
              for (const step of steps) {
                if (token.isCancellationRequested) {
                  vscode.window.showInformationMessage('Sincronização cancelada pelo usuário');
                  return;
                }
      
                progress.report({
                  message: step.message,
                  increment: step.increment
                });
      
                // Executa a sincronização
                await this.jiraIntegrationService.synchronizedSprintTask(this,this.projectKey)
              }
      
              // Mensagem de sucesso
              vscode.window.showInformationMessage('✅ Sincronização concluída com sucesso!', 'Ver Detalhes')
                .then(selection => {
                  if (selection === 'Ver Detalhes') {
                    // Aqui você pode adicionar lógica para mostrar mais detalhes
                    vscode.window.showInformationMessage('Detalhes da sincronização...');
                  }
                });
      
              return Promise.resolve();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              vscode.window.showErrorMessage(`❌ Erro na sincronização: ${errorMessage}`, 'Ver Detalhes')
                .then(selection => {
                  if (selection === 'Ver Detalhes') {
                    // Mostra erro detalhado
                    vscode.window.showErrorMessage(`Detalhes do erro: ${errorMessage}`);
                  }
                });
              throw error;
            }
          });
        }

        
    }


