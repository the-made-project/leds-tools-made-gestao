import * as vscode from 'vscode';
import {  Model } from "../../../language/generated/ast.js"

import { BacklogApplication } from "./BacklogApplication.js";
import { IssueApplication } from "./IssueApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

import { ReportManager }  from  "made-report-lib";
import { RoadmapApplication } from './RoadmapApplication.js';
import { ProcessApplication } from './ProcessApplication.js';
import { ProjectApplication } from './ProjectApplication.js';


interface InitializationStep {
    name: string;
    action: () => Promise<void>;
    description: string;
    startEmoji: string;
    successEmoji: string;
}

export class ApplicationManager {
    private isInitializing: boolean = false;
    private statusBarItem: vscode.StatusBarItem;
    private initializationSteps: InitializationStep[];

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

    constructor(target_folder:string, model: Model) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );

        this.model = model
        this.target_folder = target_folder
        this.reportManager = new ReportManager()

        this.timeBoxApplication = new TimeBoxApplication(target_folder,model)
  
        this.teamApplication = new TeamApplication(target_folder,model)
  
        this.issueApplication = new  IssueApplication(target_folder,model)
  
        this.backlogApplication = new BacklogApplication(target_folder,model)

        this.roadmapApplication = new RoadmapApplication(target_folder,model)

        this.processApplication = new ProcessApplication(target_folder,model)

        this.projectApplication = new ProjectApplication(target_folder,model)
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

    addInitializationStep(step: InitializationStep) {
        this.initializationSteps.push(step);
    }

    removeInitializationStep(stepName: string) {
        this.initializationSteps = this.initializationSteps.filter(
            step => step.name !== stepName
        );
    }

    private updateStatusBar(message: string, percentage: number, emoji: string) {
        const totalWidth = 20;
        const filledWidth = Math.floor(totalWidth * (percentage / 100));
        const emptyWidth = totalWidth - filledWidth;
        const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
        
        this.statusBarItem.text = `${emoji} MADE: ${message} [${progressBar}] ${percentage.toFixed(0)}%`;
        this.statusBarItem.show();
    }

    async initializeApplications() {
        if (this.isInitializing) {
            vscode.window.showWarningMessage('⚠️ MADE is in the middle of a sprint... please wait!');
            return;
        }

        if (this.initializationSteps.length === 0) {
            vscode.window.showWarningMessage('⚠️ No agile ceremonies configured in MADE!');
            return;
        }

        this.isInitializing = true;
        this.statusBarItem.show();

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "🚀 Starting MADE Daily Ceremonies",
                cancellable: false
            }, async (progress) => {
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
                    vscode.window.showInformationMessage('🚀 MADE is ready for the daily standup! Let\'s rock this sprint! 💪');
                    
                    setTimeout(() => {
                        this.statusBarItem.hide();
                    }, 2000);

                } catch (error) {
                    this.statusBarItem.hide();
                    vscode.window.showErrorMessage(`⚠️ MADE Impediment Detected: ${error}`);
                    throw error;
                }
            });
        } finally {
            this.isInitializing = false;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isInitializationProgress(): boolean {
        return this.isInitializing;
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}

