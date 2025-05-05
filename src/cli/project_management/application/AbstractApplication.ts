import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'

import path from "path";
import lodash from 'lodash'
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { Mutex } from 'async-mutex';
import {IssuesDTO,Issue} from "made-report-lib";
import { Model } from '../../../language/generated/ast.js';

const mutex = new Mutex();

export abstract class AbstractApplication {

  
  DB_PATH: string  
  model: Model  
  jsonFile: string
  protected items: Map<string, any>;

  constructor(target_folder: string, model: Model ) {
        Util.mkdirSync(target_folder)
        this.model = model
        this.DB_PATH = createPath(target_folder, 'db')        
        this.jsonFile = "data.json"
        this.items = new Map<string, any>();
  }

 

protected async addItem (value:any){
  const id = value.id.toLocaleLowerCase()
  this.items.set(id, value)
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

  protected async createAndSave(parentID: string, data: any){
    const issue = await this.createIssue (parentID, data)
    await this.saveorUpdate (issue)
  }

  protected async createIssue (parentID: string, data: any){
    const id = parentID+"."+data.id.toLocaleLowerCase()
    let depends:  Issue[] = []

    const issue: Issue = {
      
      id: id,
      title: data.name,
      description: data.description ?? "",
      type: data.$type.toLocaleLowerCase()
    }
   
   if (data.userstories){
      if (data.userstories.length >0){    
       issue.issues = await Promise.all(data.userstories.map(async (value:any) => await this.createIssue(id,value))) ??[]
    }
  }

  if (data.tasks){
    if (data.tasks.length >0){    
     issue.issues = await Promise.all(data.tasks.map(async (value:any) => await this.createIssue(id, value))) ??[]
    }
  }

    if (data.depends){
      if (data.depends.length >0){        
        await Promise.all(data.depends?.map(async (value:any) => 
          depends.push ({
            id:value.$refNode?.text.toLocaleLowerCase()
          }as Issue )
    
        ))
        	     
    }

    if (data.depend){
      depends.push ({
        id:data.depend.$refNode?.text.toLocaleLowerCase()
      }as Issue )
    }
  }

  issue.depends = depends

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

  protected async remove(issueId: string) {
    await mutex.runExclusive(async () => {
        const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);    
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);

        await db.read();
        db.data ||= defaultData;
        
        if (db.data?.data) {
            // Encontra o índice do item a ser removido
            const itemIndex = db.data.data.findIndex(item => item.id === issueId);
            
            // Se encontrou o item, remove-o do array
            if (itemIndex !== -1) {
                db.data.data.splice(itemIndex, 1);
                await db.write();
                return true;
            }
            return false;
        }
        return false;
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

  protected async retriveAll(){
      
    const ISSUEPATH = path.join(this.DB_PATH, this.jsonFile);
    
    const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
    const defaultData: IssuesDTO = { data: [] };

    const db = new LowSync<IssuesDTO>(adapter, defaultData);
    await db.read();
    
    return db.data.data.sort((a, b) => {
        return Number(a.id) - Number(b.id);
    }); 
    
  }  

  protected async clean(){
    const issues = this.retriveAll();
    (await issues).map (issue => {
        const id = issue.id
        const result =  this.items.has(id)
        //Caso não existe o ID apagar
        if (!result){
            this.remove(issue.id)
        }
    })
    // criar uma lista de issues com ID, usar uma hash para isso
    // caso não existe ... remover
    //depois é necessário remover os filhos de um arvore, US que nao existem mais de uma EPIC, e task qeu nao existem mais em um US ou epic
}
  
 
}