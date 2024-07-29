import { AbstractApplication } from "./AbstractApplication.js";
import { TimeBox } from "../../../language/generated/ast.js"

import { SprintDAO } from "../dao/SprintDAO.js";
import { IssueDAO } from "../dao/IssueDAO.js";
import { JsonFileCRUD } from "../dao/JsonFileCRUD.js";


export class TimeBoxApplication extends AbstractApplication{

    issueDAO: JsonFileCRUD
    
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){

      super(email,apiToken,host,projectKey,target_folder)
      this.jsonDAO = new SprintDAO(this.DB_PATH)
      this.issueDAO = new IssueDAO(this.DB_PATH)
      
    }

    private async createSprint(timeBox: TimeBox){
      if (!this.idExists(timeBox.id.toLowerCase(), this.jsonDAO)){
        
        this.jiraIntegrationService.createSprint(timeBox.name ?? timeBox.id, timeBox.description ?? '-', timeBox.startDate ?? "", timeBox.endDate ?? "").then( async result => {
  
          await this.saveOnFile(timeBox.id.toLowerCase(), result, this.jsonDAO, "sprint")
         
        })
  
        }
    }

    private async moveIssue(timeBox: TimeBox) {
      
      const timeBoxId = timeBox.id.toLowerCase()

      const result = await this.readByKey(timeBoxId,this.jsonDAO)
      const id = (result as any).id 
      let issues = [];
      
      await timeBox.plannig.planningItems.map (async planningItem => {
        //Verificar se é um epic, user story e task e andar pela arvore

        let keyItem = planningItem.item?.ref.id.toLowerCase()
        
        if (!keyItem){
          keyItem = planningItem.itemString
        }
       
        const response = this.issueDAO.readbyPartOfKey (keyItem)       

        for (const value in response){
          const data = response[value]
          const type = (data as any).type

          if (type !="epic"){
            const key = (data as any).key
            issues.push (key)
          }
          
        }                 
       
      })

      if (issues.length){
        await this.jiraIntegrationService.moveIssueToSprint(issues,id)
      }
     
    }
    
    public async create(timeBox:TimeBox) {
      await this.createSprint (timeBox)
      await this.moveIssue(timeBox)
      }
    
}