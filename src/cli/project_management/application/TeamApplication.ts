import { isTeam, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import {Person, Team} from "../../model/models.js"

export class TeamApplication extends AbstractApplication {
 
    constructor(target_folder: string, model: Model) {
        super(target_folder, model);  
        
        this.jsonFile = "team.json"   

    }

    public async create(){

        const teams = this.model.components.filter(isTeam);



        teams.map(async team => {

            const instance: Partial<Team> = {

                id: team.id,
                name: team.name,
                description: team.description,
                teammebers: team.teammember?.map(teammember => ({
                    id: teammember.id ?? "",
                    name: teammember.name ?? "",
                    email: teammember.email ?? "",
                  } as Person)) ?? [] 
            }
            await this.addItem(instance)
            await this.saveorUpdate(instance)
            
        })
        await  this.clean()

    }

   
    

    
}
    

  
    
