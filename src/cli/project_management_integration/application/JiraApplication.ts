import { isAtomicUserStory, isBacklog, isEpic, isTimeBox, Model } from "../../../language/generated/ast.js"
import { EPICApplication } from "./EPICApplication.js";
import { PersonApplication } from "./PersonApplication.js";
import { TaskApplication } from "./TaskApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";
import { USApplication } from "./USApplication.js";
import { EventEmitter } from 'events'
import * as vscode from 'vscode';
export class JiraApplication {

  epicApplication: EPICApplication
  uSApplication: USApplication
  taskApplication: TaskApplication
  timeBoxApplication: TimeBoxApplication
  teamApplication: TeamApplication
  personApplication: PersonApplication
  model: Model
  

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, model: Model, eventEmitter: EventEmitter ){

      this.model = model

      this.epicApplication = new EPICApplication(email,apiToken,host,projectKey,target_folder,eventEmitter)

      this.uSApplication = new USApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.taskApplication = new TaskApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)
     
      this.timeBoxApplication = new TimeBoxApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.teamApplication = new TeamApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      this.personApplication = new PersonApplication(email,apiToken,host,projectKey,target_folder,model,eventEmitter)

      
    }
    
    
    public async createModel() {
      
      //Buscando elementos
      const epics = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isEpic));
      const usWithoutEPIC = this.model.components.filter(isBacklog).flatMap(backlog => backlog.userstories.filter(isAtomicUserStory).filter(us => us.epic == undefined))
      const timeBox = this.model.components.filter(isTimeBox)

      // Criando EPIC e suas US e TASK
      await Promise.all(epics.map(async epic => await this.epicApplication.create(epic)));

      // Criando as US que não possuem task

      await Promise.all(usWithoutEPIC.map(async us => await this.uSApplication.createWithOutEpic(us)));

      
      // Criando os Sprint
      await Promise.all(timeBox.map(timeBox => this.timeBoxApplication.create(timeBox)));
      
  }

  public async synchronizeAll(): Promise<void> {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Sincronizando dados",
      cancellable: true
    }, async (progress, token) => {
      try {
        // TimeBox sincronização (25%)
        progress.report({
          increment: 0,
          message: "Sincronizando TimeBoxes..."
        });
        await this.timeBoxApplication.synchronized();
        
        // Person sincronização (25%)
        progress.report({
          increment: 25,
          message: "Buscando pessoas..."
        });
        await this.personApplication.synchronized();
        
        // Task sincronização (25%)
        progress.report({
          increment: 25,
          message: "Buscando tarefas..."
        });
        await this.taskApplication.synchronized();
        
        // Team sincronização (25%)
        progress.report({
          increment: 25,
          message: "Associando tarefas às pessoas..."
        });
        await this.teamApplication.synchronized();

        // Mostrar mensagem de sucesso
        vscode.window.showInformationMessage('✅ Sincronização concluída com sucesso!');

      } catch (error) {
        // Mostrar mensagem de erro
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        vscode.window.showErrorMessage(`❌ Erro durante a sincronização: ${errorMessage}`);
        throw error;
      }
    });
  }

  // Versão alternativa com status bar
  public async synchronizeAllWithStatusBar(): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );

    try {
      const steps = [
        {
          message: "$(sync~spin) Sincronizando TimeBoxes...",
          action: () => this.timeBoxApplication.synchronized()
        },
        {
          message: "$(search) Buscando pessoas...",
          action: () => this.personApplication.synchronized()
        },
        {
          message: "$(list-unordered) Buscando tarefas...",
          action: () => this.taskApplication.synchronized()
        },
        {
          message: "$(gift) Associando tarefas às pessoas...",
          action: () => this.teamApplication.synchronized()
        }
      ];

      for (const step of steps) {
        statusBarItem.text = step.message;
        statusBarItem.show();
        await step.action();
      }

      // Mostrar conclusão
      statusBarItem.text = "$(check) Sincronização concluída";
      vscode.window.showInformationMessage('✅ Sincronização concluída com sucesso!');

    } catch (error) {
      statusBarItem.text = "$(error) Erro na sincronização";
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      vscode.window.showErrorMessage(`❌ Erro: ${errorMessage}`);
      throw error;

    } finally {
      // Esconder após 3 segundos
      setTimeout(() => {
        statusBarItem.hide();
        statusBarItem.dispose();
      }, 3000);
    }
  }

  // Versão com canal de output para logs detalhados
  public async synchronizeAllWithLogs(): Promise<void> {
    const outputChannel = vscode.window.createOutputChannel('Sincronização');
    
    try {
      outputChannel.show();
      outputChannel.appendLine('Iniciando processo de sincronização...\n');

      // TimeBox
      outputChannel.appendLine('⏳ Sincronizando TimeBoxes...');
      await this.timeBoxApplication.synchronized();
      outputChannel.appendLine('✅ TimeBoxes sincronizados\n');

      // Person
      outputChannel.appendLine('⏳ Buscando pessoas...');
      await this.personApplication.synchronized();
      outputChannel.appendLine('✅ Pessoas sincronizadas\n');

      // Task
      outputChannel.appendLine('⏳ Buscando tarefas...');
      await this.taskApplication.synchronized();
      outputChannel.appendLine('✅ Tarefas sincronizadas\n');

      // Team
      outputChannel.appendLine('⏳ Associando tarefas às pessoas...');
      await this.teamApplication.synchronized();
      outputChannel.appendLine('✅ Associações concluídas\n');

      outputChannel.appendLine('🎉 Sincronização concluída com sucesso!');
      vscode.window.showInformationMessage('✅ Sincronização concluída com sucesso!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      outputChannel.appendLine(`❌ ERRO: ${errorMessage}`);
      vscode.window.showErrorMessage(`Erro durante a sincronização: ${errorMessage}`);
      throw error;
    }
  }


  public async sincronized(){    

    await this.synchronizeAll()
   
  }
    
    

}   