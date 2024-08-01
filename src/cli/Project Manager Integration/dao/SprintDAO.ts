import { JsonFileCRUD } from "./JsonFileCRUD.js"
import path from "path";

export class SprintDAO extends JsonFileCRUD {

    constructor (targe_fodler:string){
        const ISSUEPATH = path.join(targe_fodler, 'sprints.json');
        super(ISSUEPATH)
    }

}