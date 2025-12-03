import { Reference } from "langium";
import { AtomicUserStory, backlogItem, Epic, Process, Task, TaskBacklog } from "../../../../language/generated/ast.js";
import { Issue } from "made-lib-made-eto";
import { Translate } from "./Translate.js";

export class EpicTranslate extends Translate<Partial<Epic>, Epic> {

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
    private expandProcess() {
        
    }

    private hasProcess(): boolean {
        return (this.obj.process?.ref?.activities?.length ?? 0) > 0;
        
    }

    public override translate(): Epic {
        if (this.hasProcess()){
            this.expandProcess();
        }
        return this.obj as Epic;
    }

    
}
