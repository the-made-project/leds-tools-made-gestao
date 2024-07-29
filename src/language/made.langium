grammar Made

import 'helpers'
import 'terminals'
import 'projects'
import 'backlog'
import 'processes'
import 'timebox'
import 'team'

entry Model:    
    (project=Project)
    (components+=(Team|Process|Backlog|TimeBox))*

;
