import type { Model } from '../language/generated/ast.js';
import * as path from 'node:path';
import { GenerateOptions } from './main.js';
import { ApplicationManager } from './project_management/application/ApplicationManager.js';


export async function generate(model: Model, filePath: string, destination: string | undefined, opts: GenerateOptions): Promise<string> {
    const final_destination = extractDestination(filePath, destination)
    
    const appManager = new ApplicationManager(final_destination, model);
    await appManager.initializeApplications();
    
    
    return final_destination;
}

function extractDestination(filePath: string, destination?: string) : string {
    const path_ext = new RegExp(path.extname(filePath)+'$', 'g')
    filePath = filePath.replace(path_ext, '')
  
    return destination ?? path.join(path.dirname(filePath))
}

export function validate(){
    console.log ("funcionando")
}

