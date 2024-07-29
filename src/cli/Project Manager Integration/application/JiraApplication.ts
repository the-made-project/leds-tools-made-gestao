import { Epic, isBacklog, isEpic, Model ,TimeBox, isAtomicUserStory, AtomicUserStory, TaskBacklog, isTimeBox, isTaskBacklog} from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { USApplication } from "./USApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { PlanningApplication } from "./PlanningApplication.js";

export class JiraApplication {

  epicApplication: EPICApplication
  USApplication: USApplication
  taskApplication : TaskApplication
  timeBoxApplication : TimeBoxApplication
  planningApplication: PlanningApplication

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){

    this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder)
    this.USApplication = new USApplication(email,apiToken,host,projectKey,target_folder)
    this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder)
    this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder)
    this.planningApplication = new PlanningApplication(email,apiToken,host,projectKey,target_folder)
  }
    
  public async run(model:Model){

    await this.planningApplication.processUser()

    const epics = model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic))

    const userstories = model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory))

    const tasks =  model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isTaskBacklog))

    const timeBoxes = model.components.filter(isTimeBox)
    
    await this.createEPIC(epics)

    await this.createUserStory(userstories)
    
    await this.createTaskBacklog(tasks)

    await this.createTimeBoxes(timeBoxes)

    await this.createPlanningItem(timeBoxes)
  }
  
  public async createEPIC(epics: Epic[]) {

    epics.forEach (async (epic) => {
      
      await this.epicApplication.create(epic)
     
    });
    
  }

  public async createUserStory(atocmiUserStories: AtomicUserStory[]) {
    // Verificar quando tiver relação com uma EPIC

    atocmiUserStories.map(async (atomicUserStory) => {

     await this.USApplication.create(atomicUserStory)
      
    })
    
  }

  public async createTaskBacklog(backlogTasks: TaskBacklog[]) {
    
    backlogTasks.map(async (task) =>  {

      await this.taskApplication.create(task)
      
    })
    
  }  

  public async createTimeBoxes(timeBoxes:TimeBox[]) {

    timeBoxes.map(async timeBox => {
      await this.timeBoxApplication.create(timeBox)
      }
      
    );
  
  }

  public async createPlanningItem(timeBoxes:TimeBox[]){

    timeBoxes.map(async timeBox => {
    
      await this.planningApplication.createPlanning(timeBox)
    
    } );
  
  }

  

  
  
}   