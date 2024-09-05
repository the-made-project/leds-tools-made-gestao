
import { isTimeBox, Model, TimeBox } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import { IssueDTO, TimeBoxDTO } from "../dto/models.js";

export class TimeBoxApplication extends AbstractApplication {
    
    timeBoxesCreated: Map<String,TimeBoxDTO>
    timeBoxesFullCreated: Map<String,TimeBoxDTO>
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

        this.eventEmitter.on('sprintCreated', this.addSprintCreated.bind(this));  

        this.eventEmitter.on('allUSCreated', this.addUSCreated.bind(this));  

        this.eventEmitter.on('allTimeBoxesCreated', this.addTimeBoxCreated.bind(this));  

        //Quando todo os USCriados e Todos os SprintCriados podemos mover

    }

    private async addUSCreated (USCreated: Map<String,IssueDTO>){
        this.USCreated = USCreated
        this.moveUS()
    }
    private async addTimeBoxCreated (timeBoxesCreated: Map<String,TimeBoxDTO>){
        this.timeBoxesFullCreated = timeBoxesCreated
        this.moveUS()
    } 

    private async moveUS(){
        if ((this.USCreated.size > 0) && (this.timeBoxesFullCreated.size >0)){
            console.log (`Podemos mover: ${this.USCreated.size} - ${this.timeBoxesFullCreated.size}` )
        }

    }



    private async addSprintCreated(timeBox: TimeBox, timeBoxDTO: TimeBoxDTO){
       
        this.timeBoxesCreated.set(timeBoxDTO.id,timeBoxDTO)
        
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
