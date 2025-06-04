// import { ReportManager } from "made-report-lib-test";
// import type { Model } from "../../../language/generated/ast.js";
// import { /*isIssue*/, isProject } from "../../../language/generated/ast.js";

// export class GitHubPushService {
//     private model: Model;

//     constructor(model: Model) {
//         this.model = model;
//     }

//     public async pushToGitHub(token: string, org: string, repo: string): Promise<void> {
//         const project = this.model.components.find(isProject); // Encontra o projeto no modelo
//         const issues = this.model.components.filter(isIssue); // Filtra as issues do modelo

//         if (!project) {
//             throw new Error("No project found in the model.");
//         }

//         console.log("Pushing project and issues to GitHub...");
//         const reportManager = new ReportManager();
//         await reportManager.githubPush(token, org, repo, project, issues);
//         console.log("Project and issues pushed to GitHub successfully!");
//     }
// }