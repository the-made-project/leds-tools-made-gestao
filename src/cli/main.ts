import type { Model, Backlog, Team, Roadmap } from '../language/generated/ast.js';
import { Command } from 'commander';
import { MadeLanguageMetaData } from '../language/generated/module.js';
import { createMadeServices } from '../language/made-module.js';
import { extractAstNode, buildAssigneeMap, processBacklogs, processTeams, processProject, processTimeBoxes, processRoadmaps } from './cli-util.js';
import { generate } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { ReportManager } from 'made-lib';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version - using relative path from the current module
// When compiled, this will be in out/cli/main.js, so we need to go up two levels to reach package.json
const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

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

    program
        .version(packageJson.version);

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
        .command('github')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('Push project data to GitHub Issues, Projects, and Roadmaps')
        .action(async (fileName: string) => {
            // Load .env from the same directory as the .made file
            const envPath = path.join(path.dirname(path.resolve(fileName)), '.env');
            dotenv.config({ path: envPath });

            const token = process.env.GITHUB_TOKEN;
            const org = process.env.GITHUB_ORG;
            const repo = process.env.GITHUB_REPO;

            if (!token || !org || !repo) {
                console.error('❌ Missing required environment variables:');
                console.error('   GITHUB_TOKEN - Your GitHub personal access token');
                console.error('   GITHUB_ORG - Your GitHub organization/username');
                console.error('   GITHUB_REPO - Your GitHub repository name');
                console.error('\n💡 Create a .env file in the same directory as your .made file with:');
                console.error('   GITHUB_TOKEN=your_token_here');
                console.error('   GITHUB_ORG=your_org_here');
                console.error('   GITHUB_REPO=your_repo_here');
                process.exit(1);
            }

            try {
                console.log('🚀 Pushing to GitHub...');
                await githubPushAction(fileName, token, org, repo);
                console.log('✅ Successfully pushed to GitHub!');
            } catch (error: any) {
                console.error('❌ Error pushing to GitHub:', error.message);
                process.exit(1);
            }
        });

    program.parse(process.argv);
}
