import { Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { expandToStringWithNL } from "langium/generate";
import {IssuesDTO, TimeBoxDTO} from '../../../project_management_integration/dto/models.js'
import { ThroughputGenerator, SprintData } from './chart/Throughput.js';
import { CumulativeFlowDiagram } from './chart/CumulativeFlowDiagram.js';
import { SprintMonteCarlo, SprintDataMC } from "./chart/MonteCarlo.js";
export class MarkdownTimeBoxService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    jsonFile: string
    DB_PATH: string
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'timeboxes')
        this.jsonFile = "timebox.json"
        this.DB_PATH = db_path
    }


    public async create(){

        const timeBoxes = await this.retrive();

        const sprintData: SprintData = {
          startDate: "2024-01-22T11:00:00.000Z",
          endDate: "2024-01-26T15:00:00.000Z",
          name: "Sprint 3 - Low Code",
          assignees: [
            {
              issue: "SLAVE-44",
              startDate: "2024-01-22T09:00:00.000Z",
              status: "Concluído"
            },
            {
              issue: "SLAVE-45",
              startDate: "2024-01-22T09:00:00.000Z",
              status: "Concluído"
            },
            {
              issue: "SLAVE-46",
              startDate: "2024-01-22T09:00:00.000Z",
              status: "Em Andamento"
            },
            {
              issue: "SLAVE-47",
              startDate: "2024-01-22T09:00:00.000Z",
              status: "A Fazer"
            },
            {
              issue: "SLAVE-48",
              startDate: "2024-01-22T09:00:00.000Z",
              status: "A Fazer"
            }
          ]
        };
      
         // Dados de exemplo
const sprintDatax: SprintData = {
  startDate: "2024-01-22T11:00:00.000Z",
  endDate: "2024-01-26T15:00:00.000Z",
  name: "Sprint 3 - Low Code",
  assignees: [
    { issue: "SLAVE-44", startDate: "2024-01-22T09:00:00.000Z", status: "A Fazer" },
    { issue: "SLAVE-45", startDate: "2024-01-22T09:00:00.000Z", status: "A Fazer" },
    { issue: "SLAVE-46", startDate: "2024-01-22T09:00:00.000Z", status: "A Fazer" },
    { issue: "SLAVE-47", startDate: "2024-01-22T09:00:00.000Z", status: "A Fazer" },
    { issue: "SLAVE-48", startDate: "2024-01-22T09:00:00.000Z", status: "A Fazer" },
    { issue: "SLAVE-49", startDate: "2024-01-23T09:00:00.000Z", status: "Em Andamento" },
    { issue: "SLAVE-50", startDate: "2024-01-23T09:00:00.000Z", status: "Em Andamento" },
    { issue: "SLAVE-51", startDate: "2024-01-23T09:00:00.000Z", status: "Concluído" },
    { issue: "SLAVE-52", startDate: "2024-01-24T09:00:00.000Z", status: "Em Andamento" },
    { issue: "SLAVE-53", startDate: "2024-01-24T09:00:00.000Z", status: "Concluído" },
    { issue: "SLAVE-54", startDate: "2024-01-24T09:00:00.000Z", status: "Concluído" },
    { issue: "SLAVE-55", startDate: "2024-01-25T09:00:00.000Z", status: "Concluído" },
    { issue: "SLAVE-56", startDate: "2024-01-25T09:00:00.000Z", status: "Concluído" },
    { issue: "SLAVE-57", startDate: "2024-01-26T09:00:00.000Z", status: "Concluído" }
  ]
};




        timeBoxes.forEach (timebox  =>{
            
            fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/${timebox.id}.md`), this.createTimeBoxExport(timebox))
            
            const generator = new ThroughputGenerator(sprintData,this.TIMEBOX_PATH+`/throughput-${timebox.id}.svg`);
            generator.generate();
                        
            // Gerar o CFD
            const generatorx = new CumulativeFlowDiagram(sprintDatax,this.TIMEBOX_PATH+`/cfd-${timebox.id}.svg`);
            generatorx.generate();   
        } );
                
    }

    private createTimeBoxExport(timeBox: TimeBoxDTO):string {



 
// Exemplo de uso
const sprintDataMC: SprintDataMC = {
  startDate: "2024-01-22T11:00:00.000Z",
  endDate: "2024-01-26T15:00:00.000Z",
  name: "Sprint 3 - Low Code",
  tasks: [
    {
      issue: "SLAVE-44",
      startDate: "2024-01-22T09:00:00.000Z",
      completedDate: "2024-01-22T17:00:00.000Z",
      status: "Concluído"
    },
    {
      issue: "SLAVE-45",
      startDate: "2024-01-22T09:00:00.000Z",
      completedDate: "2024-01-23T10:00:00.000Z",
      status: "Concluído"
    },
    {
      issue: "SLAVE-46",
      startDate: "2024-01-22T09:00:00.000Z",
      status: "Em Andamento"
    },
    {
      issue: "SLAVE-47",
      startDate: "2024-01-22T09:00:00.000Z",
      status: "A Fazer"
    },
    {
      issue: "SLAVE-48",
      startDate: "2024-01-22T09:00:00.000Z",
      status: "A Fazer"
    },
    {
      issue: "SLAVE-49",
      startDate: "2024-01-22T09:00:00.000Z",
      completedDate: "2024-01-23T15:00:00.000Z",
      status: "Concluído"
    }
  ]
};

      // Gerar simulação
      const monteCarlo = new SprintMonteCarlo(sprintDataMC,10000);
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
        * **Status**: ${timeBox.state?.toUpperCase()}
        
        ## Sprint Backlog

        |ID |Nome |Resposável |Data de Inicío | Data Planejada | Status|
        |:----    |:----|:--------  |:-------:       | :----------:  | :---: |
        ${timeBox.assignees?.map(assignee => `|${assignee.issue.toLocaleUpperCase()}|${assignee.issueName?.toLocaleUpperCase() ?? "-"}|${assignee.name?.toLocaleUpperCase()}|${this.convertToBrazilianDate(assignee.startDate?? "")}|${this.convertToBrazilianDate(assignee.dueDate ?? "")}|${assignee.status?.toLocaleUpperCase()}|`).join("\n")}

        ${monteCarloAnalysis}
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