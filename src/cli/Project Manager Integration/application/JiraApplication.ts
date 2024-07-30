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
    
  public async run(model: Model) {
    await this.planningApplication.processUser();

    const epics = model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
    const userstories = model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory));
    const tasks = model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isTaskBacklog));
    const timeBoxes = model.components.filter(isTimeBox);

    await Promise.all([
        this.createEPIC(epics),
        this.createUserStory(userstories),
        this.createTaskBacklog(tasks),
        this.createTimeBoxes(timeBoxes),
        this.createPlanningItem(timeBoxes)
    ]);
}
  
  public async createEPIC(epics: Epic[]) {
    await Promise.all(epics.map(epic => this.epicApplication.create(epic)));
}

public async createUserStory(atomicUserStories: AtomicUserStory[]) {
    await Promise.all(atomicUserStories.map(atomicUserStory => this.USApplication.create(atomicUserStory)));
}

public async createTaskBacklog(backlogTasks: TaskBacklog[]) {
    await Promise.all(backlogTasks.map(task => this.taskApplication.create(task)));
}

public async createTimeBoxes(timeBoxes: TimeBox[]) {
    await Promise.all(timeBoxes.map(timeBox => this.timeBoxApplication.create(timeBox)));
}

public async createPlanningItem(timeBoxes: TimeBox[]) {
    await Promise.all(timeBoxes.map(timeBox => this.planningApplication.createPlanning(timeBox)));
}

}   