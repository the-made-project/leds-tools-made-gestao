import type { Model } from '../language/generated/ast.js';
import * as path from 'node:path';
import { GenerateOptions } from './main.js';
import { generateProjectManagement} from './project_management_integration/generate.js'
import * as vscode from 'vscode';
import { generateDocumentation } from './documentation/generate.js';

export async function generate(model: Model, filePath: string, destination: string | undefined, opts: GenerateOptions): Promise<string> {
    const final_destination = extractDestination(filePath, destination)
    
    if (opts.only_project_documentation){
        await generateDocumentation(model,final_destination)
    }
    if (opts.all){
        //await sincronized(model, final_destination)
        //await generateDocumentation(model,final_destination)
        await generateProjectManagement(model, final_destination)
        
    }
    
    vscode.window.showInformationMessage("We MADE!")
    return final_destination;
}

function extractDestination(filePath: string, destination?: string) : string {
    const path_ext = new RegExp(path.extname(filePath)+'$', 'g')
    filePath = filePath.replace(path_ext, '')
  
    return destination ?? path.join(path.dirname(filePath))
  }