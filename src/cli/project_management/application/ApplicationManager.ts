import {  Model } from "../../../language/generated/ast.js";

import { BacklogApplication } from "./BacklogApplication.js";
import { IssueApplication } from "./IssueApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

import { ReportManager }  from  "made-lib-beta";
import { RoadmapApplication } from './RoadmapApplication.js';
import { ProcessApplication } from './ProcessApplication.js';
import { ProjectApplication } from './ProjectApplication.js';
import { ApplicationFactory } from "./ApplicationFactory.js";

// Detect if we're running in a VS Code extension context
function isVSCodeContext(): boolean {
    try {
        // Check if we're in a VS Code extension environment
        return typeof globalThis !== 'undefined' && 
               'vscode' in globalThis || 
               (typeof process !== 'undefined' && 
                process.env.VSCODE_PID !== undefined);
    } catch {
        return false;
    }
}

// Try to import vscode, but handle cases where it's not available (CLI context)
let vscode: any = null;
if (isVSCodeContext()) {
    try {
        vscode = require('vscode');
    } catch (error) {
        // VS Code APIs not available even though we think we're in VS Code context
        vscode = null;
    }
}

interface InitializationStep {
    name: string;
    action: () => Promise<void>;
    description: string;
    startEmoji: string;
    successEmoji: string;
}

export class ApplicationManager {
    private static instance: ApplicationManager;
    private isInitializing: boolean = false;
    private statusBarItem: any; // Can be vscode.StatusBarItem or null
    private initializationSteps: InitializationStep[];
    private isCliMode: boolean;

    timeBoxApplication: TimeBoxApplication
    teamApplication: TeamApplication
    issueApplication: IssueApplication
    backlogApplication: BacklogApplication
    roadmapApplication: RoadmapApplication
    processApplication: ProcessApplication
    reportManager: ReportManager
    projectApplication: ProjectApplication

    target_folder: string
    model: Model

    private constructor(target_folder:string, model: Model) {
        this.isCliMode = vscode === null;
        
        // Only create status bar item if running in VS Code extension context
        if (!this.isCliMode && vscode?.window?.createStatusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
                100
            );
        } else {
            this.statusBarItem = null;
        }

        this.model = model
        this.target_folder = target_folder
        this.reportManager = new ReportManager()

