import { Issue, SprintItem, TimeBox, Person } from '../../../../../model/models.js';

interface IssueStatus {
    inSprint: boolean;
    status: string;
    assignee?: Person;
    implemented: boolean;
}

export class ProjectDependencyAnalyzer {
    private allIssues: Map<string, Issue>;
    private sprintItems: Map<string, SprintItem>;
    private graph: Map<string, Set<string>>;
    private reversedGraph: Map<string, Set<string>>;
    private issueStatus: Map<string, IssueStatus>;

    constructor(sprint: TimeBox) {
        this.validateInputs(sprint);
        
        this.allIssues = new Map();
        this.sprintItems = new Map();
        this.graph = new Map();
        this.reversedGraph = new Map();
        this.issueStatus = new Map();

        this.initializeFromSprint(sprint);
    }

    private validateInputs(sprint: TimeBox): void {
        if (!sprint.sprintItems) {
            throw new Error('Sprint não contém array de items');
        }

        sprint.sprintItems.forEach((item, index) => {
            if (!item.issue || !item.issue.id) {
                throw new Error(`Item do sprint na posição ${index} não tem issue ou ID válido`);
            }
            if (!item.assignee || !item.assignee.name) {
                throw new Error(`Issue ${item.issue.id} não tem responsável definido`);
            }
        });
    }

    private initializeFromSprint(sprint: TimeBox): void {
        // Inicializa com todas as issues do sprint
        sprint.sprintItems.forEach(item => {
            const issue = item.issue;
            
            this.allIssues.set(issue.id, issue);
            this.sprintItems.set(issue.id, item);
            this.graph.set(issue.id, new Set());
            this.reversedGraph.set(issue.id, new Set());
            this.issueStatus.set(issue.id, {
                inSprint: true,
                status: item.status || 'TODO',
                assignee: item.assignee,
                implemented: item.status === 'DONE'
            });
        });

        // Adiciona apenas as dependências entre issues do sprint
        sprint.sprintItems.forEach(item => {
            const issue = item.issue;
            if (issue.depends && Array.isArray(issue.depends)) {
                issue.depends.forEach(dep => {
                    if (dep && dep.id && this.allIssues.has(dep.id)) {
                        this.graph.get(issue.id)?.add(dep.id);
                        this.reversedGraph.get(dep.id)?.add(issue.id);
                    }
                });
            }
        });
    }

