import 'terminals'
import 'helpers'
Project:
    'project' '{'
    (   Name 
        | Description  
        |'dueDate' ':' duedate=STRING
        |'startDate' ':' startdate=STRING
        |'completedDate' ':' completedDate=STRING
    )*
    '}' 
    ;