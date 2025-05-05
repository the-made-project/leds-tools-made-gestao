import 'terminals'

QualifiedName returns string:
    ID ('.' ID)*
;

QualifiedNameWithWildcard returns string:
    QualifiedName '.*'?
;

fragment Email:
    'email' ':' email=STRING
;

fragment Discord:
    'discord' ':' email=STRING
;


fragment Description:
    'description' ':' description=STRING
;

fragment Label:
    'label' ':' label=ID (',' labelx+=ID)*
;

fragment Name:
    'name' ':' name=STRING
;

fragment Identification:
    'id' ':' Identification=ID
;

fragment FullName: 
    'fullName' ':' fullName = STRING
;

fragment DefinitionDone:
    'definition_done' ':' dod=STRING (',' dod+=STRING)*
;

fragment DefinitionReady:
    'definition_ready' ':' dor=STRING (',' dor+=STRING)*
;

fragment Learning:
    'learning'':'  value=STRING (',' value+=STRING)*
;

fragment StartDate:
'startDate' ':' startDate=DATE 
;

fragment EndDate:
    'endDate' ':' endDate=DATE 
;

fragment DueDate:
    'dueDate' ':' dueDate=DATE
;

fragment CompletedDate:
    'completedDate' ':' completedDate=DATE
;