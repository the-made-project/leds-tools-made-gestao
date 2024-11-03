import { Model,  Activity, Process, Task, isProcess } from "../../../../language/generated/ast.js"
import fs from "fs";
import { createPath} from '../../../generator-utils.js'
import path from 'path'
import { expandToStringWithNL } from 'langium/generate';
import { integer } from "vscode-languageserver";

export class MarkdownProcessService {

    model: Model
    target_folder:string
    PROCESS_PATH :string
    
    constructor (model: Model, target_folder:string){
        this.model = model
        this.target_folder = target_folder

        this.PROCESS_PATH = createPath(this.target_folder,'process')
    }

    public create(){
        
        const processes = this.model.components.filter(isProcess)
        
       
        fs.writeFileSync(path.join(this.PROCESS_PATH, "/README.md"), this.createProcesssesDocument(processes))
        
        processes.forEach(process =>{
            const PROCESS_INSTANCE = createPath(this.PROCESS_PATH,process.id.toLowerCase())
            fs.writeFileSync(path.join(PROCESS_INSTANCE, "/README.md"), this.createProcessDocument(process))
            
        })

    }


    private createProcesssesDocument(processes: Process[]):string {
        return expandToStringWithNL`
        # Processes
    
        ${processes.map(process => `* **[${process.name}](${process.id.toLowerCase()}/README.md)**: ${process.description ?? "-"}`).join("\n")}
        `
    }
    
    
    private createProcessDocument(process: Process): string{
        var count = 1 ;
        return expandToStringWithNL`
        # ${process.name?.toUpperCase()}
        ${process.description ?? `-`} 
        ${process.activities.map(activity => this.createActivityDocument(activity,count++)).join("\n")}`
    }
    
    private createActivityDocument(activity: Activity, index: integer):string{
        var count = 1;
        return expandToStringWithNL`
        ## ${index} - ${activity.name?.toUpperCase()}
        ${activity.description ?? `-`}
        ${activity.tasks.map(task => this.createTaskDocument(task,index,count++)).join("\n")}
        `
    }
    
    private createTaskDocument(task:Task, indexOut: integer, indexInt: integer){
        return expandToStringWithNL`
        ### ${indexOut}.${indexInt} - ${task.name?.toUpperCase()}
        ${task.description ?? `-`}
        `
    }
}