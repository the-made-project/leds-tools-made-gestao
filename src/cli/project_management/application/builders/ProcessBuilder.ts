import { Process, Activity, Task } from "made-lib-made-eto";

export class ProcessBuilder {
    private process: Partial<Process>;

    constructor() {
        this.process = {};
    }

    setId(id: string): ProcessBuilder {
        this.process.id = id;
        return this;
    }

    setName(name: string): ProcessBuilder {
        this.process.name = name;
        return this;
    }

    setDescription(description: string): ProcessBuilder {
        this.process.description = description;
        return this;
    }

    setActivities(activities: Activity[]): ProcessBuilder {
        if (!this.process.activities) {
            this.process.activities = [];
        }
        this.process.activities.push(...activities);
        return this;
    }

    setDepends(dependencies: (Process | Activity | Task)[]): ProcessBuilder {
        if (!this.process.depends) {
            this.process.depends = [];
        }
        this.process.depends.push(...dependencies);
        return this;
    }

    build(): Process {
        if (!this.process.name) {
            throw new Error("Process name is required");
        }
        if (!this.process.description) {
            throw new Error("Process description is required");
        }
        return this.process as Process;
    }
}