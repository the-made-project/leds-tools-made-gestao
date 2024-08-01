import { Task, TaskBacklog } from "../../../language/generated/ast.js";
import { Util } from "../service/util.js";
import { IssueAbstractApplication } from "./IssueAbstractApplication.js";

export class TaskApplication extends IssueAbstractApplication {

    public async create(task: TaskBacklog) {
        // Tarefas que possuem um link com uma US
        if (task.userstory) {
            const userstoryID = task.userstory.ref?.id.toLowerCase();
            const epicID = task.userstory.ref?.epic?.ref?.id.toLowerCase();
            let taskID = "";

            if (epicID) {
                taskID = `${epicID}.`;
            }

            if (userstoryID) {
                taskID += `${userstoryID}.`;
            }

            let result = await super.readByKey(taskID.slice(0, -1), this.jsonDAO);
            const key = (result as any).key;
            taskID += `${task.id}`;

            if (!this.idExists(taskID, this.jsonDAO)) {
                await this.createSubTaskBacklog(task, key, taskID);
            }

        } else {
            // Tarefas sem link com US
            await this.createTaskBacklog(task);
        }
    }

    public async createTaskBacklog(task: TaskBacklog) {
        if (!this.idExists(task.id, this.jsonDAO)) {
            let labels = task.label ? Util.appendValue(task.label, task.labelx) : [];

            try {
                const result = await this.jiraIntegrationService.createTask(task.name ?? "", task.description ?? "", undefined, labels);
                await this.save(task.id, result);
            } catch (error) {
                console.error('Error creating task backlog:', error);
            }
        }
    }

    private async createSubTaskBacklog(task: TaskBacklog, usID: string, id: string) {
        let labels = task.label ? Util.appendValue(task.label, task.labelx) : [];

        try {
            const result = await this.jiraIntegrationService.createSubTask(task.name ?? "", task.description ?? "", usID, labels);
            await this.save(id, result);
        } catch (error) {
            console.error('Error creating subtask backlog:', error);
        }
    }

    private async createSubTask(task: Task, usID: string, id: string) {
        let labels = task.label ? Util.appendValue(task.label, task.labelx) : [];

        try {
            const result = await this.jiraIntegrationService.createSubTask(task.name ?? "", task.description ?? "", usID, labels);
            await this.save(id, result);
        } catch (error) {
            console.error('Error creating subtask:', error);
        }
    }

    public async createByTask(task: Task, usID: string, epicInternalID: string, activityInternalID: string) {
        let id = `${activityInternalID}.${task.id.toLowerCase()}`;

        if (epicInternalID) {
            id = `${epicInternalID}.${activityInternalID}.${task.id.toLowerCase()}`;
        }

        if (!this.idExists(id, this.jsonDAO)) {
            await this.createSubTask(task, usID, id);
        }
    }

    private async save(ID: any, result: any) {
        await super.saveOnFile(ID, result, this.jsonDAO, "task");
    }
}
