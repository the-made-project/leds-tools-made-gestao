import { Team, Person } from "made-report-lib";

export class TeamBuilder {
    private team: Partial<Team>

    constructor() {
        this.team = {}
    }

    setId(id: string): TeamBuilder {
        this.team.id = id
        return this
    }

    setName(name: string): TeamBuilder {
        this.team.name = name
        return this
    }

    setDescription(description: string): TeamBuilder {
        this.team.description = description
        return this
    }

    setTeamMembers(teamMembers: Person[]): TeamBuilder {
        this.team.teammebers = teamMembers
        return this
    }
    
    build(): Team {
        if (!this.team.id || !this.team.name) {
            throw new Error("TimeBox must have an ID and a name.")
        }
        return this.team as Team
    }
}