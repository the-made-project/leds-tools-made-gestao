import { AtomicUserStory, Backlog, Task, TaskBacklog } from "../../../../language/generated/ast.js";
import { Translate } from "./Translate.js";

export class TaskTranslate extends Translate<Task, TaskBacklog> {
    private container: AtomicUserStory | Backlog;

    public constructor(task: Task, container: AtomicUserStory | Backlog){
        super(task);
        this.container = container;
    }

    private getDefinitionOfReady(): string {
        const definitionOfReady = this.obj.dor;
        
        if (definitionOfReady == undefined){
            return "[Adicione a definição de pronto para fazer:]";
        }
        
        if (Array.isArray(definitionOfReady)){
            const dorJoined = definitionOfReady.join("\n");
            return dorJoined.length > 0 ? dorJoined : "[Adicione a definição de pronto para fazer:]";
        }

        return definitionOfReady.length > 0 ? definitionOfReady : "[Adicione a definição de pronto para fazer:]";
    }

    private getDefinitionOfDone(): string {
        const definitionOfDone = this.obj.dod;
        
        if (definitionOfDone == undefined){
            return "[Adicione a definição de pronto:]";
        }
        
        if (Array.isArray(definitionOfDone)){
            const dorJoined = definitionOfDone.join("\n");
            return dorJoined.length > 0 ? dorJoined : "[Adicione a definição de pronto:]";
        }

        return definitionOfDone.length > 0 ? definitionOfDone : "[Adicione a definição de pronto:]";
    }

    private descriptionTranslate(): string {
        
        const description = this.obj.description ?? "[Adicione uma descrição:]";
        const definitionOfReady = `## Definição de pronto para fazer\n${this.getDefinitionOfReady()}`;
        const definitionOfDone = `## Definição de pronto\n${this.getDefinitionOfDone()}`;
        return `${description}\n\n${definitionOfReady}\n\n${definitionOfDone}`;
    }

    public override translate(): TaskBacklog {
        return {
            // Languium Issues
            $container: this.container,
            $type: 'TaskBacklog',

            // Not Ready Yet
            depend: undefined,
            depends: [],

            // Wanted Issues
            deliverables: [],

            description: this.descriptionTranslate(),

            id: this.obj.id,

            label: this.obj.label,
            labelx: this.obj.labelx,

            name: this.obj.name,

            task: undefined,
        }
    }
}