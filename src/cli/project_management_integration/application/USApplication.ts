import { AtomicUserStory, Epic, isAtomicUserStory, isBacklog, Model } from "../../../language/generated/ast.js";
import { IssueDTO } from "../dto/models.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";
import { EventEmitter } from 'events';
export class USApplication extends IssueAbstractApplication {

    model: Model
    
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        
        super(email, apiToken, host, projectKey, target_folder,eventEmitter);

        this.model = model
        
        this.eventEmitter.on('epicCreated', this.createUserStory.bind(this));
        
    }

    private async createUserStory(epic: Epic, issueDTO: IssueDTO){
        
        const userstories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic?.ref == epic))
        
        userstories.map (async us => await this.create (us,issueDTO))
        
    } 

    private async create(atomicUserStory: AtomicUserStory, issueDTO: IssueDTO) {        
        console.log (atomicUserStory)
        console.log (issueDTO)
    }


   


}