import { Issue } from "made-lib"; 

export class IssueBuilder {
    private issue: Partial<Issue>;

    constructor() {
        this.issue = {};
    }

    setId(id: string): IssueBuilder {
        this.issue.id = id;
        return this;
    }

    setExternalId(externalId: string): IssueBuilder {
        this.issue.externalId = externalId;
        return this;
    }

    setKey(key: string): IssueBuilder {
        this.issue.key = key;
        return this;
    }

    setSelf(self: string): IssueBuilder {
        this.issue.self = self;
        return this;
    }

    setType(type: string): IssueBuilder {
        this.issue.type = type;
        return this;
    }

    setTitle(title: string): IssueBuilder {
        this.issue.title = title;
        return this;
    }

    setDescription(description: string): IssueBuilder {
        this.issue.description = description;
        return this;
    }

    setStatus(status: string): IssueBuilder {
        this.issue.status = status;
        return this;
    }

    setCreatedDate(createdDate: string): IssueBuilder {
        this.issue.createdDate = createdDate;
        return this;
    }

    setIssues(issues: Issue[]): IssueBuilder {
        if(!this.issue.issues) {
            this.issue.issues = issues;
        }
        else {
            this.issue.issues.push(...issues);
        }
        return this;
    }

    setDepends(depends: Issue[]): IssueBuilder {
        this.issue.depends = depends;
        return this;
    }

    build(): Issue {
        if (!this.issue.id || !this.issue.type) {
            throw new Error("Issue must have an ID and a type.");
        }
        return this.issue as Issue;
    }
}