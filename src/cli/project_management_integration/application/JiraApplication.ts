import { isAtomicUserStory, isBacklog, isEpic, isTimeBox, Model } from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { PersonApplication } from "./PersonApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { USApplication } from "./USApplication.js";
import { EventEmitter } from 'events'

export class JiraApplication {

  epicApplication: EPICApplication
  uSApplication: USApplication
  taskApplication: TaskApplication
  timeBoxApplication: TimeBoxApplication
  teamApplication: TeamApplication
  personApplication: PersonApplication
  model: Model
  

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter ){

      this.model = model

      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)

      this.uSApplication = new USApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)
     
      this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.teamApplication = new TeamApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.personApplication = new PersonApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      
    }
    
    
    public async createModel() {
      
      //Buscando elementos
      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
      const usWithoutEPIC = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic == undefined))
      const timeBox = this.model.components.filter(isTimeBox)

      // Criando EPIC e suas US e TASK
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));

      // Criando as US que não possuem task

      await Promise.all(usWithoutEPIC.map(async us => await this.uSApplication.createWithOutEpic(us)));

      
      // Criando os Sprint
      await Promise.all(timeBox.map(timeBox => this.timeBoxApplication.create(timeBox)));
      
  }

  public async sincronized(){    
    // Buscando os sprints
    await this.timeBoxApplication.sinchronzied();
    // Buscando as pessoas
    await this.personApplication.sinchronzied()
    // Buscando as tarefas
    await this.taskApplication.sinchronzied()
    // Associando as tarefas as pessoas
    await this.teamApplication.sinchronzied()
    
  }
    
    

}   