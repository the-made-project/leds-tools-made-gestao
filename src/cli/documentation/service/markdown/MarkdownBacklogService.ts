import { Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { expandToStringWithNL } from "langium/generate";
import {Backlog, IssuesDTO,TimeBox} from '../../../model/models.js'
import { ProjectMetricsGenerator } from "./chart/project/ProjectMetricsGenerator.js";


export class MarkdownBacklogService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    jsonTimeBox: string
    jsonFileBacklog:string
    DB_PATH: string
    sprintData: TimeBox[] 
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'backlogs')
        this.jsonTimeBox = "timebox.json"
        this.jsonFileBacklog = "backlog.json"
        this.DB_PATH = db_path
        this.sprintData = []
    }


    public async create(){

        const backlogs = await this.retrive(this.jsonFileBacklog);        
        fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/backlog.md`), this.createDocument(backlogs))
        
        this.sprintData = await this.retrive(this.jsonTimeBox); 
        const generator = new ProjectMetricsGenerator(this.sprintData);
        const outputDir = path.join(this.TIMEBOX_PATH, 'reports');
  
        try {
            await generator.generateFiles(outputDir);
           
        } catch (error) {
            console.error('Erro ao gerar relatórios:', error);
        }
    }

    // Colocar o status de cada Issue no backlog, varrendo o sprints

    private createDocument(backlogs:Backlog[]){
        return expandToStringWithNL`
        ---
        title: "Backlog"
        sidebar_position: 1
        ---
        ${backlogs.map(backlog => this.createBacklog(backlog)).join(`\n`)}       
        `
    }

    private createBacklog (backlog: Backlog){
        return expandToStringWithNL`
        ## ${backlog.name?.toLocaleUpperCase() ?? backlog.id.toLocaleUpperCase()}
        |ID |Nome |Descrição | Type | Status|
        |:--|:----|:-------- |:----:| :---: |
        ${backlog.issues?.map(issue=> `|${issue.id.toLocaleUpperCase() ?? "-"}|${issue.title?.toLocaleUpperCase() ?? "-"}|${issue.description?.toLocaleUpperCase() ?? "-"}|${issue.type.toLocaleUpperCase() ?? "-"}|${issue.status?.toLocaleUpperCase() ?? "-"}|`).join("\n")}
        `
    }

    protected async retrive(database: string){
    
        const ISSUEPATH = path.join(this.DB_PATH, database);
        
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        await db.read();
        
        return db.data.data.sort((a, b) => {
            return Number(a.id) - Number(b.id);
        }); 
        
    }   
   

}