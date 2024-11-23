import 'helpers'
import 'backlog'
type backlogElement = Epic| AtomicUserStory| TaskBacklog; 

Roadmap:
    'roadmap' id=ID'{'
        (Name 
        | Description
        | versions+=Version )*
    '}'
 ;    

Version:
    'version' id=ID '{'
        (
            Name 
            | Description 
            |'startDate'':' startDate=STRING 
            |'endDate' ':' endDate=STRING 
            |versionPlanning=VersionPlanning)*
    '}'
;

VersionPlanning:
    'planning' '{' 
        (planningItems+=VersionPlanningItem)*
    '}'    
;

VersionPlanningItem:
    ('item' ':' (item=[backlogElement:QualifiedName]))+
;

