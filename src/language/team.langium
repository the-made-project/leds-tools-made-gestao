import 'helpers'

Team: 'team' id=ID '{'
    (   Name
        |Label
        |Description
        |teammember+=TeamMember)*
'}'
;

TeamMember:
    'teammember' id=ID '{' 
        ('name' ':' name=STRING | ('email' ':' email=STRING)? )*  
    '}'
;