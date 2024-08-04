import { JsonFileCRUD } from "./JsonFileCRUD.js"
import path from "path";

export class IssueDAO extends JsonFileCRUD {

    constructor (targe_fodler:string){
        const ISSUEPATH = path.join(targe_fodler, 'issues.json');
        super(ISSUEPATH)
    }

}