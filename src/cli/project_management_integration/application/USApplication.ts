import { Activity, AtomicUserStory, Epic } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";
import { TaskApplication } from "./TaskApplication.js";

export class USApplication extends IssueAbstractApplication {

    taskApplication: TaskApplication;

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string) {
        super(email, apiToken, host, projectKey, target_folder);
        this.taskApplication = new TaskApplication(email, apiToken, host, projectKey, target_folder);
    }

    private async createWithEpic(atomicUserStory: AtomicUserStory) {
        const epicID = atomicUserStory.epic?.ref?.id.toLowerCase();

        if (atomicUserStory.activity) {
            if (atomicUserStory.activity.ref) {
                await this.createByActivity(atomicUserStory.activity.ref, epicID ?? "");
            } else {
                console.error("Activity reference is undefined");
            }
        } else {
            await this._createWithEpic(atomicUserStory, epicID ?? "");
        }
    }

    private async createWithOutEpic(atomicUserStory: AtomicUserStory) {
        if (atomicUserStory.activity) {
            await this.createByActivityWithouEpic(atomicUserStory);
        } else {
            await this._createWithouEpic(atomicUserStory);
        }
    }

    public async create(atomicUserStory: AtomicUserStory) {
        if (atomicUserStory.epic) {
            await this.createWithEpic(atomicUserStory);
        } else {
            await this.createWithOutEpic(atomicUserStory);
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

    private async _createWithEpic(atomicUserStory: AtomicUserStory, epicID: string) {
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

    private async _createWithouEpic(atomicUserStory: AtomicUserStory) {
        const atomicUserStoryID = `${atomicUserStory.id.toLowerCase()}`;
        if (!this.idExists(atomicUserStoryID, this.jsonDAO)) {
            await this._createSingleUserStory(atomicUserStoryID, atomicUserStory);
        }
    }

    public async createByActivityWithouEpic(atomicUserStory: AtomicUserStory) {
        let activityID = atomicUserStory.activity?.ref?.id.toLowerCase();
        activityID = `${atomicUserStory.id.toLowerCase()}.${activityID}`;

        let labels = Util.appendValue(atomicUserStory.label ?? "", atomicUserStory.labelx);

        if (!this.idExists(activityID, this.jsonDAO)) {
            try {
                const result = await this.jiraIntegrationService.createUserStory(atomicUserStory.name ?? "", atomicUserStory.activity?.ref?.description ?? "", undefined, labels);
                await this.save(activityID, result);
                const key = (result as any).key;
                for (const task of atomicUserStory.activity?.ref?.tasks || []) {
                    await this.taskApplication.createByTask(task, key, "", activityID ?? "");
                }
            } catch (error) {
                console.error('Error creating user story without epic:', error);
            }
        }
    }

    public async createByActivity(activity: Activity, epicID: string, epic?: Epic) {
        let activityID = activity.id.toLowerCase();
        let labels = Util.appendValue(activity.label ?? "", activity.labelx);
        const labelsEpic = Util.appendValue(epic?.label ?? "", epic?.labelx ?? [""]);
        labels = labels.concat(labelsEpic);

        if (epicID) {
            activityID = `${epic?.id.toLowerCase()}.${activityID}`;
        }

        let activity_name = activity.name;
        if (epic?.replace) {
            activity_name = epic?.name?.replace(epic.replace, activity.name ?? "");
        }

        if (!this.idExists(activityID, this.jsonDAO)) {
            try {
                const result = await this.jiraIntegrationService.createUserStory(activity_name ?? "", activity.description ?? "", epicID, labels);
                await this.save(activityID, result);
                const key = (result as any).key;
                for (const task of activity.tasks || []) {
                    await this.taskApplication.createByTask(task, key, epic?.id.toLowerCase() ?? "", activity.id.toLowerCase());
                }
            } catch (error) {
                console.error('Error creating user story by activity:', error);
            }
        }
    }

    private async save(ID: any, result: any) {
        await super.saveOnFile(ID, result, this.jsonDAO, "atomicuserstory");
    }
}