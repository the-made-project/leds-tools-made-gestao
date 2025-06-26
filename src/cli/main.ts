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
        backlog: backlogName,
        criterions: epic.criterions ?? [],
        observation: epic.observation ?? ''
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
        depends: [
            ...(parentEpic ? [{
                id: parentEpic.id,
                type: 'Epic',
                subtype: ''
            }] : [])
        ],
        backlog: backlogName,
        criterions: story.criterions ?? [],
        requirements: story.requirements ?? [],
        observation: story.observation ?? '',
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
        depends: [
            {
                id: parentStory.id,
                type: 'Feature',
                subtype: ''
            }
        ],
        backlog: backlogName,
        deliverables: task.deliverables ?? [],
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

function astTeamToTeam(team: TeamMember[]): Person[] {
    return team.map(member => ({
        id: member.id ?? '',
        email: member.email ?? '',
        name: member.name ?? '',
        discord: '' // ajuste se houver campo no modelo
    }));
}

function astTimeBoxToTimeBox(timebox: any): any {
    return {
        id: timebox.id,
        description: timebox.description ?? '',
        startDate: timebox.startDate ?? '',
        endDate: timebox.endDate ?? '',
        name: timebox.name ?? '',
        status: timebox.status,
        completeDate: timebox.completedDate,
        sprintItems: (timebox.sprintBacklog?.planningItems ?? []).map((item: any) => {
            // Monta o Issue correspondente ao backlogItem
            let issue: Issue | undefined = undefined;
            const ref = item.backlogItem?.ref;
            if (ref) {
                if (ref.$type === 'Epic') {
                    issue = astEpicToIssue(ref, new Map(), ''); // ajuste o assigneeMap e backlogName se necessário
                } else if (ref.$type === 'AtomicUserStory') {
                    issue = astStoryToIssue(ref, new Map(), '', undefined);
                } else if (ref.$type === 'TaskBacklog') {
                    issue = astTaskToIssue(ref, ref.$container, new Map(), '');
                }
            }
            return {
                id: item.backlogItem?.ref?.id ?? '',
                assignee: item.assignee?.ref ? {
                    id: item.assignee.ref.id ?? '',
                    name: item.assignee.ref.name ?? '',
                    email: item.assignee.ref.email ?? ''
                } : undefined,
                issue,
                startDate: item.startDate,
                dueDate: item.dueDate,
                plannedStartDate: item.startDate,
                plannedDueDate: item.dueDate,
                status: item.status,
            };
        })
    };
}

export const githubPushAction = async (fileName: string, token: string, org: string, repo: string): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);

    const backlogs = model.components.filter(c => c.$type === 'Backlog') as Backlog[];
    const teamsRaw = model.components.filter(c => c.$type === 'Team') as import('../language/generated/ast.js').Team[];
    const teams = teamsRaw.map(team => ({
        id: team.id,
        name: team.name ?? '',
        description: team.description ?? '',
        teamMembers: astTeamToTeam(team.teammember)
    }));

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
        // Novo modelo de backlog
        backlogList.push({
            id: backlog.id,
            name: backlog.name ?? backlog.id,
            description: backlog.description ?? '',
            issues: [...localEpics, ...localStories, ...localTasks]
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
    const timeboxesRaw = model.components.filter(c => c.$type === 'TimeBox');
    const timebox = timeboxesRaw.map(astTimeBoxToTimeBox);

    await reportManager.githubPush(token, org, repo, project, epics, stories, tasks, backlogList, teams, timebox);
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
