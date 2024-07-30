import { Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { USApplication } from "./USApplication.js";

export class EPICApplication extends IssueAbstractApplication {

    usApplication: USApplication

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){
        super(email,apiToken,host,projectKey,target_folder)

        this.usApplication = new USApplication(email,apiToken,host,projectKey,target_folder)
    }


    public async create(epic: Epic) {

        const id = `${epic.id.toLowerCase()}`
    
        if (!this.idExists(id, this.jsonDAO)){
            await this._create(epic)
        }     
       
    }

    private async createEpicByProcess(epic: Epic){

        let description = epic.description ?? ""
        
        description = epic.process?.ref?.description ?? ""
       
        let labels = epic.label ? Util.appendValue(epic.label,epic.labelx): []
        let labelProcess = epic.process?.ref?.label? Util.appendValue(epic.process?.ref?.label ?? "",epic.process?.ref?.labelx || [""]): []

        labels = labels.concat(labelProcess)

        this.jiraIntegrationService.createEPIC(epic.name ?? "",description,undefined, labels )
        .then(result => {
            
            const key = (result as any).key 
            const epicID = epic.id.toLowerCase()

            this.save(epicID, result)  

            if (epic.process){
                epic.process?.ref?.activities.map(async activity => await this.usApplication.createByActivity(activity,key, epic))
            }      
            
            }).catch(error => {
            console.error(error);
        });    
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


    private async _create (epic: Epic){
        
        if (epic.process){
            await this.createEpicByProcess(epic)
        }
        else{
            await this.createEpicWithOutProcess(epic)
        }
        
        
    }

   private async save(epicID:any, result:any,) {

        await super.saveOnFile(epicID, result, this.jsonDAO, "epic")  
   }

}