import { Project } from "made-report-lib-test";

export class ProjectBuilder {
    private project: Partial<Project>

    constructor() {
        this.project = {}
    }

    setId(id: string): ProjectBuilder {
        this.project.id = id
        return this
    }

    setName(name: string): ProjectBuilder {
        this.project.name = name
        return this
    }

    setDescription(description: string): ProjectBuilder {
        this.project.description = description
        return this
    }

    setStartDate(startDate: string): ProjectBuilder {
        this.project.startDate = startDate
        return this
    }

    setDueDate(dueDate: string): ProjectBuilder {
        this.project.dueDate = dueDate
        return this
    }

    setCompletedDate(completedDate: string): ProjectBuilder {
        this.project.completedDate = completedDate
        return this
    }

    build(): Project {
        if (!this.project.id) {
            throw new Error("Project ID is required")
        }
        if (!this.project.name) {
            throw new Error("Project name is required")
        }
        return this.project as Project
    }
}