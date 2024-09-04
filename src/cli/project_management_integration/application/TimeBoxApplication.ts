
import { TimeBox } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import { TimeBoxDTO } from "../dto/models.js";

export class TimeBoxApplication extends AbstractApplication {
    
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, eventEmitter: EventEmitter) {

        super(email,apiToken,host,projectKey,target_folder,eventEmitter)       
        this.jsonFile = "timebox.json"
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
        
                    const timeBoxDTO: TimeBoxDTO = {
                        internalId: timeBoxID,
                        startDate:timeBox.startDate ?? "", 
                        endDate: timeBox.endDate ?? "",
                        name: timeBox.name ??timeBox.id, 
                        id: (result).id,
                        key: (result).key,
                        self: (result).self,
                    };
        
                    await this.save(timeBoxDTO)   
                          
                    this.eventEmitter.emit('sprintCreated', timeBox, timeBoxDTO);                
                    
                    }).catch(error => {
                    console.error(error);
                });    

                
            } catch (error) {
                console.error('Error creating sprint:', error);
            }       
            
        }
        
    }

}
