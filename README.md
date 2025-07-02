![logo](images/icon.png)
# MADE
It is a plugin that empowers the Scrum Master and the development team to create the backlog and sprints based on processes that can be reused and standardized throughout the project and/or across different projects.

## Installation

### VS Code Extension
1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MADE - Leds - Beta"
4. Click **Install**

### CLI Tool (NPM)
```bash
# Install globally
npm install -g made-beta

# Or use locally
npx made-beta --help
```

### Manual Installation (VSIX)
1. Download the latest `.vsix` file from releases
2. Open Visual Studio Code
3. Right-click and select "Install Extension VSIX"

## Usage

### VS Code Extension
Right-click on your `.made` file and select:
- **"Generate Documentation"** - Creates markdown documentation
- **"Generate Github Issues"** - Pushes to GitHub Issues/Projects

### CLI Commands
```bash
# Generate documentation
made-cli generate project.made

# Push to GitHub (requires .env configuration)
made-cli github project.made

# Help
made-cli --help
```

### GitHub Integration Setup
Create a `.env` file in your project directory:
```env
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_organization
GITHUB_REPO=your_repository
```
![image with the right-click menu](images/right-click-menu.png)

## Components

### Project:
Define the project configuration and metadata.

```
project projectid {
    name: "project name"
    description: "project description" 
    startDate: 2024-01-30
    dueDate: 2024-12-30
    completedDate: 2024-11-15
}
```

### Team:
Define a team and its members.

```
team teamid {
    name: "team name"
    description: "team description"
    
    teammember memberid {
        name: "member name" 
        email: "member@email.com"
        discord: "discord-handle"
    }
}
```

### Sprint (TimeBox):
Define sprints with their planning items and assignees.

```
sprint sprintid {
    name: "Sprint name"
    description: "Sprint description"
    startDate: 2024-01-30
    endDate: 2024-02-13
    status: IN_PROGRESS
    comment: "First sprint comment"
    
    sprintbacklog backlogid {
        item backlogid.epicid.storyid.taskid {
            assignee: teamid.memberid
            dueDate: 2024-02-10
            startDate: 2024-01-30
            completedDate: 2024-02-08
            status: DONE
            complexity: MEDIUM
        }
    }
}
```

### Process: 
Define processes with their activities and tasks.

```
process processid {
    name: "process name"
    description: "process description"
    
    activity activityid {
        name: "activity name"
        description: "activity description"
        
        task taskid {
            name: "task name"
            description: "task description"
        }
    }
}
```

### Backlog:
Define backlogs with epics, stories, and tasks.

```
backlog backlogid {
    name: "backlog name"
    description: "backlog description"
    
    epic epicid {
        name: "Epic name"
        description: "Epic description"
        process: processid
        Criterions: "acceptance criteria 1", "criteria 2"
        observation: "epic notes"
        
        story storyid {
            name: "User story name"
            description: "Story description"
            activity: processid.activityid
            depends: backlogid.anotherstory
            Requirements: "requirement 1", "requirement 2"
            Criterions: "story criteria"
            observation: "story notes"
            
            task taskid {
                name: "Task name"
                description: "Task description"
                task: processid.activityid.taskid
                depends: backlogid.epicid.storyid.anothertask
                Deliverables: "deliverable 1", "deliverable 2"
            }
        }
    }
    
    story standalonstory {
        name: "Standalone story"
        description: "Story not inside epic"
        
        task storytask {
            name: "Story task"
        }
    }
}
```

### Roadmap:
Define roadmaps with milestones and releases.

```
roadmap roadmapid {
    name: "Roadmap name"
    description: "Roadmap description"
    
    milestone milestoneid {
        name: "Milestone name"
        description: "Milestone description"
        startDate: 2024-01-30
        dueDate: 2024-03-30
        completedDate: 2024-03-25
        status: COMPLETED
        depends: roadmapid.previousmilestone
        
        release releaseid {
            name: "Release name"
            description: "Release description"
            version: "1.0.0"
            dueDate: 2024-03-30
            releasedDate: 2024-03-25
            status: RELEASED
            item: backlogid.epicid
            itens: backlogid.story1, backlogid.story2
        }
    }
}
```