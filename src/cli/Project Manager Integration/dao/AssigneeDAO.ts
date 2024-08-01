import { JsonFileCRUD } from "./JsonFileCRUD.js"
import path from "path";

export class AssigneeDAO extends JsonFileCRUD {

    constructor (targe_fodler:string){
        const ISSUEPATH = path.join(targe_fodler, 'assignees.json');
        super(ISSUEPATH)
    }

}