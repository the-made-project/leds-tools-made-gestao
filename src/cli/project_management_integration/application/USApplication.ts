
import { AtomicUserStory, Epic, isAtomicUserStory, isBacklog, Model } from "../../../language/generated/ast.js";
import { IssueDTO } from "../dto/models.js";
import { Util } from "../service/util.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";
import { EventEmitter } from 'events';
export class USApplication extends IssueAbstractApplication {

    model: Model
    USCreated: Map<String,IssueDTO>
    us : AtomicUserStory[]
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        
        super(email, apiToken, host, projectKey, target_folder,eventEmitter);
        
        this.USCreated = new Map();

        this.model = model
        
        this.us = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory));
        
        this.eventEmitter.on('epicCreated', this.createUserStory.bind(this));    
        this.eventEmitter.on('usCreated', this.addUSCreated.bind(this));    
        
    }

    public async createWithOutEpic(atomicUserStory: AtomicUserStory){
        this.createNewUS (atomicUserStory)
    }

    private async addUSCreated(atomicUserStory: AtomicUserStory, atomicUserStoryDTO: IssueDTO){
       
        this.USCreated.set(atomicUserStory.id.toLocaleLowerCase(),atomicUserStoryDTO)
        
        //Informando que todo os US foram criados
        if (this.us.length == this.USCreated.size){                
            this.eventEmitter.emit('allUSCreated', this.USCreated);   
        }
        
    }  


    private async createUserStory(epic: Epic, issueDTO: IssueDTO){
        
        const userstories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic?.ref == epic))
        
        userstories.map (async us => await this.createNewUS (us,issueDTO))
        
    } 

    
    private async createNewUS(atomicUserStory: AtomicUserStory, epicDTO?: IssueDTO) {
        const epicID = epicDTO ? `${epicDTO?.internalId}.` : "";

        const id = `${epicID}${atomicUserStory.id.toLowerCase()}` 
        
        const value = await this._idExists(id)

        if (!value){            
            await this._create(atomicUserStory,epicDTO)
        }   

    }

    protected async _create(atomicUserStory: AtomicUserStory, epicDTO?: IssueDTO) {
                
        try {
            
            const description = atomicUserStory.description || ""
            const parent = epicDTO?.key ?? ""
            const labels = atomicUserStory.label ? Util.appendValue(atomicUserStory.label,atomicUserStory.labelx): []

            await this.jiraIntegrationService.createUserStory(atomicUserStory.name ?? "", 
                description, 
                parent, 
                labels).then(async (result) => {
                    const epicID = epicDTO ? `${epicDTO?.internalId}.` : "";

                    const usID = `${epicID}${atomicUserStory.id.toLocaleLowerCase()}`
        
                    const issueDTO: IssueDTO = {
                        internalId: usID,
                        id: (result).id,
                        key: (result).key,
                        self: (result).self,                
                        type: "atomicuserstory"
                    };
        
                    await this.save(issueDTO)   
                    
                    this.eventEmitter.emit('usCreated', atomicUserStory, issueDTO);   
                    
                    }).catch(error => {
                    console.error(error);
                });    
            
        } catch (error) {
            console.error('Error creating user story:', error);
        }
    }

    


   


}