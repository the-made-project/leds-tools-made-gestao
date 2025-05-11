import { isBacklog, Model } from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";
import { BacklogBuilder } from "./builders/BacklogBuilder.js";

export class BacklogApplication extends AbstractApplication {
    constructor(target_folder: string, model: Model) {
        super(target_folder, model);
        this.jsonFile = "backlog.json";
    }

    public async create() {
        const backlogs = this.model.components.filter(isBacklog);

        await Promise.all(
            backlogs.map(async backlog => {
            
                const instance = (await new BacklogBuilder()
                  .setId(backlog.id)
                  .setName(backlog.name ?? "")
                  .setDescription(backlog.description ?? "")
                  .setIssues(async () => {
                    return await Promise.all(
                      backlog.items?.map(async (issue) => {
                        return await this.createIssue(issue.$container.id, issue);
                      }) ?? []
                    );
                  }))
                  .build();

                await this.saveorUpdate(instance);
                await this.addItem(backlog);
            })
        );

        await this.clean();
    }
}