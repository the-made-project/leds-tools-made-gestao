import { Epic, isBacklog, isEpic, Model ,TimeBox, isAtomicUserStory, AtomicUserStory, TaskBacklog, isTimeBox, isTaskBacklog, Team} from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { USApplication } from "./USApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { PlanningApplication } from "./PlanningApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { createMadeServices } from "../../../language/made-module.js";
import { EmptyFileSystem} from 'langium';
import { CancellationToken } from "vscode-languageserver";
import path from "path";
import * as fs from 'fs';

const services  = createMadeServices(EmptyFileSystem);     

export class JiraApplication {

  epicApplication: EPICApplication
  USApplication: USApplication
  taskApplication : TaskApplication
  timeBoxApplication : TimeBoxApplication
  planningApplication: PlanningApplication
  teamApplication: TeamApplication
  target_folder: string

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){

      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder)
      this.USApplication = new USApplication(email,apiToken,host,projectKey,target_folder)
      this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder)
      this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder)
      this.planningApplication = new PlanningApplication(email,apiToken,host,projectKey,target_folder)
      this.teamApplication = new TeamApplication(email,apiToken,host,projectKey,target_folder)

      this.target_folder = target_folder

    }
    
    
    public async GetProjectInformation(model: Model){
      
      
      const team: Team = {
        $type: 'Team',
        $container: model,
        id: "development",
        name: 'Team from Jira',
        label: '',
        labelx:[],
        teammember: [],
        description: 'Team from Jira'

      };
  
      //Buscando os Team Member no Jira. Não vem o e-mail,por questões de segurança, acredito que só podemos usar o ID do jira. Precisamos mudar isso depois
      // const members = await this.teamApplication.retrieveAll()
     
      //Adiciona nos componentes
       model.components.push(team)      
       console.log ("Instance")
       console.log(model)

      //criar uma funcao que criar um .made um aquivo separado e imprime as equipes e outras coisas

      
    }


    public async createModel(model: Model) {
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