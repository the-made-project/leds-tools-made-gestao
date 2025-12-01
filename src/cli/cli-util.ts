import type { AstNode, LangiumCoreServices, LangiumDocument } from 'langium';
import chalk from 'chalk';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { URI } from 'langium';
import type { AtomicUserStory, TaskBacklog, TeamMember, Epic, Model, Backlog, Team, Roadmap, Milestone, Release } from '../language/generated/ast.js';
import { type Issue, type Person } from 'made-lib-made-eto';

export async function extractDocument(fileName: string, services: LangiumCoreServices): Promise<LangiumDocument> {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(path.extname(fileName))) {
        console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`));
        process.exit(1);
    }

    if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`File ${fileName} does not exist.`));
        process.exit(1);
    }

    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

    const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
    if (validationErrors.length > 0) {
        console.error(chalk.red('There are validation errors:'));
        for (const validationError of validationErrors) {
            console.error(chalk.red(
                `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
            ));
        }
        process.exit(1);
    }

    return document;
}

export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumCoreServices): Promise<T> {
    return (await extractDocument(fileName, services)).parseResult?.value as T;
}

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}

export function astEpicToIssue(epic: Epic, assigneeMap: Map<string, Person>, backlogName: string): Issue {
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

export function astStoryToIssue(story: AtomicUserStory, assigneeMap: Map<string, Person>, backlogName: string, parentEpic?: Epic): Issue {
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

export function astTaskToIssue(task: TaskBacklog, parentStory: AtomicUserStory, assigneeMap: Map<string, Person>, backlogName: string): Issue {
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

export function astTeamMemberToPerson(member: TeamMember): Person {
    return {
        id: member.id ?? '',
        email: member.email ?? '',
        name: member.name ?? '',
        discord: '' // ajuste se houver campo no modelo
    };
}

export function astTeamToTeam(team: TeamMember[]): Person[] {
    return team.map(member => ({
        id: member.id ?? '',
        email: member.email ?? '',
        name: member.name ?? '',
        discord: '' // ajuste se houver campo no modelo
    }));
}

export function astTimeBoxToTimeBox(timebox: any): any {
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

export function buildAssigneeMap(model: Model): Map<string, Person> {
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
    return assigneeMap;
}

export function processBacklogs(backlogs: Backlog[], assigneeMap: Map<string, Person>): {
    epics: Issue[],
    stories: Issue[],
    tasks: Issue[],
    backlogList: any[]
} {
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
            issues: [...localEpics, ...localStories, ...localTasks]
        });
    }

    return { epics, stories, tasks, backlogList };
}

export function processTeams(teamsRaw: Team[]): any[] {
    return teamsRaw.map(team => ({
        id: team.id,
        name: team.name ?? '',
        description: team.description ?? '',
        teamMembers: astTeamToTeam(team.teammember)
    }));
}

export function processProject(astProject: any): any {
    return {
        id: astProject.id,
        name: astProject.name ?? '',
        description: astProject.description,
        startDate: astProject.startDate ?? '',
        dueDate: astProject.dueDate ?? '',
        completedDate: astProject.completedDate
    };
}

export function processTimeBoxes(timeboxesRaw: any[]): any[] {
    return timeboxesRaw.map(astTimeBoxToTimeBox);
}

export function astReleaseToRelease(release: Release, assigneeMap: Map<string, Person>): any {
    const issues: Issue[] = [];
    
    // Adiciona o item principal como issue
    if (release.item?.ref) {
        const ref = release.item.ref;
        if (ref.$type === 'Epic') {
            issues.push(astEpicToIssue(ref, assigneeMap, ''));
        } else if (ref.$type === 'AtomicUserStory') {
            issues.push(astStoryToIssue(ref, assigneeMap, '', undefined));
        } else if (ref.$type === 'TaskBacklog') {
            const dummyStory = { id: '', name: '', $type: 'AtomicUserStory' } as AtomicUserStory;
            issues.push(astTaskToIssue(ref, dummyStory, assigneeMap, ''));
        }
    }
    
    // Adiciona os itens adicionais como issues
    if (release.itens) {
        for (const item of release.itens) {
            if (item.ref) {
                const ref = item.ref;
                if (ref.$type === 'Epic') {
                    issues.push(astEpicToIssue(ref, assigneeMap, ''));
                } else if (ref.$type === 'AtomicUserStory') {
                    issues.push(astStoryToIssue(ref, assigneeMap, '', undefined));
                } else if (ref.$type === 'TaskBacklog') {
                    const dummyStory = { id: '', name: '', $type: 'AtomicUserStory' } as AtomicUserStory;
                    issues.push(astTaskToIssue(ref, dummyStory, assigneeMap, ''));
                }
            }
        }
    }

    return {
        id: release.id,
        version: release.version ?? '',
        name: release.name ?? '',
        description: release.description ?? '',
        releasedDate: release.releasedDate,
        dueDate: release.dueDate ?? '',
        status: release.status,
        issues
    };
}

export function astMilestoneToMilestone(milestone: Milestone, milestonesMap: Map<string, Milestone>, assigneeMap: Map<string, Person>): any {
    return {
        id: milestone.id,
        name: milestone.name ?? '',
        description: milestone.description ?? '',
        startDate: milestone.startDate ?? '',
        dueDate: milestone.dueDate ?? '',
        status: milestone.status,
        dependencies: [
            ...(milestone.depend ? [astMilestoneToMilestone(milestone.depend.ref!, milestonesMap, assigneeMap)] : []),
            ...(milestone.depends?.map(dep => astMilestoneToMilestone(dep.ref!, milestonesMap, assigneeMap)) ?? [])
        ],
        releases: milestone.releases?.map(release => astReleaseToRelease(release, assigneeMap)) ?? []
    };
}

export function astRoadmapToRoadmap(roadmap: Roadmap, milestonesMap: Map<string, Milestone>, assigneeMap: Map<string, Person>): any {
    return {
        id: roadmap.id,
        name: roadmap.name ?? '',
        description: roadmap.description ?? '',
        milestones: roadmap.milestones?.map(milestone => astMilestoneToMilestone(milestone, milestonesMap, assigneeMap)) ?? []
    };
}

export function processRoadmaps(roadmaps: Roadmap[], assigneeMap: Map<string, Person>): any[] {
    const milestonesMap = new Map<string, Milestone>();
    
    // Primeiro, coleta todos os milestones para resolver dependências
    roadmaps.forEach(roadmap => {
        roadmap.milestones?.forEach(milestone => {
            milestonesMap.set(`${roadmap.id}.${milestone.id}`, milestone);
        });
    });

    // Depois, mapeia os roadmaps completos
    return roadmaps.map(roadmap => astRoadmapToRoadmap(roadmap, milestonesMap, assigneeMap));
}
