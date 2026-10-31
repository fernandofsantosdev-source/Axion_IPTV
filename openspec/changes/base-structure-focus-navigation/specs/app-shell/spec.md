# Spec Delta

## Purpose

Define a estrutura comum que inicializa o NEXORA e recebe suas telas futuras, oferecendo uma área de conteúdo consistente para TV e navegador de desenvolvimento.

## ADDED Requirements

### Requirement: Aplicação inicia em uma estrutura comum
A aplicação SHALL disponibilizar uma estrutura de página única para montar a tela ativa sem recarregar o documento.

#### Scenario: Inicialização da aplicação
- **WHEN** o usuário abre a aplicação
- **THEN** a estrutura comum é carregada e disponibiliza a área de conteúdo para a tela ativa

### Requirement: Conteúdo respeita a resolução de referência
A estrutura comum SHALL usar 1920×1080 como resolução de referência e manter o conteúdo principal dentro de margens seguras de 5% nessa resolução.

#### Scenario: Exibição na resolução de referência
- **WHEN** a aplicação é exibida em 1920×1080
- **THEN** a área principal permanece dentro das margens seguras de 5% em cada borda

### Requirement: Aplicação funciona em navegador de TV e de desenvolvimento
A aplicação SHALL permitir a exibição da interface em navegadores compatíveis com o ambiente Tizen alvo e em um navegador de computador para desenvolvimento.

#### Scenario: Abertura em navegador de computador
- **WHEN** a aplicação é aberta em um navegador de computador compatível
- **THEN** a estrutura comum é exibida sem exigir APIs exclusivas da TV
