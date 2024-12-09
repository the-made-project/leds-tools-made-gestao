import 'helpers'

Team: 'team' id=ID '{'
    (   Name  |Description |teammember+=TeamMember  )*
'}'
;

TeamMember:
    'teammember' id=ID '{' 
        (Name | Email | Discord )*  
    '}'
;