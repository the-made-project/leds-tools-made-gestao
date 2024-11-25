import 'terminals'
import 'helpers'
Project:
    'project' '{'
    (   Name 
        | Description  
        | DueDate
        | StartDate
        | CompletedDate)*
    '}'
    ;