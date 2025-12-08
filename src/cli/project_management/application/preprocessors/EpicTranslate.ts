import { Reference } from "langium";
import { Activity, AtomicUserStory, backlogItem, Epic, isProcess, Process, Task, TaskBacklog } from "../../../../language/generated/ast.js";
import { Issue } from "made-lib-made-eto";
import { Translate } from "./Translate.js";


// Supondo algo assim:
// type Reference<T> = T | string; // tanto faz, só exemplo
// interface Process {
//   depend?: Reference<processType>;
//   depends: Array<Reference<processType>>;
// }
// function isProcess(x: any): x is Process;

export function resolveProcessDependencies(
  root?: Process
): Process[] {
    if(root == undefined){
    return [];
    }
    const result: Process[] = [];
    const visited = new Set<Process>();
    const stack = new Set<Process>(); // detecta ciclos (opcional mas recomendado)

    function visit(proc: Process) {
    if (visited.has(proc)) return;
    if (stack.has(proc)) {
        throw new Error("Ciclo detectado nas dependências do processo.");
    }

    stack.add(proc);

    // ------ depend (um só) ------
    if (proc.depend && isProcess(proc.depend)) {
        visit(proc.depend);
    }

    // ------ depends (lista) ------
    for (const dep of proc.depends) {
        if (isProcess(dep)) {
        visit(dep);
        }
    }

    stack.delete(proc);
    visited.add(proc);
    result.push(proc); // adiciona *após* visitar dependências → ordem correta
    }

    visit(root);
    return result;
}

export class EpicTranslate extends Translate<Partial<Epic>, Epic> {

    private searchDepends
    public constructor(obj: Partial<Epic>){
        super(obj);
    }

    public setCriterions(criterions: Array<string>): this {
        this.obj.criterions = criterions;
        return this;
    }

    public setDepend(depend: Reference<backlogItem>): this {
        this.obj.depend = depend;
        return this;
    }

    public setDepends(depends: Array<Reference<backlogItem>>): this {
        this.obj.depends = depends;
        return this;
    }

    public setDescription(description: string): this {
        this.obj.description = description;
        return this;
    }

    public setId(id: string): this {
        this.obj.id = id;
        return this;
    }

    public setLabel(label: string): this {
        this.obj.label = label;
        return this;
    }

    public setLabelx(labelx: Array<string>): this {
        this.obj.labelx = labelx;
        return this;
    }

    public setName(name: string): this {
        this.obj.name = name;
        return this;
    }

    public setObservation(observation: string): this {
        this.obj.observation = observation;
        return this;
    }

    public setProcess(process: Reference<Process>): this {
        this.obj.process = process;
        return this;
    }

    public setUserstories(userstories: Array<AtomicUserStory>): this {
        this.obj.userstories = userstories;
        return this;
    }

    private translateTaskDescprToTaskBacklogDecr(task: Task): string {

    }

    private translateTaskToBacklogTask(task: Task): TaskBacklog  {
        return {
            // Languium Issues
            $type: 'TaskBacklog',

            // Wanted Issues
            deliverables: [],

            id: task.id,

            label: task.label,
            labelx: task.labelx,

            name: task.name,
        }
    }

    private translateActivityToStory(activity: Activity) : AtomicUserStory{
        return {
            $container: this.obj as Epic,
            $type: "AtomicUserStory",
            


        }

    }

    private expandProcess() {
        const stack = resolveProcessDependencies(this.obj.process?.ref)
        for (let i = stack.length - 1; i >= 0; i--){
            const process = stack[i];
            const activities = process.activities;
            for(const activity of activities) {
                
            }
        } 
    }

    private hasProcess(): boolean {
        return (this.obj.process?.ref?.activities?.length ?? 0) > 0;
        
    }

    private getProcessActivities(): Activity[]{
        return this.obj.process?.ref?.activities ?? []; 
    } 

    public override translate(): Epic {
        if (this.hasProcess()){
            this.expandProcess();
        }
        return this.obj as Epic;
    }

    
}
