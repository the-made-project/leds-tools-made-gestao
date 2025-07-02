import type { LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { GenerateOptions, generateAction, githubPushAction } from '../cli/main.js';

function registerGeneratorCommand(context: vscode.ExtensionContext): void {
   
    const build_generate_functions = (opts: GenerateOptions) => {
        return () => {
            const filepath = vscode.window.activeTextEditor?.document.fileName
            if(filepath) {
                generateAction(filepath,opts).catch((reason) => vscode.window.showErrorMessage(reason.message))
            }
        }
    }

    const build_github_functions = (_opts: GenerateOptions) => {
        return async() => {
            const filepath = vscode.window.activeTextEditor?.document.fileName;
            if(filepath) {
                // Carrega o .env do mesmo diretório do .made
                const envPath = path.join(path.dirname(filepath), '.env');
                dotenv.config({ path: envPath });

                const token = process.env.GITHUB_TOKEN;
                const org = process.env.GITHUB_ORG;
                const repo = process.env.GITHUB_REPO;

                if (token && org && repo) {
                    githubPushAction(filepath, token, org, repo)
                        .catch((reason: any) => vscode.window.showErrorMessage(reason.message));
                } else {
                    vscode.window.showErrorMessage('Configure GITHUB_TOKEN, GITHUB_ORG e GITHUB_REPO no .env do diretório do seu arquivo .made');
                }
            }
        };
    }

    const generateDocumentation = build_generate_functions({ only_project_documentation: true })
    context.subscriptions.push(vscode.commands.registerCommand("made.generateDocumentation", generateDocumentation))

    const generateGithubIssues = build_github_functions({ only_project_github: true })
    context.subscriptions.push(vscode.commands.registerCommand("made.generateGithubIssues", generateGithubIssues))

    const githubPush = async () => {
        const filepath = vscode.window.activeTextEditor?.document.fileName;
        if (filepath) {
            const token = await vscode.window.showInputBox({ prompt: "GitHub Token" });
            const org = await vscode.window.showInputBox({ prompt: "GitHub Organization" });
            const repo = await vscode.window.showInputBox({ prompt: "GitHub Repository" });
            if (token && org && repo) {
                const { githubPushAction } = await import('../cli/main.js');
                githubPushAction(filepath, token, org, repo).catch((reason: any) => vscode.window.showErrorMessage(reason.message));
            }
        }
    };
    context.subscriptions.push(vscode.commands.registerCommand("made.githubPush", githubPush));

}

let client: LanguageClient;

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    console.log('[MADE Extension] Activating extension...');
    try {
        registerGeneratorCommand(context);
        client = startLanguageClient(context);
        console.log('[MADE Extension] Extension activated successfully');
    } catch (error) {
        console.error('[MADE Extension] Error during activation:', error);
        vscode.window.showErrorMessage(`MADE Extension activation failed: ${error}`);
    }
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    // Try multiple possible paths for the language server
    const possiblePaths = [
        path.join('out', 'language', 'main.cjs'),
        path.join('out', 'language', 'main.js'),
        'out/language/main.cjs',
        'out/language/main.js'
    ];
    
    let serverModule: string | undefined;
    
    for (const possiblePath of possiblePaths) {
        try {
            const resolvedPath = context.asAbsolutePath(possiblePath);
            if (resolvedPath && fs.existsSync(resolvedPath)) {
                serverModule = resolvedPath;
                console.log('[MADE Extension] Found server module at:', serverModule);
                break;
            }
        } catch (error) {
            console.log('[MADE Extension] Failed to resolve path:', possiblePath, error);
        }
    }
    
    if (!serverModule) {
        const error = 'Language server not found. Please run "npm run build" to compile the language server.';
        console.error('[MADE Extension]', error);
        vscode.window.showErrorMessage(error);
        throw new Error(error);
    }
    
    console.log('[MADE Extension] Using server module path:', serverModule);
    
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'made' }]
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'made',
        'made',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    return client;
}
