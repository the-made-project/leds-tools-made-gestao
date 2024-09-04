import { AtomicUserStory, Epic, isAtomicUserStory, isBacklog, Model } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";

import { EventEmitter } from 'events';
export class USApplication extends IssueAbstractApplication {

    eventEmitter: EventEmitter
    model: Model
    
    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string, model: Model, eventEmitter: EventEmitter) {
        
        super(email, apiToken, host, projectKey, target_folder);

        this.model = model
        
        //Lendo o sinal
        this.eventEmitter = eventEmitter
        this.eventEmitter.on('epicCreated', this.createUserStory.bind(this));
        
    }

    private async createUserStory(epic: Epic){
        
        const userstories = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic?.ref == epic))
        
        userstories.map (async us => await this.create (us))
        
    } 

    private async create(atomicUserStory: AtomicUserStory) {        
        await this.createWithEpic(atomicUserStory);        
    }

    private async createWithEpic(atomicUserStory: AtomicUserStory) {
        const epicID = atomicUserStory.epic?.ref?.id.toLowerCase();

        const atomicUserStoryID = epicID ? `${epicID}.${atomicUserStory.id.toLowerCase()}` : `${atomicUserStory.id.toLowerCase()}`;
        if (!this.idExists(atomicUserStoryID, this.jsonDAO)) {
            try {
                const result = await super.readByKey(epicID, this.jsonDAO);
                const key = (result as any).key;
                await this._createSingleUserStory(atomicUserStoryID, atomicUserStory, key);
            } catch (error) {
                console.error('Error reading epic by key:', error);
            }
        }
        
    }

    private async _createSingleUserStory(atomicUserStoryID: string, atomicUserStory: AtomicUserStory, parent?: string) {
        const description = atomicUserStory.description + "" + (atomicUserStory.activity?.ref?.description ?? "");
        let labels = Util.appendValue(atomicUserStory.label ?? "", atomicUserStory.labelx);
        const labelActivity = atomicUserStory.activity?.ref?.label ? Util.appendValue(atomicUserStory.activity?.ref?.label, atomicUserStory.activity?.ref?.labelx) : [];
        labels = labels.concat(labelActivity);

        try {
            const result = await this.jiraIntegrationService.createUserStory(atomicUserStory.name ?? "", description, parent, labels);
            await this.save(atomicUserStoryID, result);
        } catch (error) {
            console.error('Error creating user story:', error);
        }
    }

    private async save(ID: any, result: any) {
        await super.saveOnFile(ID, result, this.jsonDAO, "atomicuserstory");
    }


}