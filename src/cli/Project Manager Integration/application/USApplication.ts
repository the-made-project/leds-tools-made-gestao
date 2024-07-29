
import { Activity, AtomicUserStory, Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import {IssueAbstractApplication} from "./IssueAbstractApplication.js"
import { TaskApplication } from "./TaskApplication.js";

export class USApplication extends IssueAbstractApplication {

    taskApplication:TaskApplication

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){
        super(email,apiToken,host,projectKey,target_folder)

        this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder)
    }

    // Verificar se é baseado possui EPIC ou Não

    private async createWithEpic(atomicUserStory: AtomicUserStory){
        
        let epicID = atomicUserStory.epic.ref.id.toLocaleLowerCase();
        
        if (atomicUserStory.activity){

            await this.createByActivity(atomicUserStory.activity.ref,epicID)
        }else{
            await this._createWithEpic (atomicUserStory,epicID)
        }

    }

    private async createWithOutEpic (atomicUserStory: AtomicUserStory){
       
        if (atomicUserStory.activity){
            await this.createByActivityWithouEpic(atomicUserStory)
        }else{
            await this._createWithouEpic (atomicUserStory)
        }
    }

    public async create(atomicUserStory: AtomicUserStory){

        if (atomicUserStory.epic){
            await this.createWithEpic(atomicUserStory)
        }
        else{
            await this.createWithOutEpic(atomicUserStory)
        }
        
    }

    private async _createSingleUserStory(atomicUserStoryID: string, atomicUserStory: AtomicUserStory, parent?: string){
        
        let description = atomicUserStory.description + "" + atomicUserStory?.activity?.ref?.description
        
        let labels = Util.appendValue(atomicUserStory.label,atomicUserStory.labelx)
        
        let labelActivity = atomicUserStory.activity.ref.label? Util.appendValue(atomicUserStory.activity.ref.label,atomicUserStory.activity.ref.labelx): []

        labels = labels.concat(labelActivity)

        await this.jiraIntegrationService.createUserStory(atomicUserStory.name,description,parent,labels).then(async (result) => {
            
            await this.save(atomicUserStoryID,result) 
                      
        }).catch(error => {
            console.error(error);
        });
    }
    private async _createWithEpic(atomicUserStory: AtomicUserStory,epicID: string){

        const atomicUserStoryID = epicID? `${epicID}.${atomicUserStory.id.toLowerCase()}` : `${atomicUserStory.id.toLowerCase()}`
        
        if (!this.idExists(atomicUserStoryID, this.jsonDAO)){
            
            let result = await super.readByKey(epicID, this.jsonDAO)
            const key = (result as any).key 
          
            await this._createSingleUserStory(atomicUserStoryID,atomicUserStory,key)
        }
    }

    private async _createWithouEpic(atomicUserStory: AtomicUserStory){

        const atomicUserStoryID = `${atomicUserStory.id.toLowerCase()}`
        
        if (!this.idExists(atomicUserStoryID, this.jsonDAO)){

            await this._createSingleUserStory(atomicUserStoryID,atomicUserStory)
        }
    }

    public async createByActivityWithouEpic(atomicUserStory: AtomicUserStory) {

        var activityID = atomicUserStory.activity.ref.id.toLowerCase()
        
        activityID = `${atomicUserStory.id.toLowerCase()}.${activityID}`

        let labels = Util.appendValue(atomicUserStory.label,atomicUserStory.labelx)
        
        if (!this.idExists(activityID, this.jsonDAO)){

            await this.jiraIntegrationService.createUserStory(atomicUserStory.name,atomicUserStory.activity.ref.description,undefined, labels).then(result => {
            
                this.save(activityID,result) 
            
                const key = (result as any).key 
                
                atomicUserStory.activity.ref.tasks.map(async task => await this.taskApplication.createByTask(task,key,"",activityID))
                
            }).catch(error => {
                console.error(error);
            });      
        }  

    }
    public async createByActivity(activity: Activity, epicID: string, epic?:Epic) {
        
        var activityID = activity.id.toLowerCase()

        let labels = Util.appendValue(activity.label,activity.labelx)
        let labelsEpic = Util.appendValue(epic.label,epic.labelx)

        labels = labels.concat(labelsEpic)

        if (epicID){
            activityID = `${epic.id.toLowerCase()}.${activityID}`
        }
        
        var activity_name = activity.name
        
        if (epic.replace){
            activity_name = epic.name.replace(epic.replace,activity.name)
        }    

        if (!this.idExists(activityID, this.jsonDAO)){

            await this.jiraIntegrationService.createUserStory(activity_name,activity.description, epicID,labels).then(result => {
            
                this.save(activityID,result) 
            
                const key = (result as any).key 
                
                activity.tasks.map(async task => await this.taskApplication.createByTask(task,key,epic.id.toLowerCase(),activity.id.toLowerCase()))
                
            }).catch(error => {
                console.error(error);
            });      
            }  

    }

    private save(ID:any, result:any,) {

        super.saveOnFile(ID, result, this.jsonDAO, "atomicuserstory")  
   }
}