import {Util} from './util.js';

const URL_ISSUE = "/rest/api/3/issue"
const URL_SPRINT = "/rest/agile/1.0/sprint"
const URL_USERS = "/rest/api/3/users/search"

const URL_ASSIGNEE = "/rest/api/3/user/assignable/search"


export class JiraIntegrationService {

  projectKey: string;
  timeout: number;
  email:string;
  apiToken:string;
  host:string

  constructor(email: string, apiToken: string, host: string, projectkey: string){
    
    this.projectKey = projectkey;
    this.timeout = 150000
    this.email = email;
    this.apiToken = apiToken;
    this.host = host;
      
    }

  public async getAssigneeUsers(){
    const URL = this.host+URL_ASSIGNEE+`?project=${this.projectKey}`
    console.log(URL)
    const members = await Util.get(URL,this.email, this.apiToken)
    const people = members.filter((member:any) => member.accountType === 'atlassian');
    return people
  }

  public async createEPIC (summary: string, description: string,  parent?:string, labels?: string[] ){
      
      return await this.createIssue(summary,'Epic',description, parent, labels)
  }

  public async createUserStory (summary: string,description: string, parent?:string, labels?: string[]){
      
      return await this.createIssue(summary,'Story',description, parent, labels )
}

  public async createTask (summary: string, description: string, parent?:string, labels?: string[] ){

      return await this.createIssue(summary,'Task',description,parent, labels )
}

  public async createSubTask (summary: string,description: string, parent?:string, labels?: string[] ){
     
      return await this.createIssue(summary,'Subtarefa',description,parent, labels )
    }
    

  private async createIssue (summary: string, type: string, description: string, parent?:string, labels?: string[] ){
      
      const URL = this.host+URL_ISSUE
    
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout'));
        }, this.timeout);
      });
    
      const labelPart = labels ? `,"labels": [${labels.map(label=> `\"${label}\"`).join(",")} ]` : ``;

      const parentPart = parent ? `,"parent":{"key": "${parent}"}` : ` `;
      
      const descriptionPart = description ? `,"description": {
        "content": [
          {
            "content": [
              {
                "text": "${description}",
                "type": "text"
              }
            ],
            "type": "paragraph"
          }
        ],
        "type": "doc",
        "version": 1
      }` : ``;

      const data = `{
        "fields": {
          "summary": "${summary}",
          "issuetype": {
            "name": "${type}"
          },
          "project": {
            "key": "${this.projectKey}"
          }${labelPart}${descriptionPart}${parentPart}          
        }
      }`
      return Promise.race([
        await Util.send(URL,this.email, this.apiToken, data,"POST", true),
        timeoutPromise,
        ]);

    }
    
  public async moveIssueToSprint(issues:string[], sprintID:string){

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, this.timeout);
    });

    const URL = this.host+`/rest/agile/1.0/sprint/${sprintID}/issue`
    const data = `{"issues":[${issues.map(issue=>`\"${issue}\"`).join(",")}]}`
   
    return Promise.race([
      await Util.send(URL,this.email, this.apiToken, data,"POST",false),
      timeoutPromise,
    ]);
  } 

  public async getBoardIdByProjectKey(projectKey:string){

    
    const URL = this.host+`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`
    
    const response =await Util.get(URL,this.email, this.apiToken)
    const board = response["values"][0];
    return board["id"]

  }

  public async getUsers(){
    const URL = this.host+URL_USERS
    const members = await Util.get(URL,this.email, this.apiToken)
    const people = members.filter((member:any) => member.accountType === 'atlassian');
    return people 
  }

  public async assigneTeamMemberIssue(issueID: string, teamemberID: string){
    
    const URL = this.host+URL_ISSUE+`/${issueID}/assignee`
    console.log (teamemberID)
    try {
     
      const data = `{
        "accountId": "${teamemberID}"
      }`;
     
      return await Util.send(URL,this.email, this.apiToken, data,"PUT",false)
    }catch (error) {
      throw new Error((error as Error).message);
    }
  }

  public async createSprint (name:string, goal: string, startDate: string, endDate: string){
    try {
      
      const URL = this.host+URL_SPRINT
      
      startDate = Util.convertDateFormat(startDate)
      endDate = Util.convertDateFormat (endDate)
      
      const boardID = await this.getBoardIdByProjectKey(this.projectKey)
     
      const data = `{
        "startDate": "${startDate}",
        "name": "${name}",
        "endDate": "${endDate}",
        "goal": "${goal}",
        "originBoardId": ${boardID}
      }`;

  
      return await Util.send(URL,this.email, this.apiToken, data,"POST",true)
      

    }catch (error) {
      throw new Error(`Error fetching data: ${(error as Error).message}`);
    }

  }


}