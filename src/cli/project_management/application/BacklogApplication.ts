
import {  isBacklog, Model} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import {Backlog} from "made-report-lib";

export  class BacklogApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "backlog.json"
    }

    public async create(){
        
       const backlogs = this.model.components.filter (isBacklog);

       backlogs.map (async backlog => {

         const instance: Backlog = {
            id : backlog.id,
            name: backlog.name  ?? "",
            description: backlog.description ?? "", 
            issues: await Promise.all(backlog.items?.map(async (issue) => await this.createIssue(issue.$container.id,issue))) ?? [] 
         }

         await this.saveorUpdate (instance)
         await this.addItem(backlog)
       })
       await  this.clean()
    }   

    
       
}