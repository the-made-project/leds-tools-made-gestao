import 'helpers'
import 'backlog'
import 'team'
type timeBoxTask = Epic| AtomicUserStory| TaskBacklog; 

TimeBox:
    'sprint' id=ID '{'
        (Name 
        | Description 
        | sprintBacklog = SprintBacklog
        | StartDate
        | EndDate
        | 'comment' ':' comment=STRING
        | Label)*
    '}'
;


SprintBacklog: 
    'sprintbacklog' id=ID '{' 
        (planningItems+=PlanningItem)*
    '}' 
;
 
PlanningItem: 'item' id=[timeBoxTask:QualifiedName] '{'
    
    ('assignee' ':' assignee=[TeamMember:QualifiedName]
        |'complexity' ':' complexity=('EASY'|'MEDIUM|HARD|SPIKE')
        |DueDate
        |StartDate
        |CompletedDate
        |'status' ':' status=('TODO'|'DOING'|'DONE')
    )*
'}'  
;
    