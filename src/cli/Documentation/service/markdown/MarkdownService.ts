import { Model} from "../../../../language/generated/ast.js"
import fs from "fs";
import { createPath} from '../../../generator-utils.js'
import path from 'path'
import { MarkdownProcessService } from "./MarkdownProcessService.js";
import { MarkdownBacklogService } from "./MarkdownBacklogService.js";
import { expandToStringWithNL } from "langium/generate";


export class MarkdownService {

    model: Model
    target_folder:string
    DOC_PATH:string

    markdownProcessService: MarkdownProcessService
    markdownBacklogService: MarkdownBacklogService

    constructor (model: Model, target_folder:string){
        this.model = model
        this.target_folder = target_folder
        this.DOC_PATH = createPath(this.target_folder,'docs')
        
        fs.mkdirSync(this.target_folder, {recursive:true})

        this.markdownProcessService = new MarkdownProcessService(model,this.DOC_PATH)
        this.markdownBacklogService = new MarkdownBacklogService(model,this.DOC_PATH)

        this.config()
    }

    private config (){
        fs.writeFileSync(path.join(this.DOC_PATH, "/README.md"), this.createMainDocument())
    
    }

    private createMainDocument():string{
        return expandToStringWithNL`
        # Documentation Overview
    
        1. [Process](./process/README.md): Describes the processes used to build the solution.
        2. [Management](./management/README.md): Presents the Team, Project Management, Backlog and TimeBox used to build the solution.    
    
        `
    }

    

    public createProcessDocumentation(){

        this.markdownProcessService.create()
        
    }

    public createManagementDocumenation(){
        this.markdownBacklogService.create()
    }

    
     

}