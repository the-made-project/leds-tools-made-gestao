
import { AtomicUserStory, Epic, isTimeBox, Model, PlanningItem, TaskBacklog} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

import {SprintItem, TimeBox, Person, Issue} from "../../model/models.js"

export class TimeBoxApplication extends AbstractApplication {
    
    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "timebox.json"
    }
    
    public async create() {
        
       const sprints = this.model.components.filter(isTimeBox)

       sprints.map (async sprint => {

        const instance: TimeBox = {
            id: sprint.id,
            name: sprint.name?? "",
            description: sprint.description ?? "",
            startDate: sprint.startDate ?? "",
            endDate: sprint.endDate ?? "",
            status: sprint.status ?? "PLANNED",
            sprintItems: await Promise.all(sprint.sprintBacklog?.planningItems.map(item => this.createTask(item)) as unknown as SprintItem[])

        }
        this.saveorUpdate(instance)
        await this.addItem(instance)
       })
       await  this.clean()
           
    }
    
    // ter apenas tarefas
    private async createTask (item:PlanningItem){
        let tasks: TaskBacklog[] = []

        if (item.backlogItem.ref?.$type == Epic){
            item.backlogItem.ref?.userstories.map(us => us.tasks.map(task => tasks.push(task)))
        }

        if (item.backlogItem.ref?.$type == AtomicUserStory){
            item.backlogItem.ref?.tasks.map(task => tasks.push(task))
        } 

        if (item.backlogItem.ref?.$type == TaskBacklog){
            tasks.push(item.backlogItem.ref)
        }

        let response: SprintItem[] = []

        tasks.map (async task => {
            response.push({
                                
                id: task.id.toLocaleLowerCase() ?? "",                
                assignee: {
                    id: item.assignee?.ref?.id,  
                    name: item.assignee?.ref?.name,
                    email: item.assignee?.ref?.email
                } as Person,
                issue: {                    
                    id: task.id.toLocaleLowerCase() ?? "",
                    title: task.name ?? "" ,
                    description: task.description ?? "",
                    type: task.$type.toLocaleLowerCase() ?? "",  
                    depends: await this.createDependece(task)                  
                    
                },
    
                startDate: item.startDate,
                dueDate: item.duedate,
                completedDate:item.completedDate,
                status:item.status ?? "TODO"
    
            })
        })

        return response 
    }
    
    private async createDependece(task: TaskBacklog){
        let issues: Issue[] = []

        if (task.depend) {
            if (task.depend.$refNode?.text.toLocaleLowerCase() && task.depend.ref?.$type.toLocaleLowerCase()){
                issues.push({id: task.depend.$refNode.text.toLocaleLowerCase(), type: task.depend.ref.$type.toLocaleLowerCase()})
            }
        }
        await task.depends.map (async dep => await issues.push({id:dep.$refNode?.text.toLocaleLowerCase() ?? "", type:dep.ref?.$type.toLocaleLowerCase() ?? "" }))
            

        return issues
    }
    
           
}


