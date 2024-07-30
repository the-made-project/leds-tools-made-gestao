
import { Model} from '../../language/generated/ast.js'


import { JiraApplication } from './application/JiraApplication.js';


export async function generateProjectManagement(model: Model,target_folder: string) : Promise<string> {
  
  
  const host = model.project.host; 
  const email = model.project.email; 
  const apiToken  = model.project.token; 
  const projectKey = model.project.Identification;

  const Jira = new JiraApplication(email,apiToken,host,projectKey,target_folder)
  for (let a = 0 ; a <=3 ; a++){
    await Jira.run(model)
  }
  
  
  return model.project.name
}