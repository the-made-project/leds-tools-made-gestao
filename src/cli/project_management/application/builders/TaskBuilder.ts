import { Task, Process, Activity } from "made-lib";

export class TaskBuilder {
    private task: Partial<Task>;

    constructor() {
        this.task = {};
    }

    setId(id: string): TaskBuilder {
        this.task.id = id;
        return this;
    }

    setName(name: string): TaskBuilder {
        this.task.name = name;
        return this;
    }

    setDescription(description: string): TaskBuilder {
        this.task.description = description;
        return this;
    }

    setDepends(dependencies: (Process | Activity | Task)[]): TaskBuilder {
        if (!this.task.depends) {
            this.task.depends = [];
        }
        this.task.depends.push(...dependencies);
        return this;
    }
    
    build(): Task {
        if (!this.task.name) {
            throw new Error("Task name is required");
        }
        if (!this.task.description) {
            throw new Error("Task description is required");
        }
        return this.task as Task;
    }
}