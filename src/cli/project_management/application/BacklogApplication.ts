
import {  isBacklog, Model} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
/*import {Backlog} from "made-report-lib";*/
import { BacklogBuilder } from './builders/BacklogBuilder.js';

export  class BacklogApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "backlog.json"
    }

    public async create(){
        
      const backlogs = this.model.components.filter (isBacklog);

      for (const backlog of backlogs) {
        const issues = await Promise.all(backlog.items?.map (async issue => await this.createIssue(issue.$container.id, issue)) ?? [])

        const instance = new BacklogBuilder()
            .setId(backlog.id)
            .setName(backlog.name ?? "")
            .setDescription(backlog.description ?? "")
            .setIssues(issues)
            .build()

        await this.saveorUpdate(instance)
        await this.addItem(instance)
      
      await  this.clean()
    }   

  }
       
}