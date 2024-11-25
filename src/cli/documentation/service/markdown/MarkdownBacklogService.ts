import {  Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';

import {IssuesDTO,TimeBox} from '../../../model/models.js'
import { ProjectMetricsGenerator } from "./chart/project/ProjectMetricsGenerator.js";
import { BacklogMarkdownConverter } from "./report/BacklogReport.js";


export class MarkdownBacklogService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string    
    jsonTimeBox: string
    jsonFileBacklog:string
    DB_PATH: string
    sprintData: TimeBox[] 
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')        
        this.jsonTimeBox = "timebox.json"
        this.jsonFileBacklog = "backlog.json"
        this.DB_PATH = db_path
        this.sprintData = []
    }


    public async create(){

        const backlogs = await this.retrive(this.jsonFileBacklog);        
        
        const converter = new BacklogMarkdownConverter();
        const markdown = converter.convertBacklogsToMarkdown(backlogs);
        const outputDirBacklolg = path.join(this.MANAGEMENT_PATH, '02_backlogs.md');

        fs.writeFileSync(outputDirBacklolg, markdown, 'utf8');

        this.sprintData = await this.retrive(this.jsonTimeBox); 
        const generator = new ProjectMetricsGenerator(this.sprintData);        
  
        try {
            await generator.generateFiles(this.MANAGEMENT_PATH);
           
        } catch (error) {
            console.error('Erro ao gerar relatórios:', error);
        }
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