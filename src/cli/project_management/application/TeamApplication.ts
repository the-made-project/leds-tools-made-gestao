import { isTeam, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import {Person/*, Team*/} from "made-lib-beta-grupo-2";
import { TeamBuilder }  from "./builders/TeamBuilder.js";

export class TeamApplication extends AbstractApplication {
 
    constructor(target_folder: string, model: Model) {
        super(target_folder, model);  
        
        this.jsonFile = "team.json"   

    }

    public async create(){

        const teams = this.model.components.filter(isTeam);

        teams.map(async team => {

            const instance = new TeamBuilder()
                .setId(team.id)
                .setName(team.name ?? "")
                .setDescription(team.description ?? "")
                .setTeamMembers(team.teammember?.map(teammember => ({
                    id: teammember.id ?? "",
                    name: teammember.name ?? "",
                    email: teammember.email ?? "",
                  } as Person)) ?? [])
                .build()

            await this.addItem(instance)
            await this.saveorUpdate(instance)
        })

        await  this.clean()

    }

   
    

    
}
    

  
    
