
import { isAtomicUserStory, isBacklog,  isEpic, isTaskBacklog, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
export  class IssueApplication extends AbstractApplication {

    private items: Map<string, any>;

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "issue.json"
        this.items = new Map<string, any>();
    }
    private async addItem (value:any){
        const id = value.$container.id.toLocaleLowerCase()+"."+value.id.toLocaleLowerCase()
        this.items.set(id, value)
    }

    public async create(){
        const epcis = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isEpic));
        const atomicUserStories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isAtomicUserStory));
        const tasks = this.model.components.filter(isBacklog).flatMap(backlog => backlog.items.filter(isTaskBacklog));
        
        epcis.map (async value => {
            await this.createAndSave(value.$container.id.toLocaleLowerCase(), value)
            await this.addItem(value)
        })

        atomicUserStories.map (async value => {
            await this.createAndSave(value.$container.id.toLocaleLowerCase(),value)
            await this.addItem(value)
        })

        tasks.map (async value => {
            await this.createAndSave(value.$container.id.toLocaleLowerCase(),value)
            await this.addItem(value)
        })
        
        await  this.clean()

    }

    private async clean(){
        const issues = this.retriveAll()
        ;(await issues).map (issue => {
            const id = issue.id
            const result =  this.items.has(id)
        })
        // criar uma lista de issues com ID, usar uma hash para isso
        // caso não existe ... remover
        //depois é necessário remover os filhos de um arvore, US que nao existem mais de uma EPIC, e task qeu nao existem mais em um US ou epic
    }

    

    

       
}