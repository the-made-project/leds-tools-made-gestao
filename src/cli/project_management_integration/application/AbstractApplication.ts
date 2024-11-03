import { JiraIntegrationService, Synchronized } from "../service/JiraIntegratorService.js";
import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'

import path from "path";
import lodash from 'lodash'
import { EventEmitter } from 'events';
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { Mutex } from 'async-mutex';
import {IssuesDTO} from '../dto/models.js'

const mutex = new Mutex();

export abstract class AbstractApplication implements Synchronized{

  jiraIntegrationService: JiraIntegrationService
  DB_PATH: string  
  eventEmitter: EventEmitter
  jsonFile: string
  projectKey:string

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, eventEmitter: EventEmitter) {
        Util.mkdirSync(target_folder)
        
        this.DB_PATH = createPath(target_folder, 'db')
        this.eventEmitter = eventEmitter
        this.projectKey = projectKey
        this.jiraIntegrationService = new JiraIntegrationService(email, apiToken, host, projectKey);
        this.jsonFile = "data.json"
  }

  protected async _idExists(id:string){
    
    const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);

    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)
    await db.read()
    
    const exists = lodash.chain(db.data).get('data').some({ internalId: id }).value();
    
    if (exists) return true;
    
    return false;

  }

  protected async retrive(id:string){
    
    const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);

    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)
    await db.read()
    
    return lodash.chain(db.data).get('data').find({ internalId: id }).value();    
    
  }

  protected async retriveByExternal(id:string){
    
    const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);

    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)
    await db.read()
    
    return lodash.chain(db.data).get('data').find({ id: id }).value();    
    
  }

  protected async retriveByExternalData(data:string){
    
    const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);

    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)
    await db.read()
    
    return lodash.chain(db.data).get('data').find(data).value();    
    
  }


  protected async save(issueDTO: any) {
    await mutex.runExclusive(async () => {
    const ISSUEPATH = path.join(this.DB_PATH,  this.jsonFile);    
    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)

    await db.read();
    db.data ||= defaultData;
    
    if (db.data?.data) {
        db.data.data.push(issueDTO);
     }
    
    await db.write();

   });
  }

  protected async update(issueId: string, newData: Partial<any>) {
    await mutex.runExclusive(async () => {
        const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        
        // Ler o banco de dados
        await db.read();
        db.data ||= defaultData;

        // Encontra o índice do item que deseja atualizar
        const issueIndex = db.data.data.findIndex((issue) => issue.id === issueId);

        if (issueIndex !== -1) {
            // Atualiza o item com os novos dados
            db.data.data[issueIndex] = { ...db.data.data[issueIndex], ...newData };
            await db.write();            
        } 
    });
}

   public async execute(data: any): Promise<boolean>{
    return false

   }
  
 
}
