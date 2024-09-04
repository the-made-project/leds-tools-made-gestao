import { JiraIntegrationService } from "../service/JiraIntegratorService.js";
import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'

import path from "path";
import lodash from 'lodash'
import { EventEmitter } from 'events';
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';

import {IssueDTO, IssuesDTO} from '../dto/models.js'

export abstract class AbstractApplication {

  jiraIntegrationService: JiraIntegrationService
  DB_PATH: string
  objectMap!: Map<string, string>;
  eventEmitter: EventEmitter

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, eventEmitter: EventEmitter) {
        Util.mkdirSync(target_folder)
        
        this.DB_PATH = createPath(target_folder, 'db')
        this.eventEmitter = eventEmitter
        this.jiraIntegrationService = new JiraIntegrationService(email, apiToken, host, projectKey);
  }

  protected async _idExists(id:string){
    
    const ISSUEPATH = path.join(this.DB_PATH, 'issue.json');

    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { issues: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)
    await db.read()
    
    const exists = lodash.chain(db.data).get('issues').some({ internalId: id }).value();
    
    console.log(exists);

    if (exists) return true;
    
    return false;

}


  protected async save(issueDTO: IssueDTO) {
    
    const ISSUEPATH = path.join(this.DB_PATH, 'issue.json');    
    const adapter = new JSONFileSync <IssuesDTO>(ISSUEPATH); 
    const defaultData: IssuesDTO = { issues: [] };

    const db = new LowSync<IssuesDTO>(adapter,defaultData)

    await db.read();
    db.data ||= defaultData;
    await db.write();

    
    if (db.data?.issues) {
        db.data.issues.push(issueDTO);
     }

    console.log("Save")
    await db.write();
   }


}
