import { Model } from "../../../language/generated/ast.js";
import { personDTO } from "../../model/models.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';

export class PersonApplication extends AbstractApplication {
 
    objectMap: Map<string,string> = new Map();

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        super(email, apiToken, host, projectKey, target_folder, eventEmitter);  
        
        
        this.jsonFile = "people.json"
        

    }

    public override async execute(data: any): Promise<boolean> {
        
        const id = data.accountId
        const result = await this.retriveByExternal(id)

        const personDTO: personDTO = {
            id: data.accountId,
            active: data.active,
            displayName: data.displayName,
            self:     data.self
        };
    
        if (result){
            
            await this.update (id, personDTO)
        }
        else{
            await this.save(personDTO)   
            
        }

        return true
    }

    public async synchronized(){
      await this.jiraIntegrationService.synchronizedTeamMember(this);
    }

    
        
        
    }
