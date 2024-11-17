

export interface SprintTaskMC {
  issue: string;
  completedDate?: string;
  startDate: string;
  status: string;
}

export interface SprintDataMC {
  startDate: string;
  endDate: string;
  name: string;
  tasks: SprintTaskMC[];
}

export interface SimulationResult {
  tasksCompleted: number;
  frequency: number;
  probability: number;
  cumulativeProbability: number;
}

export interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  remainingDays: number;
  avgVelocity: number;
  currentVelocity: number;
}

interface CompletionDate {
  date: Date;
  tasksCompleted: number;
  probability: number;
  cumulativeProbability: number;
}

export class SprintMonteCarlo {
  private data: SprintDataMC;
  private readonly simulations: number;
  

  constructor(
    sprintData: SprintDataMC,
    simulations: number = 10000,
    
  ) {
    this.data = sprintData;
    this.simulations = simulations;
    
  }

  private calculateDailyVelocity(): number[] {
    const completedTasks = this.data.tasks.filter(task => task.completedDate);
    const velocities: number[] = [];
    
    if (completedTasks.length > 0) {
      const days = new Map<string, number>();
      
      completedTasks.forEach(task => {
        const date = task.completedDate!.split('T')[0];
        days.set(date, (days.get(date) || 0) + 1);
      });

      days.forEach(tasksCompleted => {
        velocities.push(tasksCompleted);
      });
    }

    return velocities.length > 0 ? velocities : [0];
  }

