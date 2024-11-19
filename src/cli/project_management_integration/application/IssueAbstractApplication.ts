
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import { IssueDTO } from "../../model/models.js";

export  class IssueAbstractApplication extends AbstractApplication {

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, eventEmitter: EventEmitter) {

        super(email,apiToken,host,projectKey,target_folder,eventEmitter)       
        this.jsonFile = "issue.json"
    }

    public override async execute(data: any): Promise<boolean> {

        const id = data.id
        const result = await this.retriveByExternal(id)
        
        const issueDTO: IssueDTO = {
            internalId: "",
            id: data.id,
            key: data.key,
            parentId:data.parent?.id ?? "",
            parentKey:data.parent?.key ?? "",
            self: data.self,                                
            type: data.fields.issuetype.name,
            title:data.fields.summary ?? "",
            createdDate:data.fields.createdDate ?? "",
            completedDate: data.fields.resolutiondate ?? "", 
            dueDate:data.fields.dueDate ?? "",
            status: data.fields.status.name ?? ""
        };
        
        if (result){
            await this.update (id, issueDTO)
        }
        else{
            await this.save(issueDTO)   
            
        }
        
        return true
    }

    public async synchronized(){
      await this.jiraIntegrationService.synchronizedIssues(this, this.projectKey)
    }

       
}