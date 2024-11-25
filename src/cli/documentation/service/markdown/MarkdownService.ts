import { Model} from "../../../../language/generated/ast.js"
import fs from "fs";
import { createPath} from '../../../generator-utils.js'
import path from 'path'
import { MarkdownProcessService } from "./MarkdownProcessService.js";
import { MarkdownBacklogService } from "./MarkdownBacklogService.js";
import { expandToStringWithNL } from "langium/generate";
import { MarkdownTimeBoxService } from "./MarkdownTimeBoxService.js";
import { MardownRoadmapService } from "./MarkdownRoadmapService.js";


export class MarkdownService {

    model: Model
    target_folder:string
    DOC_PATH:string
    DB_PATH: string
    
    markdownProcessService: MarkdownProcessService
    markdownBacklogService: MarkdownBacklogService
    markdownTimeBoxService: MarkdownTimeBoxService
    markdownRoadmapService: MardownRoadmapService

    constructor (model: Model, target_folder:string){
        this.model = model
        this.target_folder = target_folder
        this.DOC_PATH = createPath(this.target_folder,'docs')
        this.DB_PATH = createPath(this.target_folder,'db')
        fs.mkdirSync(this.target_folder, {recursive:true})

        this.markdownProcessService = new MarkdownProcessService(model,this.DOC_PATH)
        
        this.markdownBacklogService = new MarkdownBacklogService(model,this.DOC_PATH,this.DB_PATH)
        this.markdownTimeBoxService = new MarkdownTimeBoxService(model, this.DOC_PATH, this.DB_PATH)

        this.markdownRoadmapService = new MardownRoadmapService(model, this.DOC_PATH, this.DB_PATH)
        this.config()
    }

    private config (){
        fs.writeFileSync(path.join(this.DOC_PATH, "/README.md"), this.createMainDocument())
    
    }

    private createMainDocument():string{

        return expandToStringWithNL`
        
        # Visão da Gestão do Projeto ${this.model.project.name}
        
        ${this.model.project.description}

        |Data de Inicío|Data Planejeada para Entrega|Data da Entrega Real|
        |:-------------:|:--------------------------:|:------------:|
        |${this.model.project.startDate}|${this.model.project.duedate ?? "-"}|${this.model.project.completedDate ?? "-"}|

        
        `
    }

    

    public createProcessDocumentation(){

        this.markdownProcessService.create()
        
    }

    public createManagementDocumenation(){
        this.markdownTimeBoxService.create()
        this.markdownBacklogService.create()
        this.markdownRoadmapService.create()
    }

    
     

}