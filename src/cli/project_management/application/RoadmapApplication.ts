
import {  isRoadmap, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { Issue, Release, Milestone} from "made-lib-dev";
import { RoadmapBuilder } from "./builders/RoadmapBuilder.js";

export  class RoadmapApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "roadmap.json"
    }

    public async create() {
        const roadmaps = this.model.components.filter(isRoadmap);

        await Promise.all(
            roadmaps.map(async roadmap => {
                const instance = (await new RoadmapBuilder()
                    .setId(roadmap.id)
                    .setName(roadmap.name ?? "")
                    .setDescription(roadmap.description ?? "")
                    .setMilestones(async () => {
                        return await Promise.all(
                            (roadmap.milestones ?? []).map(async milestone => ({
                                id: milestone.id,
                                name: milestone.name,
                                description: milestone.description,
                                startDate: milestone.startDate,
                                dueDate: milestone.dueDate,
                                status: milestone.status,
                                releases: await Promise.all(
                                    (milestone.releases ?? []).map(async release => {
                                        const issues = release.item
                                            ? [await this.createIssue("", release.item.ref)]
                                            : await this.createIssues([
                                                ...(release.itens ?? []),
                                                release.item
                                            ].filter(Boolean));

                                        return {
                                            id: release.id,
                                            version: release.version ?? "",
                                            name: release.name ?? "",
                                            description: release.description ?? "",
                                            dueDate: release.dueDate,
                                            releasedDate: release.releasedDate,
                                            status: release.status ?? "PLANNED",
                                            issues
                                        } as Release;
                                    })
                                )
                            }) as Milestone)
                        );
                    }))
                    .build();

                await this.addItem(instance);
                await this.saveorUpdate(instance);
            })
        );

        await this.clean();
    }

    private async createIssues(items: any[]): Promise<Issue[]> {
      if (!items?.length) return [];
      
      // Aguarda todas as Promises de createIssue
      return Promise.all(
          items
              .filter(Boolean) // Remove itens null/undefined
              .map(item => this.createIssue("", item.ref))
      );
  }
       
}