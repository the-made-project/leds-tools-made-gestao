import type { Model } from '../language/generated/ast.js';
import * as path from 'node:path';
import { GenerateOptions } from './main.js';
import { sincronized, generateProjectManagement} from './project_management_integration/generate.js'
import * as vscode from 'vscode';

export async function generate(model: Model, filePath: string, destination: string | undefined, opts: GenerateOptions): Promise<string> {
    const final_destination = extractDestination(filePath, destination)
    
    if (opts.only_synchronize_from_made_to_projectManagement){

        await sincronized(model, final_destination)        
        await generateProjectManagement(model, final_destination)        
        
    }
    /****
    if (opts.only_project_documentation){
        generateDocumentation(model,final_destination)
    }
    if (opts.all){
        generateDocumentation(model,final_destination)
        const name = await generateProjectManagement(model, final_destination)
        console.log(`Synchronized ${name}`)
    }
    ****/
    
    vscode.window.showInformationMessage("We MADE!")
    return final_destination;
}

function extractDestination(filePath: string, destination?: string) : string {
    const path_ext = new RegExp(path.extname(filePath)+'$', 'g')
    filePath = filePath.replace(path_ext, '')
  
    return destination ?? path.join(path.dirname(filePath))
  }