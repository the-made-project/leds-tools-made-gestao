import { AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument } from "langium";
import { CancellationToken } from "vscode-languageclient";
import { Model, isBacklog, isEpic, isProcess, isAtomicUserStory, isTeam } from "./generated/ast.js";

export class CustomScopeComputation extends DefaultScopeComputation {
    override async computeExports(document: LangiumDocument<AstNode>, cancelToken?: CancellationToken): Promise<AstNodeDescription[]> {
        const defaultGlobal = await super.computeExports(document, cancelToken);
        const root = document.parseResult.value as Model;

        if (!root.components) {
            // Handle the case where root.components is not defined or empty
            return defaultGlobal;
        }

        // Process Epics and User Stories
        const epics = this.getEpics(root, document);
        const userStories = this.getUserStories(root, document);
        const processes = this.getProcesses(root, document);
        const activities = this.getActivities(root, document);
        const tasks = this.getTasks(root, document);
        const people = this.getPeople(root, document);

        return defaultGlobal.concat(epics, processes, userStories, activities, tasks, people);
    }

    private getEpics(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isBacklog)
            .flatMap(backlog => backlog.userstories.filter(isEpic))
            .map(epic => this.descriptions.createDescription(epic, `${epic.$container.id}.${epic.id}`, document));
    }

    private getUserStories(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isBacklog)
            .flatMap(backlog => backlog.userstories.filter(isAtomicUserStory))
            .map(atomicUserStory => this.descriptions.createDescription(atomicUserStory, `${atomicUserStory.$container.id}.${atomicUserStory.id}`, document));
    }

    private getProcesses(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isProcess)
            .map(process => this.descriptions.createDescription(process, `${process.id}`, document));
    }

    private getActivities(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isProcess)
            .flatMap(process => process.activities)
            .map(activity => this.descriptions.createDescription(activity, `${activity.$container.id}.${activity.id}`, document));
    }

    private getTasks(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isProcess)
            .flatMap(process => process.activities)
            .flatMap(activity => activity.tasks)
            .map(task => this.descriptions.createDescription(task, `${task.$container.id}.${task.id}`, document));
    }

    private getPeople(root: Model, document: LangiumDocument<AstNode>): AstNodeDescription[] {
        return root.components
            .filter(isTeam)
            .flatMap(team => team.teammember)
            .map(teammember => this.descriptions.createDescription(teammember, `${teammember.$container.id}.${teammember.id}`, document));
    }
}
