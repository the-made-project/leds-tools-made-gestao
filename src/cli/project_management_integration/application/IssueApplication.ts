
import { isBacklog, isEpic, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import {Issue} from "../../model/models.js"

export  class IssueApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "issue.json"
    }

    public create(){
        const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
        
        epics.map (async epic => {
            const value = await this.retrive(epic.id)
            console.log (value)
            if (!value) {
                const issue: Issue = {
                    id: typeof epic.id === "string" ? epic.id.toLocaleLowerCase() : "",
                    type: "epic",
                    title: epic.name ?? "",
                    description: epic.description ?? "",
                };
                this.save(issue)
            }
            
        });

    }

    

       
}