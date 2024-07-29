import type { Model } from '../language/generated/ast.js';
import * as path from 'node:path';
import { GenerateOptions } from './main.js';
import { generateDocumentation} from './Documentation/generate.js'

export function generate(model: Model, filePath: string, destination: string | undefined, opts: GenerateOptions): string {
    const final_destination = extractDestination(filePath, destination)
    
    if (opts.only_project_management){
    }
    if (opts.only_project_documentation){
        generateDocumentation(model,final_destination)
    }
    if (opts.all){

    }
    
   
    return final_destination;
}

function extractDestination(filePath: string, destination?: string) : string {
    const path_ext = new RegExp(path.extname(filePath)+'$', 'g')
    filePath = filePath.replace(path_ext, '')
  
    return destination ?? path.join(path.dirname(filePath))
  }