    private findCycles(): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string, path: string[] = []): void => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const dependencies = this.graph.get(nodeId) || new Set();
            for (const depId of dependencies) {
                if (!visited.has(depId)) {
                    dfs(depId, [...path]);
                } else if (recursionStack.has(depId)) {
                    const cycleStartIndex = path.indexOf(depId);
                    cycles.push(path.slice(cycleStartIndex));
                }
            }

            recursionStack.delete(nodeId);
        };

        this.sprintItems.forEach((_, id) => {
            if (!visited.has(id)) {
                dfs(id);
            }
        });

        return cycles;
    }

    private generateMermaidDiagram(): string {
        let diagram = 'graph BT\n';  // Mudado para BT (bottom to top)
        
        // Definir estilos
        diagram += '    classDef sprint fill:#a8e6cf,stroke:#333,stroke-width:2px;\n';
        diagram += '    classDef done fill:#98fb98,stroke:#333,stroke-width:2px;\n';
        
        // Primeiro, identificar as camadas (níveis) de cada issue
        const levels = new Map<string, number>();
        
        // Função auxiliar para calcular o nível de uma issue
        const calculateLevel = (id: string, visited = new Set<string>()): number => {
            if (visited.has(id)) return 0;
            visited.add(id);
            
            const dependencies = this.graph.get(id) || new Set();
            if (dependencies.size === 0) return 0;
            
            let maxLevel = 0;
            dependencies.forEach(depId => {
                if (this.sprintItems.has(depId)) {
                    const depLevel = calculateLevel(depId, visited);
                    maxLevel = Math.max(maxLevel, depLevel);
                }
            });
            
            return maxLevel + 1;
        };

        // Calcular níveis para todas as issues do sprint
        this.sprintItems.forEach((_, id: string) => {
            const level = calculateLevel(id);
            levels.set(id, level);
        });

        // Agrupar issues por nível
        const issuesByLevel = new Map<number, string[]>();
        levels.forEach((level, id) => {
            if (!issuesByLevel.has(level)) {
                issuesByLevel.set(level, []);
            }
            issuesByLevel.get(level)?.push(id);
        });

        // Adicionar nós agrupados por nível (do topo para baixo)
        const maxLevel = Math.max(...Array.from(levels.values()));
        for (let level = maxLevel; level >= 0; level--) {  // Invertido o loop
            const issuesInLevel = issuesByLevel.get(level) || [];
            
            // Adicionar os nós deste nível
            issuesInLevel.forEach(id => {
                const item = this.sprintItems.get(id)!;
                const status = this.issueStatus.get(id)!;
                const nodeClass = status.implemented ? 'done' : 'sprint';
                
                // Monta o label com descrições claras
                const label = `${id}["🔍 Identificador: ${id}<br>` +
                             `📝 Tarefa: ${item.issue.title || 'Sem título'}<br>` +
                             `📊 Estado: ${status.status}<br>` +
                             `👤 Responsável: ${status.assignee?.name || 'N/A'}"]`;
                             
                diagram += `    ${label}:::${nodeClass}\n`;
            });
        }

        // Adicionar arestas
        this.sprintItems.forEach((_, from: string) => {
            const deps = this.graph.get(from) || new Set();
            deps.forEach(to => {
                if (this.sprintItems.has(to)) {
                    const isImplemented = this.issueStatus.get(to)?.implemented;
                    const style = isImplemented ? '==>' : '-->';
                    diagram += `    ${from} ${style} ${to}\n`;
                }
            });
        });

        return diagram;
    }

    public generateAnalysis(): string {
        if (this.sprintItems.size === 0) {
            return '# Análise de Dependências do Sprint\n\nNenhuma issue encontrada no sprint.';
        }

        let markdown = '# Análise de Dependências do Sprint\n\n';
        markdown += `Análise gerada em: ${new Date().toLocaleString('pt-BR')}\n\n`;

        // Status Summary
        const statusCount = new Map<string, number>();
        this.sprintItems.forEach(item => {
            const status = item.status || 'TODO';
            statusCount.set(status, (statusCount.get(status) || 0) + 1);
        });
       
        // Mermaid diagram
        markdown += '## 🔍 Grafo de Dependências\n\n';
        markdown += '```mermaid\n';
        markdown += this.generateMermaidDiagram();
        markdown += '```\n\n';

        markdown += '**Legenda:**\n';
        markdown += '- 🟢 Verde Claro: Issues no sprint\n';
        markdown += '- 🟢 Verde Escuro: Issues concluídas\n';
        markdown += '- ➡️ Linha dupla: Dependência implementada\n';
        markdown += '- ➡️ Linha sólida: Dependência no sprint\n\n';

        // Ciclos
        const cycles = this.findCycles();
        if (cycles.length > 0) {
            markdown += '## ⚠️ Ciclos de Dependência Detectados\n\n';
            cycles.forEach((cycle, index) => {
                markdown += `### Ciclo ${index + 1}\n`;
                markdown += cycle.map(id => {
                    const issue = this.allIssues.get(id)!;
                    return `${id} (${issue.title || 'Sem título'})`;
                }).join(' → ') + ` → ${cycle[0]}\n\n`;
            });
        }

        // Tabela de análise
        markdown += '## 📋 Sugestão de Execução das Issues\n\n';
        markdown += '| Issue | Título | Status | Responsável | Dependências |\n';
        markdown += '|-------|--------|--------|-------------|---------------|\n';

        this.sprintItems.forEach((item, id) => {
            const issue = item.issue;
            const dependencies = this.graph.get(id)!;
            
            const dependenciesStr = Array.from(dependencies)
                .filter(depId => this.sprintItems.has(depId))
                .map(depId => {
                    const depStatus = this.issueStatus.get(depId)!;
                    return `${depId}${depStatus.implemented ? '✅' : ''}`;
                }).join(', ') || '-';

            markdown += `| ${id} | ${issue.title || 'N/A'} | ${item.status || 'TODO'} | ${item.assignee.name} | ${dependenciesStr} |\n`;
        });

        return markdown;
    }
}