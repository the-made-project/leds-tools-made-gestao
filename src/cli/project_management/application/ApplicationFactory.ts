import {  Model } from "../../../language/generated/ast.js"

import { BacklogApplication } from "./BacklogApplication.js";
import { IssueApplication } from "./IssueApplication.js";
import { TeamApplication } from "./TeamApplication.js";
import { TimeBoxApplication } from "./TimeBoxApplication.js";

import { RoadmapApplication } from './RoadmapApplication.js';
import { ProcessApplication } from './ProcessApplication.js';
import { ProjectApplication } from './ProjectApplication.js';

export class ApplicationFactory {
    static createApplication(type: string, target_folder: string, model: Model) {
        const applicationClasses: { [key: string]: any } = {
            TimeBox: TimeBoxApplication,
            Team: TeamApplication,
            Issue: IssueApplication,
            Backlog: BacklogApplication,
            Roadmap: RoadmapApplication,
            Process: ProcessApplication,
            Project: ProjectApplication,
        };

        const ApplicationClass = applicationClasses[type];
        if (!ApplicationClass) {
            throw new Error(`Unknown application type: ${type}`);
        }

        return new ApplicationClass(target_folder, model);
    }
}