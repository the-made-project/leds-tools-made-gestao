import fs from 'fs';
import path from 'path';
import { AssigneeDTO, TimeBoxDTO } from '../../../../../project_management_integration/dto/models.js';

export class ProjectMetricsGenerator {
    private sprints: TimeBoxDTO[];
  
    constructor(sprints: TimeBoxDTO[]) {
      this.sprints = sprints;
    }
  
    private formatDate(date: string): string {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  
    private calculateDuration(startDate: string, endDate: string): number {
      return Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
    }
  
    private analyzeTaskStatus(tasks: AssigneeDTO[]) {
      return {
        completed: tasks.filter(task => task.status === "Concluído").length,
        inProgress: tasks.filter(task => 
          task.status !== "Concluído" && task.startDate
        ).length,
        pending: tasks.filter(task => 
          task.status !== "Concluído" && !task.startDate
        ).length
      };
    }
  
    private calculateVelocity(tasks: AssigneeDTO[], duration: number): number {
      const completedTasks = tasks.filter(task => task.status === "Concluído").length;
      return Number((completedTasks / duration).toFixed(2));
    }
  
    private generateThroughputSVG(): string {
      const width = 1000;
      const height = 500;
      const margin = { top: 50, right: 100, bottom: 80, left: 80 };
  
      const sprintData = this.sprints.map(sprint => {
        const status = this.analyzeTaskStatus(sprint.tasks);
        return {
          name: sprint.name,
          startDate: this.formatDate(sprint.startDate),
          ...status
        };
      });
  
      const maxTasks = Math.max(
        ...sprintData.map(d => d.completed + d.inProgress + d.pending)
      );
  
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <style>
            .title { font: bold 24px Arial; fill: #333; }
            .axis-label { font: 14px Arial; fill: #666; }
            .tick-label { font: 12px Arial; fill: #666; }
            .bar-completed { fill: #4CAF50; }
            .bar-in-progress { fill: #FFA726; }
            .bar-pending { fill: #EF5350; }
            .grid { stroke: #eee; stroke-width: 1; }
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#ffffff"/>
        
        <!-- Título -->
        <text x="${width/2}" y="30" class="title" text-anchor="middle">
          Throughput por Sprint
        </text>
        
        <!-- Eixo Y -->
        <line x1="${margin.left}" y1="${height-margin.bottom}" x2="${margin.left}" y2="${margin.top}" stroke="#666" stroke-width="2"/>
        
        ${this.generateYAxisElements(margin, height, maxTasks)}
        ${this.generateBars(sprintData, margin, height, maxTasks)}
        ${this.generateLegend(width, margin)}
        
        <!-- Label do eixo Y -->
        <text x="${margin.left - 60}" y="${height/2}" class="axis-label" text-anchor="middle" transform="rotate(-90 ${margin.left - 60} ${height/2})">
          Número de Tarefas
        </text>
      </svg>`;
    }
  
    private generateYAxisElements(margin: any, height: number, maxTasks: number): string {
      let elements = '';
      const yTicks = 5;
      
      for (let i = 0; i <= yTicks; i++) {
        const y = margin.top + ((height - margin.top - margin.bottom) * (yTicks - i) / yTicks);
        const value = Math.round((maxTasks * i / yTicks) * 100) / 100;
        
        elements += `
          <line x1="${margin.left}" y1="${y}" x2="${width-margin.right}" y2="${y}" class="grid"/>
          <text x="${margin.left - 10}" y="${y}" class="tick-label" text-anchor="end" dominant-baseline="middle">${value}</text>`;
      }
      
      return elements;
    }
  
    private generateBars(sprintData: any[], margin: any, height: number, maxTasks: number): string {
      let bars = '';
      const barWidth = 60;
      const barSpacing = 100;
      
      sprintData.forEach((sprint, index) => {
        const x = margin.left + (barSpacing * (index + 1));
        const yScale = (height - margin.top - margin.bottom) / (maxTasks || 1);
        
        // Barra de tarefas concluídas
        if (sprint.completed > 0) {
          const barHeight = sprint.completed * yScale;
          const y = height - margin.bottom - barHeight;
          bars += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" class="bar-completed"/>
            <text x="${x + barWidth/2}" y="${y + barHeight/2}" class="tick-label" text-anchor="middle" fill="white">${sprint.completed}</text>`;
        }
        
        // Barra de tarefas em progresso
        if (sprint.inProgress > 0) {
          const barHeight = sprint.inProgress * yScale;
          const y = height - margin.bottom - barHeight - (sprint.completed * yScale);
          bars += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" class="bar-in-progress"/>
            <text x="${x + barWidth/2}" y="${y + barHeight/2}" class="tick-label" text-anchor="middle" fill="white">${sprint.inProgress}</text>`;
        }
        
        // Labels
        bars += `
          <text x="${x + barWidth/2}" y="${height-margin.bottom + 20}" class="axis-label" text-anchor="middle">${sprint.name}</text>
          <text x="${x + barWidth/2}" y="${height-margin.bottom + 40}" class="tick-label" text-anchor="middle">${sprint.startDate}</text>`;
      });
      
      return bars;
    }
  
    private generateLegend(width: number, margin: any): string {
      const legendItems = [
        { class: 'bar-completed', label: 'Concluídas' },
        { class: 'bar-in-progress', label: 'Em Progresso' },
        { class: 'bar-pending', label: 'Pendentes' }
      ];
  
      let legend = '';
      legendItems.forEach((item, index) => {
        legend += `
          <rect x="${width-margin.right + 10}" y="${margin.top + (index * 25)}" width="20" height="20" class="${item.class}"/>
          <text x="${width-margin.right + 40}" y="${margin.top + (index * 25) + 15}" class="axis-label">${item.label}</text>`;
      });
      
      return legend;
    }
  
    private generateSummaryTable(): string {
      let markdown = '## Métricas Consolidadas\n\n';
      markdown += '| Sprint | Período | Duração | Total Tasks | Concluídas | Em Progresso | Pendentes | Velocidade | Eficiência |\n';
      markdown += '|--------|---------|----------|-------------|------------|--------------|-----------|------------|------------|\n';
  
      this.sprints.forEach(sprint => {
        const duration = this.calculateDuration(sprint.startDate, sprint.endDate);
        const status = this.analyzeTaskStatus(sprint.tasks);
        const velocity = this.calculateVelocity(sprint.tasks, duration);
        const efficiency = ((status.completed / sprint.tasks.length) * 100).toFixed(1);
  
        markdown += `| ${sprint.name} | ${this.formatDate(sprint.startDate)} - ${this.formatDate(sprint.endDate)} | ${duration} dias | ${sprint.tasks.length} | ${status.completed} (${efficiency}%) | ${status.inProgress} | ${status.pending} | ${velocity}/dia | ${efficiency}% |\n`;
      });
  
      return markdown;
    }
  
    private generateAnalysisSummary(): string {
      const totalSprints = this.sprints.length;
      const totalTasks = this.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0);
      const avgTasksPerSprint = (totalTasks / totalSprints).toFixed(1);
      
      const totalStatus = this.sprints.reduce((acc, sprint) => {
        const status = this.analyzeTaskStatus(sprint.tasks);
        return {
          completed: acc.completed + status.completed,
          inProgress: acc.inProgress + status.inProgress,
          pending: acc.pending + status.pending
        };
      }, { completed: 0, inProgress: 0, pending: 0 });
  
      const globalEfficiency = ((totalStatus.completed / totalTasks) * 100).toFixed(1);
  
      let markdown = '\n## Análise Geral\n\n';
      markdown += `- **Total de Sprints:** ${totalSprints}\n`;
      markdown += `- **Média de Tasks por Sprint:** ${avgTasksPerSprint}\n`;
      markdown += `- **Taxa de Conclusão Global:** ${globalEfficiency}%\n\n`;
  
      return markdown;
    }
  
    public generateCompleteSummary(): string {
      let markdown = '# Resumo das Sprints\n\n';
      
      // Adiciona o gráfico de throughput
      markdown += '## Throughput das Sprints\n\n';
      markdown += this.generateThroughputSVG() + '\n\n';
      
      // Adiciona a tabela de métricas
      markdown += this.generateSummaryTable() + '\n';
      
      // Adiciona a análise geral
      markdown += this.generateAnalysisSummary() + '\n';
      
      // Adiciona o gráfico de distribuição
      markdown += '## Distribuição de Tasks\n\n';
      markdown += '```mermaid\npie\n';
      markdown += '    title "Distribuição Total de Tasks"\n';
      const status = this.analyzeTaskStatus(this.sprints.flatMap(s => s.tasks));
      markdown += `    "Concluídas" : ${status.completed}\n`;
      markdown += `    "Em Progresso" : ${status.inProgress}\n`;
      markdown += `    "Pendentes" : ${status.pending}\n`;
      markdown += '```\n\n';
      
      // Adiciona notas e observações
      markdown += '### Notas\n';
      markdown += `- Período Total: ${this.formatDate(this.sprints[0].startDate)} - ${this.formatDate(this.sprints[this.sprints.length-1].endDate)}\n`;
      markdown += `- Média de Duração das Sprints: ${Math.round(this.sprints.reduce((acc, sprint) => 
        acc + this.calculateDuration(sprint.startDate, sprint.endDate), 0) / this.sprints.length)} dias\n`;
      markdown += `- Todas as métricas são baseadas nos dados disponíveis\n\n`;
      
      markdown += `*Última atualização: ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}*`;
  
      return markdown;
    }
  
    public async saveFiles(outputDir: string): Promise<void> {
      try {
        // Criar diretório se não existir
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
  
        // Salvar relatório completo
        const completeSummary = this.generateCompleteSummary();
        const summaryPath = path.join(outputDir, 'sprint-summary.md');
        await fs.promises.writeFile(summaryPath, completeSummary, 'utf-8');
        
        // Salvar SVG separadamente
        const svgContent = this.generateThroughputSVG();
        const svgPath = path.join(outputDir, 'throughput-chart.svg');
        await fs.promises.writeFile(svgPath, svgContent, 'utf-8');
  
        console.log(`Arquivos gerados com sucesso em: ${outputDir}`);
      } catch (error) {
        console.error('Erro ao salvar os arquivos:', error);
        throw error;
      }
    }
  }
  