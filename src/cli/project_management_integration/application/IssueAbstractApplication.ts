
import { AbstractApplication } from "./AbstractApplication.js";
import { EventEmitter } from 'events';
import { IssueDTO } from "../dto/models.js";
import * as vscode from 'vscode';
export  class IssueAbstractApplication extends AbstractApplication {

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder:string, eventEmitter: EventEmitter) {

        super(email,apiToken,host,projectKey,target_folder,eventEmitter)       
        this.jsonFile = "issue.json"
    }

    public override async execute(data: any): Promise<boolean> {

        const id = data.id
        const result = await this.retriveByExternal(id)
    
        const issueDTO: IssueDTO = {
            internalId: "",
            id: (data).id,
            key: (data).key,
            parentId:(data).parent?.id ?? "",
            parentKey:(data).parent?.key ?? "",
            self: (data).self,                                
            type: (data).fields.issuetype.name,
            title:(data).fields.summary ?? "",
            createdDate:(data).fields.summary ?? "",
            dueDate:(data).fields.dueDate ?? ""
        };
        
        if (result){
            await this.update (id, issueDTO)
        }
        else{
            await this.save(issueDTO)   
            
        }
        
        return true
    }



    public async synchronized(){
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Sincronizando com Jira",
            cancellable: true
          }, async (progress, token) => {
            try {
              // Etapas da sincronização
              const steps = [
                { message: "Conectando ao Jira...", increment: 10 },
                { message: "Buscando issues...", increment: 30 },
                { message: "Atualizando dados locais...", increment: 40 },
                { message: "Finalizando sincronização...", increment: 20 }
              ];
      
              // Para cada etapa
              for (const step of steps) {
                if (token.isCancellationRequested) {
                  vscode.window.showInformationMessage('Sincronização cancelada pelo usuário');
                  return;
                }
      
                progress.report({
                  message: step.message,
                  increment: step.increment
                });
      
                // Executa a sincronização
                await  this.jiraIntegrationService.synchronizedIssues(this, this.projectKey)
                
              }
      
              // Mensagem de sucesso
              vscode.window.showInformationMessage('✅ Sincronização concluída com sucesso!', 'Ver Detalhes')
                .then(selection => {
                  if (selection === 'Ver Detalhes') {
                    // Aqui você pode adicionar lógica para mostrar mais detalhes
                    vscode.window.showInformationMessage('Detalhes da sincronização...');
                  }
                });
      
              return Promise.resolve();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              vscode.window.showErrorMessage(`❌ Erro na sincronização: ${errorMessage}`, 'Ver Detalhes')
                .then(selection => {
                  if (selection === 'Ver Detalhes') {
                    // Mostra erro detalhado
                    vscode.window.showErrorMessage(`Detalhes do erro: ${errorMessage}`);
                  }
                });
              throw error;
            }
          });
        }
    
}