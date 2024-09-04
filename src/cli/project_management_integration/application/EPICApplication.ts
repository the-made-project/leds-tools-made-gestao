import { Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { EventEmitter } from 'events';
import { IssueDTO } from "../dto/models.js";

export class EPICApplication extends IssueAbstractApplication {

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string,eventEmitter: EventEmitter){
        super(email,apiToken,host,projectKey,target_folder, eventEmitter)
        
        this.eventEmitter = eventEmitter
    }

    public async create(epic: Epic) {

        const id = `${epic.id.toLowerCase()}`
        const value = await this._idExists(id)
        
        if (!value){
            
            await this._create(epic)
        }          
        
    }

    private async _create (epic: Epic){
        const epicDTO = await this.createEpicWithOutProcess (epic)
        return epicDTO
    }

    private async createEpicWithOutProcess(epic: Epic){
        
        let labels = epic.label ? Util.appendValue(epic.label,epic.labelx): []
        
        this.jiraIntegrationService.createEPIC(epic.name || "",epic.description || "", undefined, labels )
        .then(async (result) => {
            
            const epicID = epic.id.toLowerCase()

            const issueDTO: IssueDTO = {
                internalId: epicID,
                id: (result).id,
                key: (result).key,
                self: (result).self,                
                type: "epic"
            };

            await this.save(issueDTO)   
                  
            this.eventEmitter.emit('epicCreated', epic, issueDTO);                
            
            }).catch(error => {
            console.error(error);
        });    
    }

   
}