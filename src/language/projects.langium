import 'terminals'
import 'helpers'
Project:
    'project' name=STRING'{'
    (Identification 
    & Description 
    & 'email' ':' email=STRING
    & 'host' ':' host=STRING
    & 'token' ':' token=STRING
    )
    '}' 
    ;