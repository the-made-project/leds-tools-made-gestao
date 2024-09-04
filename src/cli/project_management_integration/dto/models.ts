export type IssueDTO = {
    internalId: string;
    id: string;
    key: string;
    self: string;
    type: string;
  };
  
export type IssuesDTO = {
    issues: IssueDTO[];
 };


