import type { Model, Backlog, AtomicUserStory, TaskBacklog, TeamMember } from '../language/generated/ast.js';
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

function astStoryToIssue(story: AtomicUserStory, assigneeMap: Map<string, Person>): Issue {
    return {
        id: story.id,
        type: 'Feature',
        subtype: '',
        title: story.name ?? story.label ?? '',
        description: story.description ?? '',
        labels: story.labelx ?? [],
        assignee: assigneeMap.get(story.id)
    };
}

function astTaskToIssue(task: TaskBacklog, parentStory: AtomicUserStory, assigneeMap: Map<string, Person>): Issue {
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
        }]
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

    // Extrai todos os backlogs do modelo
    const backlogs = model.components.filter(c => c.$type === 'Backlog') as Backlog[];

    // Cria um mapa de backlogItem.id para assignee (Person) a partir de todos os TimeBoxes do modelo
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

    // Arrays para armazenar stories e tasks como issues
    const stories: Issue[] = [];
    const tasks: Issue[] = [];

    for (const backlog of backlogs) {
        for (const item of backlog.items) {
            if (item.$type === 'Epic') {
                for (const story of item.userstories) {
                    const storyIssue = astStoryToIssue(story, assigneeMap);
                    stories.push(storyIssue);

                    for (const task of story.tasks) {
                        const taskIssue = astTaskToIssue(task, story, assigneeMap);
                        tasks.push(taskIssue);
                    }
                }
            } else if (item.$type === 'AtomicUserStory') {
                const storyIssue = astStoryToIssue(item, assigneeMap);
                stories.push(storyIssue);

                for (const task of item.tasks) {
                    const taskIssue = astTaskToIssue(task, item, assigneeMap);
                    tasks.push(taskIssue);
                }
            }
        }
    }

    // Monta o projeto
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
    await reportManager.githubPush(token, org, repo, project, stories, tasks);
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
