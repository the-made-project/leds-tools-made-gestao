import { AbstractApplication } from "./AbstractApplication.js";


export class TeamApplication extends AbstractApplication {
 
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string) {
        super(email, apiToken, host, projectKey, target_folder);        
    }
    

    public async retrieveAll(){
        return await this.jiraIntegrationService.getAssigneeUsers()
    }
}