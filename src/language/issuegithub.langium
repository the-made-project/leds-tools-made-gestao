import 'helpers'

IssueGithub: 'issuegithub' id=ID '{'
    (GithubUserName | RepositoryName | IssueName | About | Title | Labels | Assignees | TokenGithub)*
'}'
;