import { AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument } from "langium";
import { CancellationToken } from "vscode-languageclient";
import { Model, isBacklog, isEpic,isProcess,isAtomicUserStory, isTeam} from "./generated/ast.js";

/**
 * Gerador customizado para o escopo global do arquivo.
 * Por padrão, o escopo global só contém os filhos do nó raiz,
 * sejam acessíveis globalmente
 */
export class CustomScopeComputation extends DefaultScopeComputation {
    override async computeExports(document: LangiumDocument<AstNode>, cancelToken?: CancellationToken | undefined): Promise<AstNodeDescription[]> {
        // Os nós que normalmente estariam no escopo global
        
        const default_global = await super.computeExports(document, cancelToken)

        const root = document.parseResult.value as Model
        
        //colocando os epic em escopo global
        const epics = root.components.filter(isBacklog).flatMap(backlog => 
            backlog.userstories.filter(isEpic).map(epic => this.descriptions.createDescription(epic, `${epic.$container.id}.${epic.id}`, document)))
        
        // Colocando as US no escopo global
        const userstories = root.components.filter(isBacklog).flatMap(backlog => 
            backlog.userstories.filter(isAtomicUserStory).map(atomicUserStory => this.descriptions.createDescription(atomicUserStory, `${atomicUserStory.$container.id}.${atomicUserStory.id}`, document)))
            
        root.components.filter(isBacklog).flatMap(backlog => 
                backlog.userstories.filter(isAtomicUserStory).map(atomicUserStory => this.exportNode(atomicUserStory, default_global, document)))

        // Define Process as Global
        const processes = root.components.filter(isProcess).flatMap(
            process => this.descriptions.createDescription(process, `${process.id}`, document))

        root.components.filter(isProcess).map(
                process => this.exportNode(process, default_global, document))
        
        // Define Activity as Global
        const activities = root.components.filter(isProcess).flatMap(process => process.activities.map(activity => this.descriptions.createDescription(activity, `${activity.$container.id}.${activity.id}`, document)))
        
        root.components.filter(isProcess).flatMap(process => process.activities.map(activity =>this.exportNode(activity, default_global, document)))
        
        // Define Task as Global
        const tasks =  root.components.filter(isProcess).flatMap(process => process.activities.flatMap(activity => activity.tasks.map(task => this.descriptions.createDescription(task, `${task.$container.id}.${task.id}`, document))))
        
        // Define a teammeber as Global

        const people = root.components.filter(isTeam).flatMap( team => team.teammember.map(e => this.descriptions.createDescription(e, `${e.$container.id}.${e.id}`, document)))
         
        root.components.filter(isTeam).flatMap( team => team.teammember.map(teamMember => this.exportNode(teamMember, default_global, document)))
        
        return default_global.concat(epics,processes,userstories,activities,tasks,people)
    }
}
