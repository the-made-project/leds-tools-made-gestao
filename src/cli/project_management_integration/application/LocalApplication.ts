import {  isBacklog, isEpic, Model } from "../../../language/generated/ast.js"

import { PersonApplication } from "./PersonApplication.js";

import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

export class LocalApplication {

  timeBoxApplication: TimeBoxApplication
  teamApplication: TeamApplication
  personApplication: PersonApplication
  model: Model
  

  constructor( target_folder:string, model: Model){

      this.model = model

      this.timeBoxApplication = new TimeBoxApplication(target_folder,model)

      this.teamApplication = new TeamApplication(target_folder,model)

      this.personApplication = new PersonApplication(target_folder,model)

      
    }
    
    
    public async createModel() {
      
      //Buscando elementos
      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
      //const usWithoutEPIC = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic == undefined))
      //const timeBox = this.model.components.filter(isTimeBox)

      // Criando EPIC e suas US e TASK
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));

      // Criando as US que não possuem task

      //await Promise.all(usWithoutEPIC.map(async us => await this.uSApplication.createWithOutEpic(us)));

      
      // Criando os Sprint
      //await Promise.all(timeBox.map(timeBox => this.timeBoxApplication.create(timeBox)));
      
  }   
    

}   