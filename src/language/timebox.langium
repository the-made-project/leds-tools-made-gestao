import 'helpers'
import 'backlog'
import 'team'
type timeBoxTask = Epic| AtomicUserStory| TaskBacklog; 

TimeBox:
    'sprint' id=ID '{'
        (Name 
        | Description 
        | sprintBacklog =SprintBacklog
        | 'startDate' ':' startDate=STRING 
        | 'endDate' ':' endDate=STRING 
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
        |'dueDate' ':' duedate=STRING
        |'startDate' ':' startdate=STRING
        |'completedDate' ':' completedDate=STRING
        |'status' ':' status=('TODO'|'DOING|DONE')
    )*
'}'  
;
    