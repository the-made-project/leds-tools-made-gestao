
import {Util} from './util.js';
import axios, { AxiosInstance } from 'axios';

const URL_ISSUE = "/rest/api/3/issue"
const URL_SPRINT = "/rest/agile/1.0/sprint"
const URL_USERS = "/rest/api/3/users/search"

const URL_ASSIGNEE = "/rest/api/3/user/assignable/search"

interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
}

interface ProgressInfo {
  fetched: number;
  total: number;
}


export interface Synchronized{
  execute(data: any): Promise<boolean>;
}

interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

enum IssueType {
  EPIC = 'Epic',
  STORY = 'Story',
  SUBTASK = 'Subtask',
  TASK = 'Task',
  BUG = 'Bug'
}

interface JiraIssueType {
  id: string;
  name: IssueType | string;
  subtask: boolean;
  hierarchyLevel: number;
}

interface SprintTasks {
  sprintName: string;
  sprintId: number;
  state: string;
  startDate?: string;
  endDate?: string;
  tasks: JiraIssue[];
}


interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    issuetype: JiraIssueType;
    parent?: {
      id: string;
      key: string;
      fields: {
        summary: string;
        issuetype: JiraIssueType;
      };
    };
    status: {
      name: string;
      statusCategory: {
        name: string;
      };
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    duedate?: string;
  };
}

export interface Board {
  id: number;
  name: string;
}

export interface Sprint {
  id: number;
  name: string;
  state: string;
  self: string;
  startDate: Date;
  endDate: Date;
}

export class JiraIntegrationService {

  projectKey: string;
  timeout: number;
  email:string;
  apiToken:string;
  host:string
  private axiosInstance: AxiosInstance;
  private readonly MAX_RESULTS_PER_PAGE = 100;

  private readonly DEFAULT_FIELDS = [
    'summary',
    'description',
    'issuetype',
    'parent',
    'status',
    'priority',
    'assignee',
    'created',
    'updated',
    'duedate'
  ];

