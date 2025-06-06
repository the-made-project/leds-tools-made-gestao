
import { AtomicUserStory, Epic, isTimeBox, Model, PlanningItem, TaskBacklog} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

import {SprintItem, /*TimeBox,*/ Person, Issue} from "made-report-lib";

import {TimeBoxBuilder} from './builders/TimeBoxBuilder.js';

export class TimeBoxApplication extends AbstractApplication {
    
    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "timebox.json"
    }
    
    public async create() {
        
       const sprints = this.model.components.filter(isTimeBox)

       sprints.map (async sprint => {
        
        const sprintItems = (await Promise.all(sprint.sprintBacklog?.planningItems.flatMap(item => this.createTask(item)) as unknown as SprintItem[])).flatMap (item => item)
        

        const instance = new TimeBoxBuilder()
            .setId(sprint.id)
            .setName(sprint.name ?? "")
            .setDescription(sprint.description ?? "")
            .setStartDate(sprint.startDate ?? "")
            .setEndDate(sprint.endDate ?? "")
            .setStatus(sprint.status ?? "PLANNED")
            .setSprintItems(sprintItems)
            .build()
        
        this.saveorUpdate(instance)
        await this.addItem(instance)
       })

       await  this.clean()
           
    }
    
    // ter apenas tarefas
    private async createTask (item:PlanningItem){     
           
        const tasks: Map<string, TaskBacklog> = new Map();
        
        if (item.backlogItem.ref?.$type == Epic){
            
            item.backlogItem.ref?.userstories.map(us => us.tasks.map(task => tasks.set(`${item.backlogItem.ref?.$container.id.toLocaleLowerCase()}.${item.backlogItem.ref?.id.toLocaleLowerCase()}.${us.id.toLocaleLowerCase()}.${task.id.toLocaleLowerCase()}`,task)))
        }

        if (item.backlogItem.ref?.$type == AtomicUserStory){
            item.backlogItem.ref?.tasks.map(task => tasks.set(`${item.backlogItem.ref?.$container.id.toLocaleLowerCase()}.${item.backlogItem.ref?.id.toLocaleLowerCase()}.${task.id.toLocaleLowerCase()}`,task))
        } 

        if (item.backlogItem.ref?.$type == TaskBacklog){
            tasks.set(`${item.backlogItem.ref?.$container.id.toLocaleLowerCase()}.${item.backlogItem.ref?.id.toLocaleLowerCase()}`,item.backlogItem.ref)
        }

        let response: SprintItem[] = []

        tasks.forEach (async (task, key) => {
            response.push({
                                
                id: key ?? "",                
                assignee: {
                    id: item.assignee?.ref?.id,  
                    name: item.assignee?.ref?.name,
                    email: item.assignee?.ref?.email
                } as Person,
                issue: {                    
                    id: key ?? "",
                    title: task.name ?? "" ,
                    description: task.description ?? "",
                    type: task.$type.toLocaleLowerCase() ?? "",  
                    depends: await this.createDependece(task)                  
                    
                },
    
                startDate: item.startDate,
                dueDate: item.dueDate,
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


