
import { Model} from '../../language/generated/ast.js'


import { JiraApplication } from './application/JiraApplication.js';
import { EventEmitter } from 'events';

/**
 * Função para gerar a gestão de projetos no Jira a partir de um modelo.
 * 
 * @param {Model} model - O modelo contendo as informações do projeto.
 * @param {string} target_folder - A pasta de destino onde os dados serão salvos.
 * @returns {Promise<string>} - O nome do projeto.
 */

export async function generateProjectManagement(model: Model,target_folder: string) : Promise<string> {
  
  const host = model.project.host; 
  const email = model.project.email; 
  const apiToken  = model.project.token; 
  const projectKey = model.project.Identification;

  // Shared EventEmitter instance
  const eventBus = new EventEmitter();  


  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder,model, eventBus)
  await Jira.createModel()
  
  return model.project.name
}

export async function generateMadeFile(model: Model,target_folder: string) : Promise<string> {
  
  const host = model.project.host; 
  const email = model.project.email; 
  const apiToken  = model.project.token; 
  const projectKey = model.project.Identification;
  const eventBus = new EventEmitter();  
  
  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder,model, eventBus)
  await Jira.GetProjectInformation(model)
  return model.project.name;
}