  constructor(email: string, apiToken: string, host: string, projectkey: string){
    
    this.projectKey = projectkey;
    this.timeout = 150000
    this.email = email;
    this.apiToken = apiToken;
    this.host = host;

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    this.axiosInstance = axios.create({
      baseURL: host,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    }

  public async getAssigneeUsers(){
    const URL = this.host+URL_ASSIGNEE+`?project=${this.projectKey}`
    
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
    

  private async createIssue (summary: string, type: string, description: string, parent?:string, labels?: string[]){
      
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

  public async editMetaData(issueID: string, teamemberID?: string, startDate?: string, dueDate?: string){
    const URL = this.host + URL_ISSUE + `/${issueID}`;
    let dataFields: any = {};
  
    if (teamemberID) {
      dataFields.assignee = { "accountId": teamemberID };
    }
    if (dueDate) {
      dueDate = Util.convertDateFormat(dueDate);
      dataFields.duedate = dueDate;
    }

    if (startDate) {
      startDate = Util.convertDateFormat(startDate);
      dataFields.startDate = startDate;
    }
  
    const data = JSON.stringify({ "fields": dataFields });
  
    try {
      const response = await Util.send(URL, this.email, this.apiToken, data, "PUT", false);
      return response;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  

  /**
   * Busca todas as tarefas de um projeto com paginação automática
   */
  async getAllProjectTasks(
    projectKey: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  async getProjectEpics(
    projectKey: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `project = ${projectKey} AND issuetype = Epic ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  /**
   * Busca todas as User Stories de um projeto
   */
  async getProjectStories(
    projectKey: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `project = ${projectKey} AND issuetype = Story ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  /**
   * Busca todas as subtarefas de uma tarefa específica
   */
  async getTaskSubtasks(
    parentKey: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `parent = ${parentKey} ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  /**
   * Busca todas as tarefas de uma Epic específica
   */
  async getEpicTasks(
    epicKey: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `"Epic Link" = ${epicKey} ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  /**
   * Busca tarefas por tipo
   */
  async getTasksByType(
    projectKey: string,
    issueType: IssueType | string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    const jql = `project = ${projectKey} AND issuetype = "${issueType}" ORDER BY created DESC`;
    return this.getAllTasksByJQL(jql, onProgress);
  }

  async getAllTasksByJQL(
    jql: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<JiraIssue[]> {
    try {
      const initialResponse = await this.searchIssues(jql, 0);
      const totalIssues = initialResponse.total;
      
      if (totalIssues === 0) {
        return [];
      }

      let allIssues = initialResponse.issues;

      if (onProgress) {
        onProgress({
          fetched: allIssues.length,
          total: totalIssues
        });
      }

      const remainingPages = Math.ceil((totalIssues - allIssues.length) / this.MAX_RESULTS_PER_PAGE);
      
      for (let page = 1; page < remainingPages + 1; page++) {
        const startAt = page * this.MAX_RESULTS_PER_PAGE;
        const response = await this.searchIssues(jql, startAt);
        
        allIssues = [...allIssues, ...response.issues];

        if (onProgress) {
          onProgress({
            fetched: allIssues.length,
            total: totalIssues
          });
        }
      }

      return allIssues;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro na busca do Jira: ${error.response?.data?.errorMessages?.[0] || error.message}`);
      }
      throw error;
    }
  }

  private async searchIssues(
    jql: string,
    startAt: number
  ): Promise<JiraSearchResponse> {
    const response = await this.axiosInstance.get<JiraSearchResponse>('/rest/api/3/search', {
      params: {
        jql,
        startAt,
        maxResults: this.MAX_RESULTS_PER_PAGE,
        fields: this.DEFAULT_FIELDS.join(',')
      }
    });

    return response.data;
  }


  async getSprints(projectKey: string, includeState: 'active' | 'closed' | 'future' | 'all' = 'all'): Promise<JiraSprint[]> {
    try {
      // Primeiro, precisamos obter o ID do board
      const boardResponse = await this.axiosInstance.get(`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);
      const boardId = boardResponse.data.values[0]?.id;

      if (!boardId) {
        throw new Error('Board não encontrado para o projeto');
      }

      // Agora podemos buscar as sprints
      const response = await this.axiosInstance.get(`/rest/agile/1.0/board/${boardId}/sprint?state=${includeState}`);
      return response.data.values;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro ao buscar sprints: ${error.response?.data?.errorMessages?.[0] || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Busca todas as tarefas de uma sprint específica
   */
  async getSprintTasks(sprintId: number): Promise<JiraIssue[]> {
    try {
      const response = await this.axiosInstance.get(`/rest/agile/1.0/sprint/${sprintId}/issue`);
      return response.data.issues;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro ao buscar tarefas da sprint: ${error.response?.data?.errorMessages?.[0] || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Busca e organiza todas as tarefas de todas as sprints
   */
  async getAllSprintTasks(projectKey: string, sprintState: 'active' | 'closed' | 'future' ): Promise<SprintTasks[]> {
    const sprints = await this.getSprints(projectKey, sprintState);
    const sprintTasks: SprintTasks[] = [];

    for (const sprint of sprints) {
      const tasks = await this.getSprintTasks(sprint.id);
      sprintTasks.push({
        sprintName: sprint.name,
        sprintId: sprint.id,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        tasks
      });
    }

    return sprintTasks;
  }

  /**
   * Imprime as tarefas de cada sprint de forma organizada
   */
  




public async synchronizedIssues(synchronized: Synchronized, project: string){
  const tarefas = await this.getAllProjectTasks(project, (progress) => {
    console.log(`Progresso: ${progress.fetched}/${progress.total} tarefas`);
  });

  tarefas.forEach(async (data:any) =>{
    synchronized.execute(data)
  });
}


  public async synchronizedTeamMember(synchronized: Synchronized){
  
    const teamMembers = await this.getUsers()
    
    teamMembers.forEach(async (data:any) =>{
      synchronized.execute(data)
    });

  }

  public async synchronizedSprintTask (synchronized: Synchronized, project:string){
    const sprints = await this.getAllSprintTasks(project, 'active');
    const sprnitsClosed = await this.getAllSprintTasks(project, 'closed');
    const sprnitsFuture = await this.getAllSprintTasks(project, 'future');
    
    sprints.forEach(async (data:any) =>{
      synchronized.execute (data)
      console.log(data)
    });

    sprnitsClosed.forEach(async (data:any) =>{
      synchronized.execute (data)
      console.log(data)
    });
    sprnitsFuture.forEach(async (data:any) =>{
      synchronized.execute (data)
      console.log(data)
    });
  }

  public async synchronizedSprint (synchronized: Synchronized){
    const URL = this.host + '/rest/agile/1.0/board'
    const response = await Util.get(URL,this.email, this.apiToken)
    const boards = response.values;
    
    await boards.forEach(async (board: Board) =>{
      const URL_SPRINT_BOARD = URL + `/${board.id}/sprint`
      const responseBoard = await Util.get(URL_SPRINT_BOARD,this.email, this.apiToken)            
      const sprints = responseBoard.values;   

      sprints.forEach(async (sprint:any) =>{
        synchronized.execute(sprint)
      });
    
    }) 

    
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