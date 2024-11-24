
import { isTimeBox, Model} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

import {SprintItem, TimeBox, Person} from "../../model/models.js"

export class TimeBoxApplication extends AbstractApplication {
    
    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "timebox.json"
    }

    
    

    public async create() {
        
       const sprints = this.model.components.filter(isTimeBox)

       sprints.map (sprint => {

        const instance: TimeBox = {
            id: sprint.id,
            name: sprint.name?? "",
            description: sprint.description ?? "",
            startDate: sprint.startDate ?? "",
            endDate: sprint.endDate ?? "",
            sprintItems: sprint.sprintBacklog?.planningItems.map(item => ({
                id: item.id.ref?.$container.id.toLocaleLowerCase().concat("."+item.id.ref.id.toLocaleLowerCase()),
                assignee: {
                    id: item.assignee?.ref?.id,  
                    name: item.assignee?.ref?.name,
                    email: item.assignee?.ref?.email
                } as Person,
                issue: {
                    id: item.id.ref?.id.toLocaleLowerCase() ?? "",
                    title: item.id.ref?.name ?? "" ,
                    description: item.id.ref?.description ?? "",
                    type: item.id.ref?.$type.toLocaleLowerCase() ?? ""
                },

                startDate: item.startDate,
                dueDate: item.duedate,
                completedDate:item.completedDate,
                status:item.status ?? "TODO"

            }) as unknown as SprintItem) ?? []

        }
        this.saveorUpdate(instance)
       })
           
    }


    
           
}


