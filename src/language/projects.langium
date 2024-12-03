import 'terminals'
import 'helpers'
Project:
    'project' id=ID '{'
    (   Name 
        | Description  
        | DueDate
        | StartDate
        | CompletedDate
    )*
'}'
;