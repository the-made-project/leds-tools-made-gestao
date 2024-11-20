import { Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { expandToStringWithNL } from "langium/generate";
import {IssuesDTO, TimeBox} from '../../../model/models.js'
import { ThroughputGenerator } from './chart/sprint/Throughput.js';
import { CumulativeFlowDiagram } from './chart/sprint/CumulativeFlowDiagram.js';
import { SprintMonteCarlo } from "./chart/sprint/MonteCarlo.js";
export class MarkdownTimeBoxService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    TIMEBOX_CHARTS_PATH :string
    jsonFile: string
    DB_PATH: string
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'timeboxes')
        this.TIMEBOX_CHARTS_PATH = createPath(this.TIMEBOX_PATH,'charts')
        this.jsonFile = "timebox.json"
        this.DB_PATH = db_path
    }

    public async create(){

        const timeBoxes = await this.retrive();

        timeBoxes.forEach (timebox  =>{
            
            fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/${timebox.id}.md`), this.createTimeBoxExport(timebox))
            
            const generator = new ThroughputGenerator(timebox,this.TIMEBOX_CHARTS_PATH+`/throughput-${timebox.id}.svg`);
            generator.generate();
                        
            // Gerar o CFD
            const generatorx = new CumulativeFlowDiagram(timebox,this.TIMEBOX_CHARTS_PATH+`/cfd-${timebox.id}.svg`);
            generatorx.generate();   
        } );
                
    }

    private createTimeBoxExport(timeBox: TimeBox):string {


     // Gerar simulação
      const monteCarlo = new SprintMonteCarlo(timeBox,10000);
      const monteCarloAnalysis = monteCarlo.generateMarkdownReport();

        return expandToStringWithNL`
        ---
        title: "${timeBox.name.toLocaleUpperCase()}"
        sidebar_position: ${timeBox.id}
        ---
        ## Dados do Sprint
        * **Goal**: - 
        * **Data Início**: ${this.convertToBrazilianDate(timeBox.startDate)}
        * **Data Fim**: ${this.convertToBrazilianDate(timeBox.endDate)}
        
        ## Sprint Backlog

        |ID |Nome |Resposável |Data de Inicío | Data Planejada | Status|
        |:----    |:----|:--------  |:-------:       | :----------:  | :---: |
        ${timeBox.sprintItems?.map(assignee => `|${assignee.issue.id.toLocaleUpperCase()}|${assignee.issue.title?.toLocaleUpperCase() ?? "-"}|${assignee.person.name?.toLocaleUpperCase()}|${this.convertToBrazilianDate(assignee.startDate?? "")}|${this.convertToBrazilianDate(assignee.dueDate ?? "")}|${assignee.status?.toLocaleUpperCase()}|`).join("\n")}

        ${monteCarloAnalysis}

        # Gráficos
        ## Throughput
        ![Throughput](./charts/throughput-${timeBox.id}.svg)
        ## Cumulative Flow
        ![ Cumulative Flow](./charts/cfd-${timeBox.id}.svg)

        `
    }

    private convertToBrazilianDate(dateString: string): string {
        if (dateString.trim().length != 0){
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        }

        return "-"
        
    }
    protected async retrive(){
    
        const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);
    
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        await db.read();

        return db.data.data.sort((a, b) => {
            return Number(a.id) - Number(b.id);
        }); 
        
      }

   

}