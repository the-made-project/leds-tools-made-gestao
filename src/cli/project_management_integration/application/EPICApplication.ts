import { Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { EventEmitter } from 'events';
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import path from "path";
import lodash from 'lodash'

type EpicDTO = {
    internalId: string;
    id: string;
    key: string;
    self: string;
    type: string;
  };
  
type DataDTO = {
   epics: EpicDTO[];
 };


export class EPICApplication extends IssueAbstractApplication {

    eventEmitter: EventEmitter

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string,eventEmitter: EventEmitter){
        super(email,apiToken,host,projectKey,target_folder)
        
        this.eventEmitter = eventEmitter
    }

    public async create(epic: Epic) {

        const id = `${epic.id.toLowerCase()}`
    
        if (!this._idExists(id)){
            await this._create(epic)
            
        }             

        this.eventEmitter.emit('epicCreated', epic);
        
    }

    private async _idExists(id:string){
        const ISSUEPATH = path.join(this.DB_PATH, 'issuesnovo.json');
    
        const adapter = new JSONFileSync <DataDTO>(ISSUEPATH); 
        const defaultData: DataDTO = { epics: [] };
    
        const db = new LowSync<DataDTO>(adapter,defaultData)
        await db.read()

        return lodash.chain(db.data).get('epics').find({ internalId: id }).value()        

    }

    private async _create (epic: Epic){
        
        
        await this.createEpicWithOutProcess (epic)
    }

    private async createEpicWithOutProcess(epic: Epic){
        
        let labels = epic.label ? Util.appendValue(epic.label,epic.labelx): []

        this.jiraIntegrationService.createEPIC(epic.name || "",epic.description || "", undefined, labels )
        .then(async (result) => {
            
            const epicID = epic.id.toLowerCase()

            const newEpicDTO: EpicDTO = {
                internalId: epicID,
                id: (result).id,
                key: (result).key,
                self: (result).self,
                type: "epic"
            };

            await this.save(newEpicDTO)    
            
            }).catch(error => {
            console.error(error);
        });    
    }


    
   private async save(epic: EpicDTO) {
    
    // Configuração do LowDB
    const ISSUEPATH = path.join(this.DB_PATH, 'issuesnovo.json');
    
    const adapter = new JSONFileSync <DataDTO>(ISSUEPATH); 
    const defaultData: DataDTO = { epics: [] };

    const db = new LowSync<DataDTO>(adapter,defaultData)

    await db.read();
  
    // Inicializa o banco de dados com um array vazio se estiver vazio
    db.data ||= defaultData;
    await db.write();

    // Adicionar o novo epic ao array
    if (db.data?.epics) {
        db.data.epics.push(epic);  // Adiciona o novo epic
     }

    // Escrever os dados no arquivo
    await db.write();
   }

}