


import { IssueDAO } from "../dao/IssueDAO.js";
import { AbstractApplication } from "./AbstractApplication.js";

export  class IssueAbstractApplication extends AbstractApplication {

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string){

        super(email,apiToken,host,projectKey,target_folder)
        this.jsonDAO = new IssueDAO(this.DB_PATH) 
    }

   
    
}