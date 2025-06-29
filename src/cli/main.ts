import type { Model, Backlog, Team, Roadmap } from '../language/generated/ast.js';
import { Command } from 'commander';
import { MadeLanguageMetaData } from '../language/generated/module.js';
import { createMadeServices } from '../language/made-module.js';
import { extractAstNode, buildAssigneeMap, processBacklogs, processTeams, processProject, processTimeBoxes, processRoadmaps } from './cli-util.js';
import { generate } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { ReportManager } from 'made-lib';
import { readFileSync } from 'node:fs';

// Read package.json for version
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);
    generate(model, fileName, opts.destination, opts);
};

export const githubPushAction = async (fileName: string, token: string, org: string, repo: string): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);

    const backlogs = model.components.filter(c => c.$type === 'Backlog') as Backlog[];
    const teamsRaw = model.components.filter(c => c.$type === 'Team') as Team[];
    const timeboxesRaw = model.components.filter(c => c.$type === 'TimeBox');
    const roadmaps = model.components.filter(c => c.$type === 'Roadmap') as Roadmap[];

    const assigneeMap = buildAssigneeMap(model);
    const { epics, stories, tasks, backlogList } = processBacklogs(backlogs, assigneeMap);
    const teams = processTeams(teamsRaw);
    const project = processProject(model.project);
    const timebox = processTimeBoxes(timeboxesRaw);
    const roadmapList = processRoadmaps(roadmaps, assigneeMap);

    const reportManager = new ReportManager();
    await reportManager.githubPush(token, org, repo, project, epics, stories, tasks, backlogList, teams, timebox, roadmapList);
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
    const fileExtensions = MadeLanguageMetaData.fileExtensions.join(', ');

    program
        .version(packageJson.version);

    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('Generate Files')
        .action(generateAction);

    program
        .command('github-push')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-t, --token <token>', 'GitHub token for authentication')
        .option('-o, --org <org>', 'GitHub organization name')
        .option('-r, --repo <repo>', 'GitHub repository name')
        .description('Push project to GitHub')
        .action(githubPushAction);

    program.parse(process.argv);
}
