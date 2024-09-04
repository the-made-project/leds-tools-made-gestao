import { isBacklog, isEpic, isTimeBox, Model } from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { USApplication } from "./USApplication.js";
import { EventEmitter } from 'events'

 //isTimeBox, isTaskBacklog, TimeBox, isAtomicUserStory, AtomicUserStory, TaskBacklog,  isTaskBacklog, isTimeBox

export class JiraApplication {

  epicApplication: EPICApplication
  uSApplication: USApplication
  taskApplication: TaskApplication
  timeBoxApplication: TimeBoxApplication
  model: Model

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter ){

      

      this.model = model

      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)

      this.uSApplication = new USApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)
     
      this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)
    }
    
    
    public async GetProjectInformation(model: Model){
      
      console.log("bla") 
         
    }


    public async createModel() {

      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));

      this.model.components.filter(isTimeBox).map(timeBox => this.timeBoxApplication.create(timeBox));
      
      
      
  }
    
    

}   