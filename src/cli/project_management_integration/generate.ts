
import { Model} from '../../language/generated/ast.js'
import { LocalApplication } from './application/LocalApplication.js';

/**
 * Função para gerar a gestão de projetos no Jira a partir de um modelo.
 * 
 * @param {Model} model - O modelo contendo as informações do projeto.
 * @param {string} target_folder - A pasta de destino onde os dados serão salvos.
 * @returns {Promise<string>} - O nome do projeto.
 */


export async function generateProjectManagement(model: Model,target_folder: string) : Promise<string> {
  
  
  const local = new LocalApplication(target_folder,model)
  await local.createModel()
  
  return model.project.name ?? ""
}