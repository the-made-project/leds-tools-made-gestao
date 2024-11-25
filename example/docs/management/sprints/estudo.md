---
title: "ESTUDAR AUTORIZACAO"
sidebar_position: estudo
---
## Dados do Sprint
* **Goal**:  Realizar estudos sobre autorizacao
* **Data Início**: 20/11/2024
* **Data Fim**: 30/11/2024

## Sprint Backlog

|ID |Nome |Resposável |Data de Inicío | Data Planejada | Status|
|:----    |:----|:--------  |:-------:       | :----------:  | :---: |
|spike.epic1.story1.estudar|Estudar sobre OPA|João Marcos ||30/11/2024|TODO|
|spike.epic1.story1.apresentar|Apresentar o estudo OPA|João Marcos |20/11/2024|30/11/2024|DONE|
|spike.epic1.story2.apresentar|Apresentar o estudo OpenFGA|João Marcos |20/11/2024|30/11/2024|DOING|

# Análise de Dependências do Sprint

Análise gerada em: 25/11/2024, 10:01:31

## 🔍 Grafo de Dependências

```mermaid
graph BT
    classDef sprint fill:#a8e6cf,stroke:#333,stroke-width:2px;
    classDef done fill:#98fb98,stroke:#333,stroke-width:2px;
    classDef external fill:#ffd3b6,stroke:#333,stroke-width:1px;
    spike.epic1.story2.estudar["🔍 spike.epic1.story2.estudar<br>⚠️ Dependência Externa"]:::external
    spike.epic1.story1.estudar["🔍 Identificador: spike.epic1.story1.estudar<br>📝 Tarefa: Estudar sobre OPA<br>📊 Estado: TODO<br>👤 Responsável: João Marcos "]:::sprint
    spike.epic1.story1.apresentar["🔍 Identificador: spike.epic1.story1.apresentar<br>📝 Tarefa: Apresentar o estudo OPA<br>📊 Estado: DONE<br>👤 Responsável: João Marcos "]:::done
    spike.epic1.story2.apresentar["🔍 Identificador: spike.epic1.story2.apresentar<br>📝 Tarefa: Apresentar o estudo OpenFGA<br>📊 Estado: DOING<br>👤 Responsável: João Marcos "]:::sprint
    spike.epic1.story1.apresentar -.-> spike.epic1.story2.estudar
    spike.epic1.story1.apresentar --> spike.epic1.story1.estudar
    spike.epic1.story2.apresentar -.-> spike.epic1.story2.estudar
    spike.epic1.story2.apresentar --> spike.epic1.story1.estudar
```

**Legenda:**
- 🟢 Verde Claro: Issues no sprint
- 🟢 Verde Escuro: Issues concluídas
- 🟡 Laranja: Dependências externas ao sprint
- ➡️ Linha sólida: Dependência no sprint
- ➡️ Linha pontilhada: Dependência externa

## 📋 Sugestão de Execução das Issues

| # | Issue | Título | Status | Responsável | Dependências |
|---|-------|--------|--------|-------------|---------------|
| 1 | spike.epic1.story1.estudar | Estudar sobre OPA | TODO | João Marcos  | 🆓 |
| 2 | spike.epic1.story1.apresentar | Apresentar o estudo OPA | DONE | João Marcos  | spike.epic1.story2.estudar⚠️, spike.epic1.story1.estudar |
| 3 | spike.epic1.story2.apresentar | Apresentar o estudo OpenFGA | DOING | João Marcos  | spike.epic1.story2.estudar⚠️, spike.epic1.story1.estudar |

**Legenda das Dependências:**
- 🆓 Sem dependências
- ✅ Issue concluída
- ⚠️ Dependência externa ao sprint



## Cumulative Flow
![ Cumulative Flow](./charts/cfd-estudo.svg)

# Previsão da Sprint

## ✅ SPRINT PROVAVELMENTE SERÁ CONCLUÍDA NO PRAZO

- **Probabilidade de conclusão no prazo**: 100.0%
- **Data mais provável de conclusão**: ter., 26/11/2024
- **Dias em relação ao planejado**: -3 dias
- **Status**: ✅ Antes do Prazo

### 📊 Métricas Críticas

| Métrica | Valor | Status |
|---------|--------|--------|
| Velocidade Atual | 1.0 tarefas/dia | ✅ |
| Velocidade Necessária | 0.4 tarefas/dia | - |
| Dias Restantes | 5 dias | - |
| Tarefas Restantes | 2 tarefas | - |

### 📅 Previsões de Data de Conclusão

| Data | Probabilidade | Status | Observação |
|------|---------------|---------|------------|
| ter., 26/11/2024 | 100.0% | ✅ Antes do Prazo | 📍 Data mais provável |

### 📋 Status das Tarefas

| Status | Quantidade | Porcentagem |
|--------|------------|-------------|
| Concluído | 1 | 33.3% |
| Em Andamento | 1 | 33.3% |
| A Fazer | 1 | 33.3% |

## 💡 Recomendações

1. ✅ Mantenha o ritmo atual de 1.0 tarefas/dia
2. ✅ Continue monitorando impedimentos
3. ✅ Prepare-se para a próxima sprint

## ℹ️ Informações da Sprint

- **Sprint**: Estudar Autorizacao
- **Início**: qua., 20/11/2024
- **Término Planejado**: sáb., 30/11/2024
- **Total de Tarefas**: 3
- **Simulações Realizadas**: 10,000

---
*Relatório gerado em 25/11/2024, 10:01:31*
