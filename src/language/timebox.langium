import 'helpers'
import 'backlog'
import 'team'
type timeBoxTask = Epic| AtomicUserStory| TaskBacklog; 

TimeBox:
    'timebox' id=ID '{'
        (Name 
        | Description 
        | planning=Planning
        | performed=Performed
        | 'startDate' ':' startDate=STRING 
        | 'endDate' ':' endDate=STRING 
        | 'responsible' ':' responsible=[TeamMember:QualifiedName]
        | 'comment' ':' comment=STRING
        | Label)*
    '}'
;


Planning: 
    'planning' '{' 
        (planningItems+=PlanningItem)*
    '}' 
;

Performed:
    'performed' '{' 
        (performedItems+=PerfomedItem)*
    '}' 
;


PlanningItem:
    'item' ':' (item=[timeBoxTask:QualifiedName] | itemString=STRING)?
    ('assigner' ':' (assigner=[TeamMember:QualifiedName] | assignerString=STRING))?
    ('planned' ':' planned=INT)?
    ('complexity' ':' complexity=INT)?
;


PerfomedItem:
    'item' ':' (item=[timeBoxTask:QualifiedName] | itemString=STRING)?
    ('performed' ':' performed=INT)?
    ('complexity' ':' complexity=INT)?
    ('status' ':' status=('DOING'|'DONE'))?
;
