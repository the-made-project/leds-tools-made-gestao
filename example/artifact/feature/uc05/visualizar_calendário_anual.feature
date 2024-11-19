Feature: Visualizar Calendário

Scenario Outline: Visualizar calendário com sucesso
    Given o sistema disponibiliza as opções de ano
    And o gerente GEPOF seleciona o ano <ano>
    When o sistema carrega os marcos para o ano selecionado
    Then o sistema deve apresentar os marcos M1, M2 e M3 para cada mês do ano selecionado

Examples:
    | ano |
    | 2022 |
    | 2023 |
    | 2024 |

Scenario Outline: Visualizar calendário com erro
    Given o sistema disponibiliza as opções de ano
    And o gerente GEPOF seleciona o ano <ano>
    When o sistema tenta carregar os marcos para o ano selecionado
    Then o sistema deve retornar uma mensagem de erro "<mensagem_erro>"

Examples:
    | ano  | mensagem_erro                   |
    | 2019 | Ano selecionado não disponível  |
    | 2018 | Ano selecionado não disponível  | 

Scenario Outline: Ano não selecionado
    Given o sistema disponibiliza as opções de ano
    When o gerente GEPOF não seleciona um ano
    Then o sistema deve retornar uma mensagem de erro "Por favor, selecione um ano para visualizar o calendário"

Example: {}