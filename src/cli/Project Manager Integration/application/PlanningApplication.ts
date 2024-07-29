import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { TimeBox } from "../../../language/generated/ast.js"
import { AssigneeDAO } from "../dao/AssigneeDAO.js";
import { JsonFileCRUD } from "../dao/JsonFileCRUD.js";
import { IssueDAO } from "../dao/IssueDAO.js";

export class PlanningApplication extends IssueAbstractApplication {
    
    issueDAO: JsonFileCRUD

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){

        super(email,apiToken,host,projectKey,target_folder)
        
        this.objectMap = new Map<string, string>();

        this.jsonDAO = new AssigneeDAO(this.DB_PATH)

        this.issueDAO = new IssueDAO(this.DB_PATH)
       
    }

    public async processUser(){
        await this.jiraIntegrationService.getUsers().then(result => {
            
            if (Array.isArray(result)){
                result.forEach((item: any) => {
                    
                    if (item.emailAddress){
                        this.objectMap.set(item.emailAddress,item.accountId)
                    }
                    
                });
            }
            
        });
        
        
    }
    private async _create (email:string, key: string){
        
        if ( email && key ){

            
            const accountId = this.objectMap.get(email.toLowerCase())
            const id = `${key.toLowerCase()}.${accountId.toLowerCase()}`
            console.log (id)
            if (!this.idExists(id, this.jsonDAO)){
                
                await this.jiraIntegrationService.assigneTeamMemberIssue(key, accountId).then(result => {
                                      
                    const value = {
                        "issueId": key,
                        "accountId": accountId
                    }
                   
                    this.save(id,value)
                     
                });
            }
            
             
        }
    }
    public async createPlanning (timeBox:TimeBox){
       
        timeBox?.plannig?.planningItems.map(async planningItem => 
        {
            const email = planningItem?.assigner?.ref?.email
            let itemId = planningItem?.item?.ref.id.toLowerCase() ?? planningItem?.itemString.toLowerCase()
            
            let issues = [];
            
            const response = this.issueDAO.readbyPartOfKey (itemId)       

            for (const value in response){
              const data = response[value]
              const type = (data as any).type
    
              if (type !="epic"){
                const key = (data as any).key
                issues.push (key)
              }
              
            }                      

            for (const id in issues){                
                this._create (email,issues[id])
            }
            
           
        })
    
    }

    private save(id:any, result:any,) {

        super.saveOnFile(id, result, this.jsonDAO, "assignees")  
   }
}