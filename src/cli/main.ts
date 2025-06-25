import type { Model, Backlog, AtomicUserStory, TaskBacklog, TeamMember, Epic } from '../language/generated/ast.js';
import { Command } from 'commander';
import { MadeLanguageMetaData } from '../language/generated/module.js';
import { createMadeServices } from '../language/made-module.js';
import { extractAstNode } from './cli-util.js';
import { generate } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { ReportManager, type Issue, type Person } from 'made-lib';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);
    generate(model, fileName, opts.destination, opts);
};

function astEpicToIssue(epic: Epic, assigneeMap: Map<string, Person>, backlogName: string): Issue {
    return {
        id: epic.id,
        type: 'Epic',
        subtype: '',
        title: epic.name ?? epic.label ?? '',
        description: epic.description ?? '',
        labels: epic.labelx ?? [],
        assignee: assigneeMap.get(epic.id),
        backlog: backlogName
    };
}

function astStoryToIssue(story: AtomicUserStory, assigneeMap: Map<string, Person>, backlogName: string, parentEpic?: Epic): Issue {
    return {
        id: story.id,
        type: 'Feature',
        subtype: '',
        title: story.name ?? story.label ?? '',
        description: story.description ?? '',
        labels: story.labelx ?? [],
        assignee: assigneeMap.get(story.id),
        depends: parentEpic ? [{
            id: parentEpic.id,
            type: 'Epic',
            subtype: ''
        }] : [],
        backlog: backlogName
    };
}

function astTaskToIssue(task: TaskBacklog, parentStory: AtomicUserStory, assigneeMap: Map<string, Person>, backlogName: string): Issue {
    return {
        id: task.id,
        type: 'Task',
        subtype: '',
        title: task.name ?? task.label ?? '',
        description: task.description ?? '',
        labels: task.labelx ?? [],
        assignee: assigneeMap.get(task.id),
        depends: [{
            id: parentStory.id,
            type: 'Feature',
            subtype: ''
        }],
        backlog: backlogName
    };
}

function astTeamMemberToPerson(member: TeamMember): Person {
    return {
        id: member.id ?? '',
        email: member.email ?? '',
        name: member.name ?? '',
        discord: '' // ajuste se houver campo no modelo
    };
}

export const githubPushAction = async (fileName: string, token: string, org: string, repo: string): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);

    const backlogs = model.components.filter(c => c.$type === 'Backlog') as Backlog[];
    const assigneeMap = new Map<string, Person>();
    for (const component of model.components) {
        if (component.$type === 'TimeBox' && component.sprintBacklog) {
            for (const planningItem of component.sprintBacklog.planningItems) {
                const backlogId = planningItem.backlogItem?.ref?.id;
                const assigneeRef = planningItem.assignee?.ref;
                if (backlogId && assigneeRef) {
                    assigneeMap.set(backlogId, astTeamMemberToPerson(assigneeRef));
                }
            }
        }
    }

    const epics: Issue[] = [];
    const stories: Issue[] = [];
    const tasks: Issue[] = [];
    const backlogList: any[] = [];

    for (const backlog of backlogs) {
        const localEpics: Issue[] = [];
        const localStories: Issue[] = [];
        const localTasks: Issue[] = [];
        for (const item of backlog.items) {
            if (item.$type === 'Epic') {
                const epic = astEpicToIssue(item, assigneeMap, backlog.name ?? backlog.id);
                epics.push(epic);
                localEpics.push(epic);
                for (const story of item.userstories) {
                    const storyIssue = astStoryToIssue(story, assigneeMap, backlog.name ?? backlog.id, item);
                    stories.push(storyIssue);
                    localStories.push(storyIssue);
                    for (const task of story.tasks) {
                        const taskIssue = astTaskToIssue(task, story, assigneeMap, backlog.name ?? backlog.id);
                        tasks.push(taskIssue);
                        localTasks.push(taskIssue);
                    }
                }
            } else if (item.$type === 'AtomicUserStory') {
                const storyIssue = astStoryToIssue(item, assigneeMap, backlog.name ?? backlog.id);
                stories.push(storyIssue);
                localStories.push(storyIssue);
                for (const task of item.tasks) {
                    const taskIssue = astTaskToIssue(task, item, assigneeMap, backlog.name ?? backlog.id);
                    tasks.push(taskIssue);
                    localTasks.push(taskIssue);
                }
            }
        }
        backlogList.push({
            id: backlog.id,
            name: backlog.name ?? backlog.id,
            description: backlog.description ?? '',
            epics: localEpics,
            stories: localStories,
            tasks: localTasks
        });
    }

    const astProject = model.project;
    const project = {
        id: astProject.id,
        name: astProject.name ?? '',
        description: astProject.description,
        startDate: astProject.startDate ?? '',
        dueDate: astProject.dueDate ?? '',
        completedDate: astProject.completedDate
    };

    const reportManager = new ReportManager();
    await reportManager.githubPush(token, org, repo, project, epics, stories, tasks, backlogList);
};

export type GenerateOptions = {
    destination?: string,
    only_synchronize_from_made_to_projectManagement?: boolean,
    only_synchronize_from_projectManagement_to_made?: boolean,
    only_project_documentation?: boolean,
    only_project_github?: boolean,
    all?: boolean,
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = MadeLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('Generate Files')
        .action(generateAction);

    program.parse(process.argv);
}
