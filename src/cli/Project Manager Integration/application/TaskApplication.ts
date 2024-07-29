import { Task, TaskBacklog } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"

export class TaskApplication extends IssueAbstractApplication {

    public async create(task: TaskBacklog){
      //Tarefas que possui um link com uma US  
      if (task.userstory){
        
        const userstoryID = task.userstory.ref.id.toLowerCase()
        
        const epicID = task.userstory.ref.epic.ref.id.toLowerCase()
        
        let taskID = ""
        
        if (epicID){
          taskID = `${epicID}.`
        }
        
        if (userstoryID){
          taskID += `${userstoryID}.`
        }
        
        let result = await super.readByKey(taskID.slice(0, -1), this.jsonDAO)
        const key = (result as any).key 
        taskID += `${task.id}`

        if (!this.idExists(taskID, this.jsonDAO)){

          this.createSubTaskBacklog(task,key,taskID)
        }

      }
      else{
        //Tarefas sem link com US
        this.createTaskBacklog(task)
      }
    }

    public async createTaskBacklog (task: TaskBacklog){

      if (!this.idExists(task.id, this.jsonDAO)){

        let labels = task.label ? Util.appendValue(task.label,task.labelx) : []

        this.jiraIntegrationService.createTask(task.name, task.description,undefined, labels).then(result => {

          this.save(task.id, result)  

        })
      }
    }

    private async createSubTaskBacklog(task: TaskBacklog, usID:string, id:string){
      
      let labels = task.label ? Util.appendValue(task.label,task.labelx) : []

      await this.jiraIntegrationService.createSubTask(task.name,task.description, usID, labels).then(result => {
            
        this.save(id, result)
      
      }).catch(error => {
          console.error(error);
      });
    }


    private async createSubTask(task: Task, usID:string, id:string){

      let labels = task.label ? Util.appendValue(task.label,task.labelx) : []
      
      await this.jiraIntegrationService.createSubTask(task.name,task.description, usID,labels).then(result => {
            
        this.save(id, result)
      
      }).catch(error => {
          console.error(error);
      });
    }

    public async createByTask(task: Task, usID:string, epicInternalID:string,activityInternalID:string) {
    
        let id = `${activityInternalID}.${task.id.toLowerCase()}`
       
        if (epicInternalID){
          id = `${epicInternalID}.${activityInternalID}.${task.id.toLowerCase()}`
        }
            
        if (!this.idExists(id, this.jsonDAO)){
          await this.createSubTask(task, usID, id)
        
        }   
      
      }
    
    private save(ID:any, result:any,) {
        super.saveOnFile(ID, result, this.jsonDAO, "task")  
   }

}