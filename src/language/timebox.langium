import 'helpers'
import 'backlog'
import 'team'


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
 
PlanningItem: 'item' backlogItem=[backlogItem:QualifiedName] '{'
    
    ('assignee' ':' assignee=[TeamMember:QualifiedName]
        |'complexity' ':' complexity=('EASY'|'MEDIUM|HARD|SPIKE')
        |DueDate
        |StartDate
        |CompletedDate
        |'status' ':' status=('TODO'|'DOING'|'DONE')
    )*
'}'  
;
    