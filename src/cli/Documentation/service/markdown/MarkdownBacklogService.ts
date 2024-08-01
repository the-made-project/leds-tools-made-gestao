import { Model, Team, isTimeBox, TimeBox, isBacklog, isTeam , Backlog,Epic, AtomicUserStory, TaskBacklog, PlanningItem, PerfomedItem} from "../../../../language/generated/ast.js"
import fs from "fs";
import { createPath} from '../../../generator-utils.js'
import path from 'path'
import { Graph } from "../../../graph/graph.js";
import * as vscode from 'vscode';
import { expandToStringWithNL } from "langium/generate";

interface Dependency {
    from: string;
    to: string;
}

interface Node {
    node:string;
    description:string;
}


export class MarkdownBacklogService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    BACKLOG_PATH :string
    TEAM_PATH :string
    ANALYSIS_PATH :string

    teams:  Team[]
    backlogs: Backlog[]
    timeBoxes: TimeBox[]

    
    constructor (model: Model, target_folder:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'Timeboxes')
        this.BACKLOG_PATH = createPath(this.MANAGEMENT_PATH,'Backlogs')
        this.TEAM_PATH = createPath(this.MANAGEMENT_PATH,'Teams')
        this.ANALYSIS_PATH = createPath(this.MANAGEMENT_PATH,'DependencyAnalysis')

        this.teams = this.model.components.filter(isTeam)
        
        this.backlogs = this.model.components.filter(isBacklog)
        
        this.timeBoxes = this.model.components.filter(isTimeBox)
    }

    private showLoadingMessage() {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating Planning Orizuru...",
            cancellable: false
        }, async (progress, token) => {
            // Simule um atraso de 2 segundos (você pode substituir isso com sua lógica de carregamento real)
            await new Promise(resolve => setTimeout(resolve, 2000));
            return Promise.resolve();
        });
    }

    public async create(){

        // fs.writeFileSync(path.join(this.MANAGEMENT_PATH, "/README.md"), this.createManagementDocument())
        this.teams.map(team =>fs.writeFileSync(path.join(this.TEAM_PATH, `/${team.id}.md`), this.createTeamExport(team)))
        this.backlogs.map(backlog =>fs.writeFileSync(path.join(this.BACKLOG_PATH, `/${backlog.id}.md`), this.createBacklogExport(backlog)))
        this.timeBoxes.map(timebox =>fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/${timebox.id}.md`), this.createTimeBoxExport(timebox)))
       
        this.showLoadingMessage()
       
        //fs.writeFileSync(path.join(this.MANAGEMENT_PATH, "/planningoverview.md"), this.createProjectDSM())
        fs.writeFileSync(path.join(this.ANALYSIS_PATH, "/Dependency Analysis.md"), this.createProjectDSM())
       
        vscode.window.showInformationMessage('Planning Orizuri created!');

    }

    public createBacklogDependences (backlog: Backlog): Dependency[]{
       var dependencies: Dependency[] = []
       backlog.userstories.map(userstory=> dependencies.push(...this.createDependencies(userstory)))

       return dependencies
    }

    private createDependencies (item: Epic|AtomicUserStory|TaskBacklog): Dependency[]{
        var dependencies: Dependency[] = []

        if (item.depend){
            dependencies.push({from: item.id.toUpperCase(), to:item.depend.ref?.id.toUpperCase() ?? ""})

            if (item.depends){
                item.depends.map(itemDepended => dependencies.push({from: item.id.toUpperCase(), to:itemDepended.ref?.id.toUpperCase() ?? ""}))
            }
        }
        return dependencies
        
    }

    //Criando um documento Geral de Planejamento 
    private createProjectDSM():string{
        var nodes: Node[] = [];
        var dependencies: Dependency[] = []
        
        //1. Criar a relação entre os elementos do backlog (projeto por completo)
        //2. Criar o DSM por sprint e a execução por sprint (por spint para ajudar os meninos a verem a sequencia)
        //3. Ao adicionar um novo item verificar o impacto no planejamento do projeto
        //4. Relacionar o requisito dos projetos com os critérios de aceitação e entregáveis
        this.backlogs.map(backlog => dependencies.push(...this.createBacklogDependences(backlog)));
        
        this.backlogs.map(backlog => backlog.userstories.map(us=> nodes.push({node:us.id.toUpperCase(), description: us.name ?? ""})))

        return this.createDSM(dependencies,nodes);
    }

    private createAnalysis(dependencies: Dependency[],nodes: Node[]): {containsCycle:string, topologicalSort:string, table: string}{
        const graph = new Graph();
        
        nodes.forEach (item => {
            graph.addVertex(item.node,item.description);
        })

        dependencies.forEach(item =>{
            graph.addEdge(item.from,item.to);
        }); 

        const containsCycle: string = graph.containsCycle() ?? ""
        const topologicalSort = graph.generateMermaidDiagram()
        const table = graph.generateMarkdownTable()

        return {containsCycle,topologicalSort,table}
    }

    private createDSM(dependencies: Dependency[],nodes: Node[]): string{
       
        const {containsCycle, topologicalSort, table} = this.createAnalysis(dependencies,nodes)
        
        return expandToStringWithNL`
        
        # Tasks and Dependencies


        ## Item Order

        Here is the order of item in the topological sort:
        
        ${table}

        ## Cycle Identification

        If there are cycles in the graph, they will be identified below:
        
        \`\`\`mermaid
        ${containsCycle == null? "No Cycle": containsCycle}
        \`\`\`

        ## Tasks Graph
        
        \`\`\`mermaid
        ${topologicalSort}
        \`\`\`
        `
        

    }

    // private createManagementDocument():string{
    //     return expandToStringWithNL`
    //     # Management
    //     1. [Equipes](#equipes)
    //     2. [Backlogs](#backlogs)
    //     3. [TimeBoxes](#timeboxes)

    //     ${this.createBody()}
    //     `
    // }

    // private createBody():string{

    //     return expandToStringWithNL`
    //     # Equipes <a name="equipes"></a>
    //     ${this.teams.map(team => `* [**${team.name ?? team.id}**: ${team.description ?? `-`}](#team${team.id})`).join("\n")}
    //     ${this.teams.map(team=>this.createTeam(team)).join("\n")}

    //     # Backlogs <a name="backlogs"></a>
    //     ${this.backlogs.map(backlog => `* [**${backlog.name ?? backlog.id}**: ${backlog.description ?? `-`}](#backlog${backlog.id})`).join("\n")}
    //     ${this.backlogs.map(backlog => this.createBacklog(backlog)).join("\n")}
        
    //     # TimeBoxes <a name="timeboxes"></a>
    //     ${this.timeBoxes.map(timeBox => `* [**${timeBox.name ?? timeBox.id}**: ${timeBox.description ?? `-`} (${timeBox.startDate} - ${timeBox.endDate})](#timeBox${timeBox.id})`).join("\n")} 
    //     ${this.timeBoxes.map(timeBox => this.createTimeBox(timeBox)).join("\n")}

        
    //     `
    // }

    private createTeamExport(team: Team):string{
        return expandToStringWithNL`
        # Equipes <a name="equipes"></a>
        ${this.createTeam(team)}`
    }

    private createBacklogExport(backlog: Backlog):string{
        return expandToStringWithNL`
        # Backlogs <a name="backlogs"></a>
        ${this.createBacklog(backlog)}`
    }

    private createTimeBoxExport(timeBox: TimeBox):string {
        return expandToStringWithNL`
        # TimeBoxes <a name="timeboxes"></a>
        ${this.createTimeBox(timeBox)}`
    }

    private createBacklog(backlog: Backlog):string {

        return expandToStringWithNL`
        ## <a name="backlog${backlog.id}"></a>${backlog.name ?? backlog.id} 
        
        ${backlog.description}

        |ID   |Item  | Description | 
        |:---:|:-----| :--------:  |
        ${backlog.userstories.map(backlogItem => this.createBacklogItem(backlogItem)).join("")}        
        `
    }

    private createTimeBox(timeBox:TimeBox):string {

        var nodes: Node[] = [];
        var dependencies: Dependency[] = []
        //criar o nodes
        timeBox.planning?.planningItems.map(planning => nodes.push({node:planning.item?.ref?.id.toUpperCase() ?? "", description: planning.item?.ref?.name ?? ""}))
        // criar as dependencias
        timeBox.planning?.planningItems.forEach(planning => {
            const itemRef = planning.item?.ref;
            if (itemRef) {
                dependencies.push(...this.createDependencies(itemRef));
            }
        });        
                
        const {containsCycle, topologicalSort, table} = this.createAnalysis(dependencies,nodes)
        
        return expandToStringWithNL`
        ## **${timeBox.name}**:  ${timeBox.startDate} - ${timeBox.endDate} <a name="timeBox${timeBox.id}"></a>
        ${timeBox.description}

        **Responsável:** ${timeBox.responsible?.ref?.name ?? `-`}
        
        ### Analise:

        #### Identificando Ciclos

       Caso existam ciclos no gráfico, eles serão identificados a seguir:

        \`\`\`mermaid
        ${containsCycle == null? "No Cycle": containsCycle}
        \`\`\`

        ### Planejado:

        |ID    |Nome |Resposável |Tempo Planejado | Complexidade |
        |:---- |:----|:--------  |:-------:       | :----------: |
        ${timeBox.planning?.planningItems.map(planning => this.createPlanningItem(planning)).join("")}
        

        ## Ordem de Execução

        Aqui está a ordem dos itens na classificação topológica:
        
        ${table}

        ## Grafo de Tarefas
        
        \`\`\`mermaid
        ${topologicalSort}
        \`\`\`



        ### Executado:

        |ID    |Nome |Tempo Executado | Complexidade | Status |
        |:---- |:----|:---------------| :----------: |:------:|
        ${timeBox.performed?.performedItems.map(performed => this.createPerfomedItem(performed)).join("")}
        
        ### Comentários:
        ${timeBox.comment ?? "Sem comentários"}
        `

    }

    private retriveNameFromPathString(pathString: string):string{
        var name = ""
        var path = pathString.split(".")  
        
        this.backlogs.forEach( 
            backlog => {
                backlog.userstories.map(userStory => {
                    if (userStory.id.toLowerCase() == path[0].toLowerCase()){
                        name = userStory.name ?? ""
                                                
                    }
                })
            }

        )

        return name
    }
    private createPlanningItem(planningItem: PlanningItem):string{

        const name = planningItem?.item?.ref?.name ?? this.retriveNameFromPathString(planningItem?.itemString ?? "") ?? "-"
        
        return expandToStringWithNL`        
        ${planningItem.item?.ref?.id.toLowerCase() ?? planningItem?.itemString?.toLowerCase()} |${name} |${planningItem.assigner?.ref?.id.toLowerCase() ?? planningItem?.assignerString?.toLowerCase()}| ${planningItem.planned ?? `-`} |${planningItem.complexity ?? `-`}|`
    }
   
    private createPerfomedItem(performedItem: PerfomedItem):string{
       
        const name = performedItem?.item?.ref?.name ?? this.retriveNameFromPathString(performedItem?.itemString ?? "") ?? "-"
        return expandToStringWithNL`        
        ${performedItem.item?.ref?.id.toLowerCase() ?? performedItem?.itemString?.toLowerCase()} |${name} |${performedItem.performed ?? `-`} |${performedItem.complexity ?? `-`}|${performedItem.status ?? `-`} |${performedItem.status ?? `-`}|`
    }

    private createBacklogItem(item: Epic|AtomicUserStory|TaskBacklog): string{
        var  description = item?.description ?? ""
        
        switch (item.$type){
            case Epic:
                description += (<Epic>item).process?.ref?.description ?? ""
                break;
            case AtomicUserStory:
                description += (<AtomicUserStory>item).activity?.ref?.description ?? ""
                break;
            case TaskBacklog:
                description += (<TaskBacklog>item).task?.ref?.description ?? ""

                break;

        }
       
        return expandToStringWithNL`
        |${item.id.toUpperCase()}|${item.name ?? `-`}|${description}|`
    }


    private createTeam(team:Team):string {
        return expandToStringWithNL`
        ## <a name="team${team.id}"></a>${team.name ?? team.id}        
        ${team.description}

        |ID    | Name      |E-mail    | 
        |:---- | :-------- |:------- |
        ${team.teammember.map(teammember=> `|${teammember.id}|${teammember.name}| ${teammember.email}|`).join("\n")} 
        `
    }

}