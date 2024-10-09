
import { Model} from '../../language/generated/ast.js'


import { JiraApplication } from './application/JiraApplication.js';
import { EventEmitter } from 'events';

require('dotenv').config();


const host = process.env.HOST ? process.env.HOST: ""
const email = process.env.EMAIL ? process.env.EMAIL: ""
const apiToken  = process.env.TOKEN ? process.env.TOKEN: ""
const projectKey = process.env.PROJECTKEY ? process.env.PROJECTKEY: ""

/**
 * Função para gerar a gestão de projetos no Jira a partir de um modelo.
 * 
 * @param {Model} model - O modelo contendo as informações do projeto.
 * @param {string} target_folder - A pasta de destino onde os dados serão salvos.
 * @returns {Promise<string>} - O nome do projeto.
 */

export async function generateProjectManagement(model: Model,target_folder: string) : Promise<string> {
  
  // Shared EventEmitter instance
  const eventBus = new EventEmitter();  


  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder,model, eventBus)
  await Jira.createModel()
  
  return model.project.name
}

export async function generateMadeFile(model: Model,target_folder: string) : Promise<string> {
  
  const eventBus = new EventEmitter();  
  
  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder,model, eventBus)
  await Jira.GetProjectInformation(model)
  return model.project.name;
}