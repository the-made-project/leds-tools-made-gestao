
import 'processes'

type backlogItem = Epic| AtomicUserStory| TaskBacklog; 

Backlog:
    'backlog' id=ID '{'
        (   Name
            |Label
            |Description
            |userstories += (Epic| AtomicUserStory| TaskBacklog))*
    '}' 
    ;

Epic :
    'epic' id=ID '{'
        (Name  
        |Description
        |DefinitionDone
        |'replace' ':' replace=STRING
        |DefinitionReady
        |Label 
        |Learning
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?
        |'process' ':' process=[Process:QualifiedName])* 
       
        '}'
;

AtomicUserStory :
    'userstory' id=ID '{' 
        (Name 
        |Description
        |DefinitionDone
        |DefinitionReady
        |Learning
        |Label
        |'epic' ':' epic=[Epic:QualifiedName] 
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?
        |'activity' ':' activity=[Activity:QualifiedName]
        )*'}'
;

TaskBacklog:
    'task' id=ID '{'
        (Name 
        |Description
        |DefinitionDone
        |DefinitionReady
        |Learning 
        |Label
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?
        |'userstory'':'  userstory=[AtomicUserStory:QualifiedName]
        |'task' ':' task=[Task:QualifiedName])* 
        '}'
;
    




