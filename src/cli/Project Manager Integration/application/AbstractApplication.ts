
import { JiraIntegrationService } from "../service/JiraIntegratorService.js";
import {Util} from '../service/util.js';
import { createPath} from '../../generator-utils.js'
import { JsonFileCRUD } from "../dao/JsonFileCRUD.js";

export abstract class AbstractApplication {

    jiraIntegrationService: JiraIntegrationService
    jsonDAO: JsonFileCRUD
    DB_PATH: string
    objectMap:  Map<string,string>

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){
        Util.mkdirSync(target_folder)

        this.DB_PATH = createPath(target_folder,'db')

        this.jiraIntegrationService = new JiraIntegrationService(email,apiToken,host,projectKey);         
        
    }

    protected async saveOnFile(key:any, value:any, _function:any, type:string){

        value.type = type
    
        _function.create(key, value)
      }
    
    protected idExists (key:any, _function){
    
        return _function.idExists(key)
    
    }

    protected async readByKey(key:any,_function){
      return _function.readByKey(key)
    }

    
}