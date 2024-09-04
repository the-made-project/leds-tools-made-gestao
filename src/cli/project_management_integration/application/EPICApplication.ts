import { Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { EventEmitter } from 'events';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from "path";

type EpicX = {
    id: string;
    key: string;
    self: string;
    type: string;
  };
  
type DataX = {
   epics: EpicX[];
 };


export class EPICApplication extends IssueAbstractApplication {

    eventEmitter: EventEmitter

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string,eventEmitter: EventEmitter){
        super(email,apiToken,host,projectKey,target_folder)
        
        this.eventEmitter = eventEmitter
    }

    public async create(epic: Epic) {

        const id = `${epic.id.toLowerCase()}`
    
        if (!this.idExists(id, this.jsonDAO)){
            await this._create(epic)
            
        }             

        this.eventEmitter.emit('epicCreated', epic);
        
    }

    private async _create (epic: Epic){
        
        
        await this.createEpicWithOutProcess (epic)
    }

    private async createEpicWithOutProcess(epic: Epic){
        
        let labels = epic.label ? Util.appendValue(epic.label,epic.labelx): []

        this.jiraIntegrationService.createEPIC(epic.name || "",epic.description || "", undefined, labels )
        .then(async (result) => {
            
            const epicID = epic.id.toLowerCase()

            await this.save(epicID, result)    
            
            }).catch(error => {
            console.error(error);
        });    
    }


    
   private async save(epicID:any, result: any) {
    
    // Configuração do LowDB
    const ISSUEPATH = path.join(this.DB_PATH, 'issuesnovo.json');
    
    const adapter = new JSONFile<DataX>(ISSUEPATH); 
    const defaultData: DataX = { epics: [] };

    const db = new Low<DataX>(adapter,defaultData)

    await db.read();
  
    // Inicializa o banco de dados com um array vazio se estiver vazio
    db.data ||= defaultData;
    await db.write();

    // Novo objeto Epic
    const newEpic: EpicX = {
        id: "11593",
        key: "PROJ2-36",
        self: "https://conectafapes.atlassian.net/rest/api/3/issue/11593",
        type: "epic"
    };

    // Adicionar o novo epic ao array
    if (db.data?.epics) {
        db.data.epics.push(newEpic);  // Adiciona o novo epic
     }

    // Escrever os dados no arquivo
    await db.write();
   }

}