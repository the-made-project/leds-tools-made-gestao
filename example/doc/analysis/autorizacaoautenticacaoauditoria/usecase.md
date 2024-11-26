---
sidebar_position: 3
---
# Casos de Uso
## AUTORIZACAO: Gestão da autorização
Gerir a autorização de acesso ou manipulação de um recurso por um agente
### AUTORIZACAO.0: Criar Repositorio de Politicas

O Gestor de Politicas criar um repositório de politicas


### AUTORIZACAO.1: Criar Politicas

O Gestor de Politicas criar um  politica de autorização ao recurso para um agente ou papel.


### AUTORIZACAO.2: Aplicar Politicas

O Aplicador de Regras aplica uma politica quando requisitado, retornando se o agente está habilitado ou não para executar um evento em um recurso.


### AUTORIZACAO.3: Recuperar recurso

O Aplicador de Regras recupera um recurso, baseado em uma politica de autorização.


### AUTORIZACAO.4: Autorização por 2FA

O Aplicador de Regras permite que um usuário execute um evento no sistem usando 2FA e em uma politica de autorização.

## AUDITORIA: Auditoria de Eventos
Realiza auditoria dos eventos do sistema
### AUDITORIA.0: Registrar Evento

O auditor recebe um evento e registra.


### AUDITORIA.1: Consultar Evento

O Auditor informa sobre o evento registrado, baseado em uma consulta

## IDENTIFICACAO: Identificação de Agente
Realiza a identificação de um agente
### IDENTIFICACAO.0: Identificar o agente por meio do acesso cidadão

O Identificador por meio do acesso cidadão identifica um usuário.



    