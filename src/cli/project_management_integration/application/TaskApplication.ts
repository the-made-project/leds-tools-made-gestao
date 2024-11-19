
import { AtomicUserStory, isBacklog, isTaskBacklog, Model, TaskBacklog } from "../../../language/generated/ast.js";
import { IssueDTO } from "../../model/models.js";
import { Util } from "../service/util.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";
import { EventEmitter } from 'events';

export class TaskApplication extends IssueAbstractApplication {

    model: Model
    
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        
        super(email, apiToken, host, projectKey, target_folder,eventEmitter);

        this.model = model
        
        this.eventEmitter.on('usCreated', this.createSubTaskFromUS.bind(this));
        
    }

    private async createSubTaskFromUS(atomicUserStory: AtomicUserStory, atomicUserStoryDTO: IssueDTO){
        
        const subTask = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isTaskBacklog).filter(task => task.userstory?.ref == atomicUserStory))
        
        subTask.map (async task => await this.createSubTask(task,atomicUserStoryDTO))
        
    } 

    private async createSubTask(task: TaskBacklog, atomicUserStoryDTO: IssueDTO) {        
        
        const parent = atomicUserStoryDTO.key        
        const labels = task.label ? Util.appendValue(task.label,task.labelx): []

        try {
            
            const result = await this.jiraIntegrationService.createTask(task.name ?? "", task.description ?? "", parent, labels);
            
            const taskID = `${atomicUserStoryDTO.internalId}.${task.id.toLocaleLowerCase()}`
            
        
            const issueDTO: IssueDTO = {
                internalId: taskID,
                id: (result).id,
                key: (result).key,
                self: (result).self,                                
                type: "task"
            };
        
            await this.save(issueDTO)

        } catch (error) {
            console.error('Error creating subtask:', error);
        }
    } 

    


}
