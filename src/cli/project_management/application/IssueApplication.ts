
import { isAtomicUserStory, isBacklog,  isEpic, isTaskBacklog, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

export  class IssueApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "issue.json"
        
    }
    

    public async create(){
        const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isEpic));
        const atomicUserStories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isAtomicUserStory));
        const tasks = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isTaskBacklog));
        
        epics.map (async value => {
            if (!value.process){
                await this.createAndSave(value.$container.id.toLocaleLowerCase(), value)
                
            }
            await this.addItem(value)
            
        })

        atomicUserStories.map (async value => {
            if (!value.activity){
                await this.createAndSave(value.$container.id.toLocaleLowerCase(),value)
            
            }
            await this.addItem(value)
        })

        tasks.map (async value => {
            await this.createAndSave(value.$container.id.toLocaleLowerCase(),value)
            await this.addItem(value)
        })

        // Falta Criar os EPICs, Stories e Tasks baseados. 
        
        await this.clean()

    }

    protected override async addItem (value:any){
        const id = value.$container.id.toLocaleLowerCase()+"."+value.id.toLocaleLowerCase()
        this.items.set(id, value)
    }

       
}