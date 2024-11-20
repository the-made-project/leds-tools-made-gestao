export type Backlog = {
  id: string;
  name: string
  description: string
  issues?:Issue[];
  
}

export type Issue = {
    id: string;
    externalId?: string;
    key?: string;
    self?: string;
    type: string;
    title?: string;
    description?:string;
    status?:string;
    createdDate?:string;            
    parent?:Issue
    depends?: Issue[];
    labels?: string[];
  };
  
export type IssuesDTO = {
    data: any[];
 };

export type SprintItem = {
  id: string;
  person:Person;
  issue: Issue;  
  startDate?: string;
  dueDate?: string;
  completedDate?:string;
  endDate?: string;
  status?: string;  
}

export type Team = {
  id:string;  
  name : string;
  description: string
  teammebers: Person[] 
}

export type Person = {
  id:string;  
  email: string;
  name : string;  
}


 export type TimeBox = {
  id?: string;  
  startDate:string;
  endDate: string;
  name: string;      
  completeDate?:string;  
  sprintItems:SprintItem[];
};

