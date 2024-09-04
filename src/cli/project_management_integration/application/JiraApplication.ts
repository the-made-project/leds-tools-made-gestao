import { Epic, isBacklog, isEpic, Model } from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { USApplication } from "./USApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { PlanningApplication } from "./PlanningApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { EventEmitter } from 'events'

 //isTimeBox, isTaskBacklog, TimeBox, isAtomicUserStory, AtomicUserStory, TaskBacklog,  isTaskBacklog, isTimeBox

export class JiraApplication {

  epicApplication: EPICApplication
  USApplication: USApplication
  taskApplication : TaskApplication
  timeBoxApplication : TimeBoxApplication
  planningApplication: PlanningApplication
  teamApplication: TeamApplication
  target_folder: string
  model: Model
  eventEmitter: EventEmitter

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter ){

      this.USApplication = new USApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)
      
      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)
      
      this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder)
      
      this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder)
      
      this.planningApplication = new PlanningApplication(email,apiToken,host,projectKey,target_folder)
      
      this.teamApplication = new TeamApplication(email,apiToken,host,projectKey,target_folder)

      this.target_folder = target_folder

      this.model = model

      this.eventEmitter = eventEmitter

    }
    
    
    public async GetProjectInformation(model: Model){
      
      console.log("bla") 
         
    }


    public async createModel() {

      await this.planningApplication.processUser();

      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));

      await this.createEPIC(epics);
      
  }
    
  public async createEPIC(epics: Epic[]) {
      
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));
  }
  

}   