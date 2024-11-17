import * as fs from 'fs';
import * as path from 'path';
import { TimeBoxDTO } from '../../../../project_management_integration/dto/models.js';

export class ThroughputGenerator {
  private data: TimeBoxDTO;
  private readonly outputPath: string;

  constructor(sprintData: TimeBoxDTO, outputPath: string = './throughput.svg') {
    this.data = sprintData;
    this.outputPath = outputPath;
  }

  private processData() {
    const formatDate = (date: Date) => {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${dia}/${mes}`;
    };

    const startDate = new Date(this.data.startDate);
    const endDate = new Date(this.data.endDate);
    const days = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekDay = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
      const formattedDate = formatDate(currentDate);
      const issuesUntilDay = this.data.tasks.filter(issue => 
        new Date(issue.startDate ?? "") <= currentDate
      );

      days.push({
        day: `${weekDay} ${formattedDate}`,
        todo: issuesUntilDay.filter(issue => issue.status === "A Fazer").length,
        inProgress: issuesUntilDay.filter(issue => issue.status === "Em Andamento").length,
        done: issuesUntilDay.filter(issue => issue.status === "Concluído").length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private generateSVG(): string {
    const width = 1200;
    const height = 600;
    const margin = { top: 50, right: 150, bottom: 100, left: 70 };
    const colors = {
      todo: '#ef4444',
      inProgress: '#f59e0b',
      done: '#22c55e',
      grid: '#e5e7eb',
      text: '#000000',
      lightText: '#666666'
    };

    const dailyData = this.processData();
    const totalIssues = this.data.tasks.length;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const barWidth = (chartWidth / dailyData.length) * 0.8;
    const barSpacing = (chartWidth / dailyData.length) * 0.2;

    let svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <style>
            text { font-family: Arial, sans-serif; }
            .title { font-size: 24px; font-weight: bold; }
            .label { font-size: 14px; }
            .value { font-size: 12px; fill: ${colors.lightText}; }
            .axis { font-size: 12px; }
            .legend { font-size: 14px; }
          </style>
        </defs>
        
        <!-- Fundo -->
        <rect width="${width}" height="${height}" fill="white"/>
        
        <!-- Grid Horizontal -->
        ${Array.from({ length: 11 }, (_, i) => {
          const y = margin.top + (i * (chartHeight / 10));
          return `
            <line 
              x1="${margin.left}" 
              y1="${y}" 
              x2="${width - margin.right}" 
              y2="${y}" 
              stroke="${colors.grid}" 
              stroke-dasharray="4"
            />
            <text 
              x="${margin.left - 10}" 
              y="${y}" 
              text-anchor="end" 
              class="axis" 
              dominant-baseline="middle"
            >${Math.round(totalIssues - (i * (totalIssues / 10)))}</text>
          `;
        }).join('')}
        
        <!-- Eixos -->
        <line 
          x1="${margin.left}" 
          y1="${margin.top}" 
          x2="${margin.left}" 
          y2="${height - margin.bottom}" 
          stroke="black" 
          stroke-width="2"
        />
        <line 
          x1="${margin.left}" 
          y1="${height - margin.bottom}" 
          x2="${width - margin.right}" 
          y2="${height - margin.bottom}" 
          stroke="black" 
          stroke-width="2"
        />
        
        <!-- Label Eixo Y -->
        <text 
          transform="rotate(-90 ${margin.left - 40} ${height/2})" 
          x="${margin.left - 40}" 
          y="${height/2}" 
          text-anchor="middle" 
          class="label"
        >Número de Tarefas</text>
        
        <!-- Label Eixo X -->
        <text 
          x="${width/2}" 
          y="${height - 20}" 
          text-anchor="middle" 
          class="label"
        >Dias da Sprint</text>
        
        <!-- Barras e Labels -->
        ${dailyData.map((day, i) => {
          const x = margin.left + (i * (chartWidth / dailyData.length)) + barSpacing/2;
          const barHeight = chartHeight / totalIssues;
          
          const todoHeight = day.todo * barHeight;
          const inProgressHeight = day.inProgress * barHeight;
          const doneHeight = day.done * barHeight;
          
          return `
            <g>
              <!-- A Fazer -->
              <rect 
                x="${x}" 
                y="${height - margin.bottom - todoHeight}" 
                width="${barWidth}" 
                height="${todoHeight}" 
                fill="${colors.todo}"
                rx="4"
              />
              
              <!-- Em Progresso -->
              <rect 
                x="${x}" 
                y="${height - margin.bottom - todoHeight - inProgressHeight}" 
                width="${barWidth}" 
                height="${inProgressHeight}" 
                fill="${colors.inProgress}"
                rx="4"
              />
              
              <!-- Concluído -->
              <rect 
                x="${x}" 
                y="${height - margin.bottom - todoHeight - inProgressHeight - doneHeight}" 
                width="${barWidth}" 
                height="${doneHeight}" 
                fill="${colors.done}"
                rx="4"
              />
              
              <!-- Label do Dia -->
              <text 
                transform="rotate(-45 ${x + barWidth/2} ${height - margin.bottom + 20})" 
                x="${x + barWidth/2}" 
                y="${height - margin.bottom + 20}" 
                text-anchor="end" 
                class="axis"
              >${day.day}</text>
              
              <!-- Valores -->
              ${day.todo > 0 ? `
                <text 
                  x="${x + barWidth/2}" 
                  y="${height - margin.bottom - todoHeight/2}" 
                  text-anchor="middle" 
                  class="value"
                >${day.todo}</text>
              ` : ''}
              
              ${day.inProgress > 0 ? `
                <text 
                  x="${x + barWidth/2}" 
                  y="${height - margin.bottom - todoHeight - inProgressHeight/2}" 
                  text-anchor="middle" 
                  class="value"
                >${day.inProgress}</text>
              ` : ''}
              
              ${day.done > 0 ? `
                <text 
                  x="${x + barWidth/2}" 
                  y="${height - margin.bottom - todoHeight - inProgressHeight - doneHeight/2}" 
                  text-anchor="middle" 
                  class="value"
                >${day.done}</text>
              ` : ''}
            </g>
          `;
        }).join('')}
        
        <!-- Título -->
        <text 
          x="${width/2}" 
          y="30" 
          text-anchor="middle" 
          class="title"
        >${this.data.name} - Throughput</text>
        
        <!-- Legenda -->
        <g transform="translate(${width - margin.right + 20}, ${margin.top})">
          <rect width="15" height="15" fill="${colors.todo}" rx="2"/>
          <text x="25" y="12" class="legend">A Fazer</text>
          
          <rect y="25" width="15" height="15" fill="${colors.inProgress}" rx="2"/>
          <text x="25" y="37" class="legend">Em Progresso</text>
          
          <rect y="50" width="15" height="15" fill="${colors.done}" rx="2"/>
          <text x="25" y="62" class="legend">Concluído</text>
          
          <text x="0" y="90" class="value">
            Período: ${new Date(this.data.startDate).toLocaleDateString('pt-BR')} - 
            ${new Date(this.data.endDate).toLocaleDateString('pt-BR')}
          </text>
          <text x="0" y="110" class="value">
            Total de Issues: ${totalIssues}
          </text>
        </g>
      </svg>
    `;

    return svg;
  }

  public generate(): void {
    const svg = this.generateSVG();
    fs.writeFileSync(this.outputPath, svg);
    console.log(`Gráfico SVG gerado em: ${path.resolve(this.outputPath)}`);
  }
}
