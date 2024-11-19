
import { Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

export  class IssueApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "issue.json"
    }

    

       
}