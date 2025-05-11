import { Backlog, Issue } from "made-report-lib";

export class BacklogBuilder {
    private backlog: Partial<Backlog>;

    constructor() {
        this.backlog = {};
    }

    setId(id: string): BacklogBuilder {
        this.backlog.id = id;
        return this;
    }

    setName(name: string): BacklogBuilder {
        this.backlog.name = name;
        return this;
    }

    setDescription(description: string): BacklogBuilder {
        this.backlog.description = description;
        return this;
    }

    setIssues(issues: Issue[]): BacklogBuilder {
        this.backlog.issues = issues;
        return this;
    }

    build(): Backlog {
        if (!this.backlog.id || !this.backlog.name) {
            throw new Error("Backlog must have an ID and a name");
        }
        return this.backlog as Backlog;
    }
}