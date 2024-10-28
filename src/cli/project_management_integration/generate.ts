
import { Model} from '../../language/generated/ast.js'


import { JiraApplication } from './application/JiraApplication.js';
import { EventEmitter } from 'events';

import { EnvLoader } from './util/envLoader.js';

/**
 * Função para gerar a gestão de projetos no Jira a partir de um modelo.
 * 
 * @param {Model} model - O modelo contendo as informações do projeto.
 * @param {string} target_folder - A pasta de destino onde os dados serão salvos.
 * @returns {Promise<string>} - O nome do projeto.
 */


async function createJira( model: Model,target_folder: string): Promise<JiraApplication>{
  const eventBus = new EventEmitter(); 
  
  new EnvLoader(target_folder);

  const host = EnvLoader.getEnvVariable('HOST') ?? "" 
  const email = EnvLoader.getEnvVariable('EMAIL') ?? ""   
  const apiToken  = EnvLoader.getEnvVariable('TOKEN') ?? ""  
  const projectKey = EnvLoader.getEnvVariable('PROJECTKEY') ?? ""   
  
  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder,model, eventBus)

  return Jira
}


export async function generateProjectManagement(model: Model,target_folder: string) : Promise<string> {
  
  // Shared EventEmitter instance
  const Jira = await createJira(model,target_folder)
  
  await Jira.createModel()
  
  return model.project.name ?? ""
}

export async function sincronized(model: Model,target_folder: string):  Promise<string>{
  // Shared EventEmitter instance
  const Jira = await createJira(model,target_folder)
  await Jira.sincronized()
  return model.project.name ?? ""
}
