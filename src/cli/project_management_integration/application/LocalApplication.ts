import {  Model } from "../../../language/generated/ast.js"
import { BacklogApplication } from "./BacklogApplication.js";
import { IssueApplication } from "./IssueApplication.js";

import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

export class LocalApplication {

  timeBoxApplication: TimeBoxApplication
  teamApplication: TeamApplication
  issueApplication: IssueApplication
  backlogApplication: BacklogApplication
  model: Model
  

  constructor( target_folder:string, model: Model){

      this.model = model

      this.timeBoxApplication = new TimeBoxApplication(target_folder,model)

      this.teamApplication = new TeamApplication(target_folder,model)

      this.issueApplication = new  IssueApplication(target_folder,model)

      this.backlogApplication = new BacklogApplication(target_folder,model)
      
    }
    
    
    public async createModel() {
      await this.teamApplication.create()
      await this.issueApplication.create()
      await this.backlogApplication.create()
    }
    

}   