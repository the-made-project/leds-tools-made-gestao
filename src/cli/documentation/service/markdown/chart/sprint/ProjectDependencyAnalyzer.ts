
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

    constructor(sprint: TimeBox, allProjectIssues: Issue[]) {
        this.validateInputs(sprint, allProjectIssues);
        if (!allProjectIssues || allProjectIssues.length === 0) {
            throw new Error('Nenhuma issue do projeto fornecida');
        }
        if (!sprint) {
            throw new Error('Sprint não fornecido');
        }
        this.allIssues = new Map();
        this.sprintItems = new Map();
        this.graph = new Map();
        this.reversedGraph = new Map();
        this.issueStatus = new Map();

        this.initializeFromProject(allProjectIssues, sprint);
    }

    private parseDate(dateString: string): Date {
        // Tenta diferentes formatos de data
        let date: Date | null = null;

        // Remove qualquer caracter que não seja número ou separador
        const cleanDate = dateString.replace(/[^\d/-]/g, '');

        // Tenta formato yyyy-mm-dd ou yyyy/mm/dd
        if (cleanDate.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/)) {
            date = new Date(cleanDate);
        }
        // Tenta formato dd/mm/yyyy ou dd-mm-yyyy
        else if (cleanDate.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
            const [dia, mes, ano] = cleanDate.split(/[-/]/).map(Number);
            date = new Date(ano, mes - 1, dia);
        }

        if (!date || isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${dateString}. Use o formato dd/mm/yyyy ou yyyy-mm-dd`);
        }

        return date;
    }

    private validateInputs(sprint: TimeBox, allProjectIssues: Issue[]): void {
        if (!sprint.sprintItems) {
            throw new Error('Sprint não contém array de items');
        }

        if (!sprint.startDate || !sprint.endDate) {
            throw new Error('Sprint deve ter data de início e fim');
        }

        try {
            const startDate = this.parseDate(sprint.startDate);
            const endDate = this.parseDate(sprint.endDate);

            if (endDate < startDate) {
                throw new Error(`Data de fim (${sprint.endDate}) é anterior à data de início (${sprint.startDate})`);
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erro na validação de datas: ${error.message}`);
            }
            throw error;
        }

        sprint.sprintItems.forEach((item, index) => {
            if (!item.issue || !item.issue.id) {
                throw new Error(`Item do sprint na posição ${index} não tem issue ou ID válido`);
            }
            if (!item.assignee || !item.assignee.name) {
                throw new Error(`Issue ${item.issue.id} não tem responsável definido`);
            }
            if (!item.status) {
                throw new Error(`Issue ${item.issue.id} não tem status definido`);
            }
        });
    }


     private initializeFromProject(allIssues: Issue[], sprint: TimeBox): void {
        const projectIssues = allIssues.length > 0 ? allIssues : 
            sprint.sprintItems.map(item => item.issue);

        projectIssues.forEach(issue => {
            this.allIssues.set(issue.id, issue);
            this.graph.set(issue.id, new Set());
            this.reversedGraph.set(issue.id, new Set());
            this.issueStatus.set(issue.id, { 
                inSprint: false,
                status: issue.status || 'TODO',
                implemented: issue.status === 'DONE'
            });
        });

        sprint.sprintItems.forEach(item => {
            this.sprintItems.set(item.issue.id, item);
            this.allIssues.set(item.issue.id, item.issue);
            if (!this.graph.has(item.issue.id)) {
                this.graph.set(item.issue.id, new Set());
                this.reversedGraph.set(item.issue.id, new Set());
            }
            this.issueStatus.set(item.issue.id, {
                inSprint: true,
                status: item.status || 'TODO',
                assignee: item.assignee,
                implemented: item.status === 'DONE'
            });
        });

        this.allIssues.forEach((issue) => {
            if (issue.depends) {
                issue.depends.forEach(dep => {
                    if (!this.allIssues.has(dep.id)) {
                        console.warn(`Dependência não encontrada: ${dep.id}. Adicionando como nova issue.`);
                        this.allIssues.set(dep.id, dep);
                        this.graph.set(dep.id, new Set());
                        this.reversedGraph.set(dep.id, new Set());
                        this.issueStatus.set(dep.id, {
                            inSprint: false,
                            status: 'TODO',
                            implemented: false
                        });
                    }
                    this.graph.get(issue.id)?.add(dep.id);
                    this.reversedGraph.get(dep.id)?.add(issue.id);
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

    private getTopologicalSort(): string[] {
        const inDegree = new Map<string, number>();
        const result: string[] = [];
        const queue: string[] = [];

        // Calcular graus de entrada
        this.allIssues.forEach((_, id) => {
            inDegree.set(id, 0);
        });

        this.graph.forEach((deps) => {
            deps.forEach(dep => {
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
            });
        });

        // Encontrar nós sem dependências
        inDegree.forEach((degree, id) => {
            if (degree === 0) {
                queue.push(id);
            }
        });

        // Processar fila
        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);

            const dependencies = this.graph.get(current) || new Set();
            dependencies.forEach(dep => {
                const newDegree = (inDegree.get(dep) || 0) - 1;
                inDegree.set(dep, newDegree);
                if (newDegree === 0) {
                    queue.push(dep);
                }
            });
        }

        // Retornar apenas issues relevantes para o sprint atual
        return result.filter(id => {
            const isInSprint = this.sprintItems.has(id);
            const isDependencyOfSprintItem = Array.from(this.sprintItems.keys()).some(sprintId => 
                this.hasPath(sprintId, id)
            );
            return isInSprint || isDependencyOfSprintItem;
        });
    }

    private hasPath(from: string, to: string, visited = new Set<string>()): boolean {
        if (from === to) return true;
        if (visited.has(from)) return false;

        visited.add(from);
        const deps = this.graph.get(from) || new Set();
        
        for (const dep of deps) {
            if (this.hasPath(dep, to, visited)) return true;
        }

        return false;
    }

    private generateMermaidDiagram(): string {
        let diagram = 'graph TD\n';
        
        // Definir estilos
        diagram += '    classDef sprint fill:#a8e6cf,stroke:#333,stroke-width:2px;\n';
        diagram += '    classDef external fill:#ffd3b6,stroke:#333,stroke-width:2px;\n';
        diagram += '    classDef pending fill:#ff8b94,stroke:#333,stroke-width:2px;\n';
        diagram += '    classDef done fill:#98fb98,stroke:#333,stroke-width:2px;\n';
        
        // Adicionar nós
        const relevantIds = new Set(this.getTopologicalSort());
        relevantIds.forEach(id => {
            const issue = this.allIssues.get(id)!;
            const status = this.issueStatus.get(id)!;
            
            let nodeClass;
            if (status.implemented) {
                nodeClass = 'done';
            } else if (status.inSprint) {
                nodeClass = 'sprint';
            } else {
                nodeClass = status.status === 'TODO' ? 'pending' : 'external';
            }
            
            const statusText = status.implemented ? 'DONE' : status.status;
            const assigneeText = status.assignee ? `Resp: ${status.assignee.name}` : '';
            
            const label = `${id}["${id}\\n${issue.title || ''}\\n${statusText}\\n${assigneeText}"]`;
            diagram += `    ${label}:::${nodeClass}\n`;
        });

        // Adicionar arestas
        relevantIds.forEach(from => {
            const deps = this.graph.get(from) || new Set();
            deps.forEach(to => {
                if (relevantIds.has(to)) {
                    const isImplemented = this.issueStatus.get(to)?.implemented;
                    const style = isImplemented ? 
                        '==>' : 
                        (this.issueStatus.get(to)?.inSprint ? '-->' : '-.->');
                    diagram += `    ${from} ${style} ${to}\n`;
                }
            });
        });

        return diagram;
    }

    public generateAnalysis(): string {
        if (this.allIssues.size === 0) {
            return '# Análise de Dependências\n\nNenhuma issue encontrada para análise.';
        }
        const cycles = this.findCycles();
        let markdown = '# Análise de Dependências do Projeto e Sprint\n\n';

        markdown += `Análise gerada em: ${new Date().toLocaleString('pt-BR')}\n\n`;

        // Status Summary
        const statusCount = new Map<string, number>();
        this.issueStatus.forEach(status => {
            const key = status.implemented ? 'DONE' : status.status;
            statusCount.set(key, (statusCount.get(key) || 0) + 1);
        });

        markdown += '## 📊 Resumo por Status\n\n';
        markdown += '| Status | Quantidade |\n';
        markdown += '|--------|------------|\n';
        statusCount.forEach((count, status) => {
            markdown += `| ${status} | ${count} |\n`;
        });
        markdown += '\n';

        // Mermaid diagram
        markdown += '## 🔍 Grafo de Dependências\n\n';
        markdown += '```mermaid\n';
        markdown += this.generateMermaidDiagram();
        markdown += '```\n\n';

        markdown += '**Legenda:**\n';
        markdown += '- 🟢 Verde Escuro: Issues concluídas (DONE)\n';
        markdown += '- 🟢 Verde Claro: Issues no sprint atual\n';
        markdown += '- 🟡 Laranja: Issues no projeto, fora do sprint\n';
        markdown += '- 🔴 Vermelho: Issues pendentes\n';
        markdown += '- ➡️ Linha dupla: Dependência implementada\n';
        markdown += '- ➡️ Linha sólida: Dependência no sprint\n';
        markdown += '- ➡️ Linha pontilhada: Dependência externa\n\n';

        // Ciclos
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
        markdown += '## 📋 Análise de Issues\n\n';
        markdown += '| Issue | Título | Status | Localização | Responsável | # Deps | # Bloqueada por | Dependências | Dependentes |\n';
        markdown += '|-------|--------|--------|-------------|-------------|--------|-----------------|--------------|-------------|\n';

        this.getTopologicalSort().forEach(id => {
            const issue = this.allIssues.get(id)!;
            const status = this.issueStatus.get(id)!;
            const dependencies = this.graph.get(id)!;
            const dependents = this.reversedGraph.get(id)!;

            const location = status.implemented ? '✅ Concluída' :
                           (status.inSprint ? '🟢 Sprint' : '⚠️ Fora do Sprint');

            const pendingDeps = Array.from(dependencies).filter(depId => 
                !this.issueStatus.get(depId)?.implemented
            ).length;

            const dependenciesStr = Array.from(dependencies).map(depId => {
                const depStatus = this.issueStatus.get(depId)!;
                return `${depId}${depStatus.implemented ? '✅' : depStatus.inSprint ? '🟢' : '⚠️'}`;
            }).join(', ') || '-';

            const dependentsStr = Array.from(dependents).map(depId => {
                const depStatus = this.issueStatus.get(depId)!;
                return `${depId}${depStatus.implemented ? '✅' : depStatus.inSprint ? '🟢' : '⚠️'}`;
            }).join(', ') || '-';

            markdown += `| ${id} | ${issue.title || 'N/A'} | ${status.status} | ${location} | ${status.assignee?.name || 'N/A'} | ${dependencies.size} | ${pendingDeps} | ${dependenciesStr} | ${dependentsStr} |\n`;
        });

        return markdown;
    }
}