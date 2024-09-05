import { JiraIntegrationService } from "../service/JiraIntegratorService.js";
import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'

import path from "path";
import lodash from 'lodash'
import { EventEmitter } from 'events';
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';

import {IssuesDTO} from '../dto/models.js'

export abstract class AbstractApplication {

  jiraIntegrationService: JiraIntegrationService
  DB_PATH: string  
  eventEmitter: EventEmitter
  jsonFile: string
  
  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, eventEmitter: EventEmitter) {
        Util.mkdirSync(target_folder)
        
        this.DB_PATH = createPath(target_folder, 'db')
        this.eventEmitter = eventEmitter
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


  protected async save(issueDTO: any) {
    
    const ISSUEPATH = path.join(this.DB_PATH,  this.jsonFile);    
    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)

    await db.read();
    db.data ||= defaultData;
    await db.write();

    
    if (db.data?.data) {
        db.data.data.push(issueDTO);
     }
    
    await db.write();
   }


}
