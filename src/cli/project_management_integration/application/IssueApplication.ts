
import { isAtomicUserStory, isBacklog,  isEpic, isTaskBacklog, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
export  class IssueApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "issue.json"
    }

    public async create(){
        const epcis = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
        const atomicUserStories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory));
        const tasks = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isTaskBacklog));
        
        
        epcis.map (async value => {
            await this.createAndSave(value)
        })

        atomicUserStories.map (async value => {
            await this.createAndSave(value)
        })

        tasks.map (async value => {
            await this.createAndSave(value)
        })

    }

    

    

       
}