        this.timeBoxApplication = ApplicationFactory.createApplication("TimeBox", target_folder, model) as TimeBoxApplication;
        this.teamApplication = ApplicationFactory.createApplication("Team", target_folder, model) as TeamApplication;
        this.issueApplication = ApplicationFactory.createApplication("Issue", target_folder, model) as IssueApplication;
        this.backlogApplication = ApplicationFactory.createApplication("Backlog", target_folder, model) as BacklogApplication;
        this.roadmapApplication = ApplicationFactory.createApplication("Roadmap", target_folder, model) as RoadmapApplication;
        this.processApplication = ApplicationFactory.createApplication("Process", target_folder, model) as ProcessApplication;
        this.projectApplication = ApplicationFactory.createApplication("Project", target_folder, model) as ProjectApplication;
        // Define MADE Agile initialization steps
        this.initializationSteps = [
            {
                name: 'MADE Teams',
                action: async () => await this.teamApplication.create(),
                description: 'Setting up agile team collaboration space',
                startEmoji: '👥',
                successEmoji: '🤝'
            },
            {
                name: 'MADE Issues',
                action: async () => await this.issueApplication.create(),
                description: 'Configuring user stories and tasks manager',
                startEmoji: '📋',
                successEmoji: '✅'
            },
            {
                name: 'MADE Project',
                action: async () => await this.projectApplication.create(),
                description: 'Configuring project',
                startEmoji: '📋',
                successEmoji: '✅'
            },
            {
                name: 'MADE Backlog',
                action: async () => await this.backlogApplication.create(),
                description: 'Preparing product backlog environment',
                startEmoji: '📝',
                successEmoji: '📊'
            },
            {
                name: 'MADE TimeBox',
                action: async () => await this.timeBoxApplication.create(),
                description: 'Setting up sprint planning system',
                startEmoji: '⏱️',
                successEmoji: '🎯'
            },            
            {
                name: 'MADE Process',
                action: async () => await this.processApplication.create(),
                description: 'Setting up process ',
                startEmoji: '⏱️',
                successEmoji: '🎯'
            },
            {
                name: 'MADE Roadmap',
                action: async () => {
                    // Cria estrutura do roadmap
                    await this.roadmapApplication.create()
                },
                description: 'Creating project roadmap and release planning',
                startEmoji: '🗺️',
                successEmoji: '🚗'
            },
            {
                name: 'MADE Documentation',
                action: async () => {
                    // Gera documentação para o processo
                    await  this.reportManager.createReport(this.target_folder)
                },
                description: 'Generating agile process documentation',
                startEmoji: '📚',
                successEmoji: '📖'
            }
        ];
    }

    static getInstance(target_folder:string, model: Model): ApplicationManager {
        if (!ApplicationManager.instance) {
            ApplicationManager.instance = new ApplicationManager(target_folder, model);
        }
        return ApplicationManager.instance;
    }

    addInitializationStep(step: InitializationStep) {
        this.initializationSteps.push(step);
    }

    removeInitializationStep(stepName: string) {
        this.initializationSteps = this.initializationSteps.filter(
            step => step.name !== stepName
        );
    }

    private updateStatusBar(message: string, percentage: number, emoji: string) {
        if (this.isCliMode) {
            // In CLI mode, print to console
            const totalWidth = 20;
            const filledWidth = Math.floor(totalWidth * (percentage / 100));
            const emptyWidth = totalWidth - filledWidth;
            const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
            
            console.log(`${emoji} MADE: ${message} [${progressBar}] ${percentage.toFixed(0)}%`);
        } else if (this.statusBarItem) {
            // In VS Code extension mode, update status bar
            const totalWidth = 20;
            const filledWidth = Math.floor(totalWidth * (percentage / 100));
            const emptyWidth = totalWidth - filledWidth;
            const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
            
            this.statusBarItem.text = `${emoji} MADE: ${message} [${progressBar}] ${percentage.toFixed(0)}%`;
            this.statusBarItem.show();
        }
    }

    async initializeApplications() {
        if (this.isInitializing) {
            if (this.isCliMode) {
                console.log('⚠️ MADE is in the middle of a sprint... please wait!');
            } else if (vscode?.window?.showWarningMessage) {
                vscode.window.showWarningMessage('⚠️ MADE is in the middle of a sprint... please wait!');
            }
            return;
        }

        if (this.initializationSteps.length === 0) {
            if (this.isCliMode) {
                console.log('⚠️ No agile ceremonies configured in MADE!');
            } else if (vscode?.window?.showWarningMessage) {
                vscode.window.showWarningMessage('⚠️ No agile ceremonies configured in MADE!');
            }
            return;
        }

        this.isInitializing = true;
        if (this.statusBarItem) {
            this.statusBarItem.show();
        }

        try {
            if (this.isCliMode) {
                // CLI mode - simple console output
                await this.runInitializationStepsCli();
            } else if (vscode?.window?.withProgress) {
                // VS Code extension mode - with progress dialog
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "🚀 Starting MADE Daily Ceremonies",
                    cancellable: false
                }, async (progress: any) => {
                    await this.runInitializationStepsVscode(progress);
                });
            } else {
                // Fallback to CLI mode if VS Code APIs are not available
                await this.runInitializationStepsCli();
            }
        } finally {
            this.isInitializing = false;
        }
    }

    private async runInitializationStepsCli() {
        console.log("🚀 Starting MADE Daily Ceremonies");
        const totalSteps = this.initializationSteps.length;
        const incrementValue = 100 / totalSteps;
        let currentProgress = 0;

        try {
            for (const step of this.initializationSteps) {
                // Start step
                this.updateStatusBar(
                    `Sprint Planning: ${step.name}`,
                    currentProgress,
                    step.startEmoji
                );
                console.log(`${step.startEmoji} ${step.description}...`);

                await step.action();
                
                // Update progress
                currentProgress += incrementValue;
                this.updateStatusBar(
                    `${step.name} Ready for Review`,
                    currentProgress,
                    step.successEmoji
                );
                await this.delay(100); // Shorter delay for CLI
            }

            // Completion
            this.updateStatusBar(
                "Sprint Ceremonies Ready!",
                100,
                '🎉'
            );
            console.log('🚀 MADE is ready for the daily standup! Let\'s rock this sprint! 💪');
            
        } catch (error) {
            console.error(`⚠️ MADE Impediment Detected: ${error}`);
            throw error;
        }
    }

    private async runInitializationStepsVscode(progress: any) {
        const totalSteps = this.initializationSteps.length;
        const incrementValue = 100 / totalSteps;
        let currentProgress = 0;

        try {
            for (const step of this.initializationSteps) {
                // Start step
                this.updateStatusBar(
                    `Sprint Planning: ${step.name}`,
                    currentProgress,
                    step.startEmoji
                );
                progress.report({
                    message: `${step.startEmoji} ${step.description}...`,
                    increment: 0
                });

                await step.action();
                
                // Update progress
                currentProgress += incrementValue;
                this.updateStatusBar(
                    `${step.name} Ready for Review`,
                    currentProgress,
                    step.successEmoji
                );
                await this.delay(500);
            }

            // Completion
            this.updateStatusBar(
                "Sprint Ceremonies Ready!",
                100,
                '🎉'
            );
            if (vscode?.window?.showInformationMessage) {
                vscode.window.showInformationMessage('🚀 MADE is ready for the daily standup! Let\'s rock this sprint! 💪');
            }
            
            setTimeout(() => {
                if (this.statusBarItem) {
                    this.statusBarItem.hide();
                }
            }, 2000);

        } catch (error) {
            if (this.statusBarItem) {
                this.statusBarItem.hide();
            }
            if (vscode?.window?.showErrorMessage) {
                vscode.window.showErrorMessage(`⚠️ MADE Impediment Detected: ${error}`);
            }
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isInitializationProgress(): boolean {
        return this.isInitializing;
    }

    dispose() {
        if (this.statusBarItem && !this.isCliMode) {
            this.statusBarItem.dispose();
        }
    }
}

