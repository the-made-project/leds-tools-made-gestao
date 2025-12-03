import { Process, Activity, Task } from "made-lib-beta-grupo-2";

export class ActivityBuilder {
    private activity: Partial<Activity>;

    constructor() {
        this.activity = {};
    }

    setId(id: string): ActivityBuilder {
        this.activity.id = id;
        return this;
    }

    setName(name: string): ActivityBuilder {
        this.activity.name = name;
        return this;
    }

    setDescription(description: string): ActivityBuilder {
        this.activity.description = description;
        return this;
    }

    setTasks(tasks: Task[]): ActivityBuilder {
        if (!this.activity.tasks) {
            this.activity.tasks = [];
        }
        this.activity.tasks.push(...tasks);
        return this;
    }

    setDepends(dependencies: (Process | Activity | Task)[]): ActivityBuilder {
        if (!this.activity.depends) {
            this.activity.depends = [];
        }
        this.activity.depends.push(...dependencies);
        return this;
    }

    build(): Activity {
        if (!this.activity.name) {
            throw new Error("Activity name is required");
        }
        if (!this.activity.description) {
            throw new Error("Activity description is required");
        }
        return this.activity as Activity;
    }
}