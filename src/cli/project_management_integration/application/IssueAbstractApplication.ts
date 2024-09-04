
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';

export  class IssueAbstractApplication extends AbstractApplication {

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, eventEmitter: EventEmitter) {

        super(email,apiToken,host,projectKey,target_folder,eventEmitter)       
        this.jsonFile = "issue.json"
    }
}