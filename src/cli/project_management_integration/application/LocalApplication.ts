import {  Model } from "../../../language/generated/ast.js"
import { IssueApplication } from "./IssueApplication.js";

import { PersonApplication } from "./PersonApplication.js";

import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

export class LocalApplication {

  timeBoxApplication: TimeBoxApplication
  teamApplication: TeamApplication
  personApplication: PersonApplication
  issueApplication: IssueApplication
  model: Model
  

  constructor( target_folder:string, model: Model){

      this.model = model

      this.timeBoxApplication = new TimeBoxApplication(target_folder,model)

      this.teamApplication = new TeamApplication(target_folder,model)

      this.personApplication = new PersonApplication(target_folder,model)

      this.issueApplication = new  IssueApplication(target_folder,model)
      
    }
    
    
    public async createModel() {
      await this.issueApplication.create()
    }
    

}   