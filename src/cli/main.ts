import type { Model, Backlog, AtomicUserStory, Epic, TaskBacklog } from '../language/generated/ast.js';
import { Command } from 'commander';
import { MadeLanguageMetaData } from '../language/generated/module.js';
import { createMadeServices } from '../language/made-module.js';
import { extractAstNode } from './cli-util.js';
import { generate } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { ReportManager, type Issue } from 'made-lib-dev';

//import * as url from 'node:url';
//import * as fs from 'node:fs/promises';
//import * as path from 'node:path';

//const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
//const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);
    generate(model, fileName, opts.destination,opts);
  
};

function astItemToIssue(item: AtomicUserStory | Epic | TaskBacklog): Issue {
    return {
        id: item.id,
        type: item.$type,
        subtype: '',
        title: item.name ?? item.label ?? '',
        description: item.description ?? '',
        labels: item.labelx ?? [],
    };
}

export const githubPushAction = async (fileName: string, token: string, org: string, repo: string): Promise<void> => {
    const services = createMadeServices(NodeFileSystem).Made;
    const model = await extractAstNode<Model>(fileName, services);

    const astProject = model.project;
    const project = {
        id: astProject.id,
        name: astProject.name ?? '',
        description: astProject.description,
        startDate: astProject.startDate ?? '',
        dueDate: astProject.dueDate ?? '',
        completedDate: astProject.completedDate
    };

    // Extrai todos os backlogs do modelo
    const backlogs = model.components.filter(c => c.$type === 'Backlog') as Backlog[];
    // Extrai todos os itens de backlog (AtomicUserStory, Epic, TaskBacklog)
    const allItems = backlogs.flatMap(b => b.items);

    // Converte cada item para Issue
    const issues = allItems.map(astItemToIssue);

    const reportManager = new ReportManager();
    await reportManager.githubPush(token, org, repo, project, issues);
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
