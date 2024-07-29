
import 'backlog'
import 'team'
type timeBoxTask = Epic| AtomicUserStory| TaskBacklog; 

TimeBox:
    'timebox' id=ID '{'
        (Name 
        |Description 
        |plannig=Planning
        |performed=Peformed
        |'startDate'':' startDate=STRING 
        |'endDate' ':' endDate=STRING 
        |'responsible' ':' responsible=[TeamMember:QualifiedName]
        |'comment' ':' comment=STRING
        |Label)*
    '}' 
    ;

Planning: 
    'planning' '{' 
        (planningItems+=PlanningItem)*
    '}' 
;

Peformed:
    'performed' '{' 
        (performedItems+=PerfomedItem)*
    '}' 
;


PlanningItem:
    ('item' ':' item=[timeBoxTask:QualifiedName])? 
    ('item' ':' itemString=STRING)? 
    ('assigner' ':' assigner=[TeamMember:QualifiedName])? 
    ('assigner' ':' assignerString=STRING)? 
    ('planned' ':' planned=INT)?    
    ('complexity' ':' complexity=INT)?
    
;

PerfomedItem:
    ('item' ':' item=[timeBoxTask:QualifiedName])? 
    ('item' ':' itemString=STRING)?  
    ('performed' ':' performed=INT)?
    ('complexity' ':' complexity=INT)?
    ('status' ':' status=('DOING'|'DONE'))?
;  