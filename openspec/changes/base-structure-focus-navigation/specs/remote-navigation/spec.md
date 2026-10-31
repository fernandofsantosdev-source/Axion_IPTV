# Spec Delta

## Purpose

Permitir que a interface do NEXORA seja operada inteiramente por controle remoto, com foco visível e comportamento consistente também durante o desenvolvimento no navegador.

## ADDED Requirements

### Requirement: Navegação direcional move o foco
A aplicação SHALL mover o foco entre controles disponíveis na direção indicada pelo usuário, de forma consistente e previsível.

#### Scenario: Movimento para um controle na direção escolhida
- **WHEN** o usuário pressiona uma tecla direcional e existe um controle disponível naquela direção
- **THEN** o foco passa para o controle apropriado nessa direção

#### Scenario: Não existe controle na direção escolhida
- **WHEN** o usuário pressiona uma tecla direcional e não existe controle disponível naquela direção
- **THEN** o foco permanece no controle atual

### Requirement: Foco atual permanece visível
A aplicação SHALL indicar visualmente qual controle está focado e SHALL manter essa indicação sincronizada com o controle que receberá a próxima confirmação.

#### Scenario: Foco muda de controle
- **WHEN** o foco passa de um controle para outro
- **THEN** o novo controle recebe o destaque visível e o controle anterior deixa de ser destacado

### Requirement: Confirmação ativa o controle focado
A aplicação SHALL ativar o controle atualmente focado quando o usuário enviar uma confirmação pelo botão OK ou pela tecla equivalente no navegador de desenvolvimento.

#### Scenario: Confirmação de um controle focado
- **WHEN** o usuário confirma enquanto um controle acionável está focado
- **THEN** a ação desse controle é executada uma única vez

### Requirement: Voltar retorna à tela anterior
A aplicação SHALL encaminhar o comando Voltar do controle remoto ou a tecla equivalente do navegador para a navegação da aplicação, permitindo retornar à tela anterior.

#### Scenario: Voltar a partir de uma tela secundária
- **WHEN** o usuário envia o comando Voltar enquanto uma tela secundária está ativa
- **THEN** a aplicação retorna à tela anterior

### Requirement: Foco é recuperado quando o controle atual deixa de estar disponível
A aplicação SHALL manter o foco em um controle disponível quando o controle focado for removido ou desabilitado.

#### Scenario: Controle focado fica indisponível
- **WHEN** o controle focado é removido ou desabilitado enquanto a tela permanece ativa
- **THEN** o foco passa para um controle disponível da tela ou fica sem seleção se nenhum existir
