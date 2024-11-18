import { Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { expandToStringWithNL } from "langium/generate";
import {IssueDTO, IssuesDTO,TimeBoxDTO} from '../../../project_management_integration/dto/models.js'
import { ProjectMetricsGenerator } from "./chart/project/ProjectMetricsGenerator.js";


export class MarkdownBacklogService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    jsonFile: string
    jsonFileTimeBox:string
    DB_PATH: string
    sprintData: TimeBoxDTO[] 
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'backlogs')
        this.jsonFile = "issue.json"
        this.jsonFileTimeBox = "timebox.json"
        this.DB_PATH = db_path
        this.sprintData = []
    }


    public async create(){

        const backlog = await this.retrive();

        fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/backlog.md`), this.createDocument(backlog))
        this.sprintData = await this.retrive_timebox()
        const generator = new ProjectMetricsGenerator(this.sprintData);
        const outputDir = path.join(this.TIMEBOX_PATH, 'reports');
  
        try {
            await generator.generateFiles(outputDir);
            console.log('Relatórios gerados com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar relatórios:', error);
        }
    }



    protected createDocument(backlog:IssueDTO[]){
        return expandToStringWithNL`
        ---
        title: "Backlog Geral"
        sidebar_position: 1
        ---
        |ID |Nome |Descrição | Type | Status|
        |:--|:----|:-------- |:----:| :---: |
        ${backlog.map(issue=> `|[${issue.key.toLocaleUpperCase()}](${issue.self})|${issue.title?.toLocaleUpperCase() ?? "-"}|${issue.description?.toLocaleUpperCase() ?? "-"}|${issue.type.toLocaleUpperCase() ?? "-"}|${issue.status?.toLocaleUpperCase() ?? "-"}|`).join("\n")}
        `
        
    }

    protected async retrive_timebox(){
    
        const ISSUEPATH = path.join(this.DB_PATH, this.jsonFileTimeBox);
        
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        await db.read();
        
        return db.data.data.sort((a, b) => {
            return Number(a.id) - Number(b.id);
        }); 
        
    }

    protected async retrive(){
    
        const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);
        console.log (ISSUEPATH)
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        await db.read();
        
        return db.data.data.sort((a, b) => {
            return Number(a.id) - Number(b.id);
        }); 
        
      }

   

}