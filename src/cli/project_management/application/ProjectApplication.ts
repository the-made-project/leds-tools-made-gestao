
import {  Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { Project } from "../../model/models.js";


export  class ProjectApplication extends AbstractApplication {

    

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "project.json"
        
    }
    

    public async create(){
        const project = this.model.project

        const instance: Project = {
            id: project.id.toLocaleLowerCase()?? "",
            name: project.name ?? "",
            description: project.description ?? "" ,
            startDate: project.startDate ?? "",
            dueDate: project.duedate ?? "",
            completedDate:project.completedDate ?? ""
          }
        
        await this.saveorUpdate(instance)

    }

    

       
}