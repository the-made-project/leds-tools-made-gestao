import { Model } from "../../../language/generated/ast.js";
import { AssigneeDTO, PlannedItemDTO } from "../dto/models.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';

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

    public async synchronized(){
      await this.jiraIntegrationService.synchronizedIssues(this, this.projectKey)
    }
    
    }
    

  
    
