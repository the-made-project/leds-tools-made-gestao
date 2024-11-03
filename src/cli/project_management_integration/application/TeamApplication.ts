import { Model } from "../../../language/generated/ast.js";
import { AssigneeDTO, PlannedItemDTO } from "../dto/models.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
export class TeamApplication extends AbstractApplication {
 
    objectMap: Map<string,string> = new Map();

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        super(email, apiToken, host, projectKey, target_folder, eventEmitter);  
        
        this.processUser()
        this.jsonFile = "assignee.json"
        this.eventEmitter.on('plannedItemMoved', this.assigneeTeammmeber.bind(this));

    }

    private async processUser() {
        try {
            const result = await this.jiraIntegrationService.getUsers();
            if (Array.isArray(result)) {
                result.forEach((item: any) => {
                    if (item.emailAddress) {
                        this.objectMap.set(item.emailAddress.toLowerCase(), item.accountId);
                    }
                });
            }
        } catch (error) {
            console.error('Error processing users:', error);
        }
    }
    // Associando um item planejado a um pessoa

    private async assigneeTeammmeber(plannedItem: Map<string,PlannedItemDTO>){
        plannedItem.forEach((value, key)=>{

            if (value.email){
                const accountId = this.objectMap.get(value.email);

                this.jiraIntegrationService.editMetaData (key, accountId ?? "", undefined, value.dueDate ?? undefined ).then(async (result)=>{
                    if (accountId){
                        
                        const assigneeDTO: AssigneeDTO = {
                            account: accountId,
                            issue: key
                        };
        
                        await this.save(assigneeDTO) 
                    }
                })

                 
            }
            
        });
        

    }

    
    public override async execute(data: any): Promise<boolean> {
        
        if  (data.fields.assignee?.accountId){
            const assigneeDTO: AssigneeDTO = {
                name:data.fields.assignee?.displayName,
                account: data.fields.assignee?.accountId,
                issue: data.key
            };

            data = {
                account: assigneeDTO.account,
                issue: assigneeDTO.issue
            }
            const result = await this.retriveByExternalData(data)
            if (!result){
                this.save(assigneeDTO)
            }
            
            
        }


        return true
    }


    public async synchronized(): Promise<void> {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Sincronizando com Jira",
          cancellable: true
        }, async (progress, token) => {
          try {
            // Etapas da sincronização
            const steps = [
              { message: "Conectando ao Jira...", increment: 10 },
              { message: "Buscando issues...", increment: 30 },
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
              await this.jiraIntegrationService.synchronizedIssues(this, this.projectKey);
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
    

  
    
