
import 'processes'

type backlogItem = Epic| AtomicUserStory| TaskBacklog; 

Backlog:
    'backlog' id=ID '{'
        (   Name
            |Label
            |Description
            |items += (Epic| AtomicUserStory| TaskBacklog)
        )*
    '}'
;

Epic :
    'epic' id=ID '{'
        (Name 
        |Description
        |Label 
        |userstories +=AtomicUserStory
        |'process' ':' process=[Process:QualifiedName]
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?
        )*
       
    '}'
;

AtomicUserStory :
    'story' id=ID '{' 
        (Name 
        |Description
        |Label        
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?
        |'activity' ':' activity+=[Activity:QualifiedName]
        |tasks +=TaskBacklog
        )*
    '}'
;

TaskBacklog:
    'task' id=ID '{'
        (Name 
        |Description
        |Label
        |'depends' ':' depend=[backlogItem:QualifiedName] (',' depends+=[backlogItem:QualifiedName])?        
        |'task' ':' task=[Task:QualifiedName])* 
       '}'
;