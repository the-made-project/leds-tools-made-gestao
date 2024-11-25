import 'helpers'
type processType =  Process| Activity| Task; 

Process:
    'process' id=ID'{'
        (Name | Description | activities+= Activity |DefinitionDone|DefinitionReady|Learning|Label|'depends' ':' depend=[processType:QualifiedName] (',' depends+=[processType:QualifiedName])?)*
    '}'
 ;    

Activity:
    'activity' id=ID '{'
        (Name | Description | tasks+=Task |DefinitionDone|DefinitionReady|Learning|Label|'depends' ':' depend=[processType:QualifiedName] (',' depends+=[processType:QualifiedName])?)*
    '}'
;

Task:
    'task' id=ID '{'
        (Name | Description |DefinitionDone|DefinitionReady|Learning|Label|'depends' ':' depend=[processType:QualifiedName] (',' depends+=[processType:QualifiedName])?)*
        
    '}'
;

