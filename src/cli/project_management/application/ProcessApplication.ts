
import { Activity, isProcess, Model, Task, Process } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { Process as ProcessData, Activity as ActivityData, Task as TaskData} from "made-report-lib";


export  class ProcessApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "process.json"
    }

    public async create(){
        
       const processes = this.model.components.filter (isProcess);

       processes.map (async process => {

         const instance = await this.createProcess(process)

         await this.saveorUpdate (instance)
       })

    }

   
    private async createProcess (process: Process): Promise<ProcessData>{
   
       
        return {
            id : process.id,
            name: process.name  ?? "",
            description: process.description ?? "", 
       
            activities:  await Promise.all(process.activities.map(async activity => await this.createActivity(activity)) ?? [])
         }
    }

    private async createActivity (activity: Activity): Promise<ActivityData>{

        return {
            id: activity.id ?? "",  
            name: activity.name ?? "",
            description: activity.description ?? "",             
            tasks:  await Promise.all(activity.tasks.map (async task => await this.createTask(task)) ?? []) 
            //depends: await Promise.all(activity.depend)
        }
    }

    

    private async createTask (task: Task): Promise<TaskData>{
        return {
            id: task.id ?? "",  
            name: task.name ?? "" ,
            description: task.description ?? "" 
        }
    }
  
       
}