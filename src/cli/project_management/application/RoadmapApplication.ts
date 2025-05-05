
import {  isRoadmap, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { Roadmap, Issue, Release, Milestone} from "made-report-lib";

export  class RoadmapApplication extends AbstractApplication {

    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "roadmap.json"
    }

    public async create(){
        
       const roadmaps = this.model.components.filter (isRoadmap);

       await Promise.all(roadmaps.map(async roadmap => {
        const instance: Roadmap = {
            id: roadmap.id,
            name: roadmap.name ?? "",
            description: roadmap.description ?? "",
            milestones: await Promise.all(
                (roadmap.milestones ?? []).map(async milestone => ({
                    id: milestone.id,
                    name: milestone.name,
                    description: milestone.description,
                    startDate: milestone.startDate,
                    dueDate: milestone.dueDate,
                    status: milestone.status,
                    releases: await Promise.all(
                        (milestone.releases ?? []).map(async release => {
                            // Processa os issues primeiro
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
                                status: release.status ?? 'PLANNED',
                                issues
                            } as Release;
                        })
                    )
                })as Milestone) 
            )
        };
        await this.addItem(instance)
        await this.saveorUpdate(instance);
    }));
        await  this.clean()
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