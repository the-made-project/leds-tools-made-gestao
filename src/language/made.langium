grammar Made

import 'helpers'
import 'terminals'
import 'projects'
import 'backlog'
import 'processes'
import 'timebox'
import 'team'
import 'roadmap'

entry Model:    
    (project=Project)
    (components+=(Team|Process|Backlog|TimeBox|Roadmap))*

;