  private calculateRemainingWorkdays(): number {
    const today = new Date();
    const endDate = new Date(this.data.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private getSprintMetrics(): SprintMetrics {
    const totalTasks = this.data.tasks.length;
    const completedTasks = this.data.tasks.filter(t => t.status === "Concluído").length;
    const remainingTasks = totalTasks - completedTasks;
    const remainingDays = this.calculateRemainingWorkdays();
    const velocities = this.calculateDailyVelocity();
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / Math.max(velocities.length, 1);

    return {
      totalTasks,
      completedTasks,
      remainingTasks,
      remainingDays,
      avgVelocity,
      currentVelocity: velocities[velocities.length - 1] || 0
    };
  }

  private simulateCompletionDates(): CompletionDate[] {
    const velocities = this.calculateDailyVelocity();
    const metrics = this.getSprintMetrics();
    const completionDates: Date[] = [];

    for (let i = 0; i < this.simulations; i++) {
      let simulatedCompleted = metrics.completedTasks;
      let currentDate = new Date();
      let daysAdded = 0;

      while (simulatedCompleted < metrics.totalTasks) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dailyVelocity = velocities[Math.floor(Math.random() * velocities.length)];
          simulatedCompleted += dailyVelocity;
        }
        
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        daysAdded++;

        if (daysAdded > 30) break;
      }

      if (simulatedCompleted >= metrics.totalTasks) {
        completionDates.push(currentDate);
      }
    }

    const dateFrequencyMap = new Map<string, number>();
    completionDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      dateFrequencyMap.set(dateStr, (dateFrequencyMap.get(dateStr) || 0) + 1);
    });

    const results: CompletionDate[] = [];
    let cumulativeFrequency = 0;

    Array.from(dateFrequencyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateStr, frequency]) => {
        cumulativeFrequency += frequency;
        results.push({
          date: new Date(dateStr),
          tasksCompleted: metrics.totalTasks,
          probability: (frequency / this.simulations) * 100,
          cumulativeProbability: (cumulativeFrequency / this.simulations) * 100
        });
      });

    return results;
  }

  private runSimulation(): SimulationResult[] {
    const velocities = this.calculateDailyVelocity();
    const metrics = this.getSprintMetrics();
    const results: number[] = [];

    for (let i = 0; i < this.simulations; i++) {
      let simulatedCompleted = metrics.completedTasks;
      
      for (let day = 0; day < metrics.remainingDays; day++) {
        const dailyVelocity = velocities[Math.floor(Math.random() * velocities.length)];
        simulatedCompleted += dailyVelocity;
        
        if (simulatedCompleted >= metrics.totalTasks) {
          simulatedCompleted = metrics.totalTasks;
          break;
        }
      }
      
      results.push(simulatedCompleted);
    }

    const frequencyMap = new Map<number, number>();
    results.forEach(result => {
      frequencyMap.set(result, (frequencyMap.get(result) || 0) + 1);
    });

    const processedResults: SimulationResult[] = [];
    let cumulativeFrequency = 0;

    Array.from(frequencyMap.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([tasksCompleted, frequency]) => {
        cumulativeFrequency += frequency;
        processedResults.push({
          tasksCompleted,
          frequency,
          probability: (frequency / this.simulations) * 100,
          cumulativeProbability: (cumulativeFrequency / this.simulations) * 100
        });
      });

    return processedResults;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private getDateStatus(predictedDate: Date, plannedDate: Date): string {
    const diffDays = Math.round((predictedDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '✅ Antes do Prazo';
    if (diffDays === 0) return '✅ No Prazo';
    if (diffDays <= 2) return '⚠️ Pequeno Atraso';
    if (diffDays <= 5) return '⚠️ Atraso Moderado';
    return '❌ Atraso Crítico';
  }

  private getScenario(probability: number): string {
    if (probability <= 25) return '🟢 Otimista';
    if (probability <= 50) return '🟡 Moderado';
    if (probability <= 75) return '🟠 Conservador';
    if (probability <= 90) return '🔴 Pessimista';
    return '⚫ Muito Pessimista';
  }

  public generateMarkdownReport(): string {
    const completionDates = this.simulateCompletionDates();
    const metrics = this.getSprintMetrics();
    const results = this.runSimulation();

    let markdown = `# Relatório de Simulação Monte Carlo\n\n`;
    markdown += `## ${this.data.name}\n\n`;

    // Métricas Atuais
    markdown += `### 📊 Métricas Atuais\n\n`;
    markdown += `| Métrica | Valor |\n`;
    markdown += `|---------|-------|\n`;
    markdown += `| Total de Tarefas | ${metrics.totalTasks} |\n`;
    markdown += `| Tarefas Concluídas | ${metrics.completedTasks} |\n`;
    markdown += `| Tarefas Restantes | ${metrics.remainingTasks} |\n`;
    markdown += `| Dias Restantes | ${metrics.remainingDays} |\n`;
    markdown += `| Velocidade Média | ${metrics.avgVelocity.toFixed(1)} tarefas/dia |\n`;
    markdown += `| Data de Término Planejada | ${this.formatDate(new Date(this.data.endDate))} |\n\n`;

    // Status Atual
    markdown += `### 📈 Status Atual\n\n`;
    const tasksByStatus = {
      "A Fazer": this.data.tasks.filter(t => t.status === "A Fazer").length,
      "Em Andamento": this.data.tasks.filter(t => t.status === "Em Andamento").length,
      "Concluído": this.data.tasks.filter(t => t.status === "Concluído").length
    };

    markdown += `| Status | Quantidade |\n`;
    markdown += `|--------|------------|\n`;
    Object.entries(tasksByStatus).forEach(([status, count]) => {
      markdown += `| ${status} | ${count} |\n`;
    });
    markdown += `\n`;

    // Previsões
    markdown += `### 🎯 Previsões de Conclusão\n\n`;
    markdown += `| Data | Probabilidade | Prob. Acumulada | Status |\n`;
    markdown += `|------|---------------|-----------------|--------|\n`;
    
    completionDates.forEach(result => {
      markdown += `| ${this.formatDate(result.date)} | ${result.probability.toFixed(1)}% | ${result.cumulativeProbability.toFixed(1)}% | ${this.getDateStatus(result.date, new Date(this.data.endDate))} |\n`;
    });
    markdown += `\n`;

    // Cenários
    markdown += `### 🎲 Cenários de Probabilidade\n\n`;
    markdown += `| Tarefas Concluídas | Probabilidade | Cenário |\n`;
    markdown += `|-------------------|---------------|----------|\n`;
    
    results.forEach(result => {
      markdown += `| ${result.tasksCompleted} | ${result.cumulativeProbability.toFixed(1)}% | ${this.getScenario(result.cumulativeProbability)} |\n`;
    });
    markdown += `\n`;

    // Análise de Risco
    const plannedEndDate = new Date(this.data.endDate);
    const onTimeProb = completionDates.find(d => d.date > plannedEndDate)?.cumulativeProbability || 100;
    
    markdown += `### ⚠️ Análise de Risco\n\n`;
    markdown += `- Probabilidade de conclusão no prazo: **${onTimeProb.toFixed(1)}%**\n`;
    markdown += `- Velocidade necessária: **${(metrics.remainingTasks / metrics.remainingDays).toFixed(1)}** tarefas/dia\n`;
    markdown += `- Velocidade atual: **${metrics.currentVelocity.toFixed(1)}** tarefas/dia\n\n`;

    // Recomendações
    markdown += `### 💡 Recomendações\n\n`;
    if (onTimeProb >= 85) {
      markdown += `✅ **Sprint em bom progresso**\n`;
      markdown += `- Continue mantendo o ritmo atual\n`;
      markdown += `- Monitore possíveis impedimentos\n`;
    } else if (onTimeProb >= 50) {
      markdown += `⚠️ **Atenção necessária**\n`;
      markdown += `- Identifique possíveis gargalos\n`;
      markdown += `- Considere priorizar tarefas críticas\n`;
    } else {
      markdown += `❌ **Risco Alto de Atraso**\n`;
      markdown += `- Reavalie o escopo da sprint\n`;
      markdown += `- Considere remover tarefas não essenciais\n`;
      markdown += `- Identifique e remova impedimentos\n`;
    }

    return markdown
  }
}
