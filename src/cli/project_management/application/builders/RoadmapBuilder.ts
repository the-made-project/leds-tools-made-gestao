import { Roadmap, Milestone} from "made-report-lib-test";

export class RoadmapBuilder {
    private roadmap: Partial<Roadmap>;

    constructor() {
        this.roadmap = {};
    }

    setId(id: string): RoadmapBuilder {
        this.roadmap.id = id;
        return this;
    }

    setName(name: string): RoadmapBuilder {
        this.roadmap.name = name;
        return this;
    }

    setDescription(description: string): RoadmapBuilder {
        this.roadmap.description = description;
        return this;
    }

    async setMilestones(processMilestones: () => Promise<Milestone[]>): Promise<RoadmapBuilder> {
        this.roadmap.milestones = await processMilestones();
        return this;
    }

    build(): Roadmap {
        if (!this.roadmap.id || !this.roadmap.name) {
            throw new Error("Roadmap must have an ID and a name.");
        }
        return this.roadmap as Roadmap;
    }
}