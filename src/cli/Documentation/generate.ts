import { Model} from '../../language/generated/ast.js'
import { MarkdownService } from './service/markdown/MarkdownService.js'

export function generateDocumentation(model: Model,target_folder: string) : void {
  
    const markdownService = new MarkdownService(model,target_folder)

    markdownService.createProcessDocumentation()
    markdownService.createManagementDocumenation()
    
}