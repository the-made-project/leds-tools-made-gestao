import { Model } from "../../../language/generated/ast.js";
import { PlannedItemDTO } from "../dto/models.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';

export class TeamApplication extends AbstractApplication {
 
    objectMap: Map<string,string> = new Map();

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        super(email, apiToken, host, projectKey, target_folder, eventEmitter);  
        
        this.processUser()
        
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

    private async assigneeTeammmeber(plannedItem: Map<string,PlannedItemDTO>){
        plannedItem.forEach((value, key)=>{
            
            console.log (`${value.email}-${key}`)

            if (value.email){
                const accountId = this.objectMap.get(value.email);

                this.jiraIntegrationService.editMetaData (key, accountId ?? "", undefined, value.dueDate ?? undefined )
            }
            
        });
        

    }
}