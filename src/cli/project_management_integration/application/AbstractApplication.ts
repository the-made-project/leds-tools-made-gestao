import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'

import path from "path";
import lodash from 'lodash'
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { Mutex } from 'async-mutex';
import {IssuesDTO,Issue} from '../../model/models.js'
import { Model } from '../../../language/generated/ast.js';

const mutex = new Mutex();

export abstract class AbstractApplication {

  
  DB_PATH: string  
  model: Model  
  jsonFile: string
  

  constructor(target_folder: string, model: Model ) {
        Util.mkdirSync(target_folder)
        this.model = model
        this.DB_PATH = createPath(target_folder, 'db')        
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
    
    return lodash.chain(db.data).get('data').find({ id: id }).value();    
    
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

  protected async createAndSave(data: any){
    const issue = await this.createIssue (data)
    await this.saveorUpdate (issue)
  }

  protected async createIssue (data: any){
    const issue: Issue = {
      id: data.id,
      title: data.name,
      description: data.description ?? "",
      type: data.$type
    }
    if (data.epic?.ref || data.userstory?.ref){
      issue.parent = await this.createIssue(data.epic?.ref || data.userstory?.ref) ?? undefined 
    }
    if (data.depends){
      issue.depends = await Promise.all(data.depends?.map(async (value:any) => 
        await this.createIssue(value))) ?? undefined
    }

    return issue
  }


  protected async saveorUpdate (data: any){
    const value = await this.retrive(data.id)
    if (!value){
      this.save (data)

    }
    else{
      this.update(data.id, data)
    }
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
