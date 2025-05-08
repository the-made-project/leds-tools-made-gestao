grammar Made

import 'helpers'
import 'terminals'
import 'projects'
import 'backlog'
import 'processes'
import 'timebox'
import 'team'
import 'roadmap'
import 'issuegithub'

entry Model:
    (project=Project)
    (components+=(Team|Process|Backlog|TimeBox|Roadmap|IssueGithub))*

;