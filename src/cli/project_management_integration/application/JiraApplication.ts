import { Epic, isBacklog, isEpic, Model } from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { USApplication } from "./USApplication.js";
import { EventEmitter } from 'events'

 //isTimeBox, isTaskBacklog, TimeBox, isAtomicUserStory, AtomicUserStory, TaskBacklog,  isTaskBacklog, isTimeBox

export class JiraApplication {

  epicApplication: EPICApplication
  USApplication: USApplication
  target_folder: string
  model: Model
  eventEmitter: EventEmitter

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter ){

      this.USApplication = new USApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)
      
      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)
      
      this.target_folder = target_folder

      this.model = model

      this.eventEmitter = eventEmitter

    }
    
    
    public async GetProjectInformation(model: Model){
      
      console.log("bla") 
         
    }


    public async createModel() {

      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));

      await this.createEPIC(epics);
      
  }
    
  public async createEPIC(epics: Epic[]) {
      
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));
  }
  

}   