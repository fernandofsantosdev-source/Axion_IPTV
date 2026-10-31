# Proposal

## Why

O NEXORA ainda não tem uma base de aplicação nem navegação utilizável pelo controle remoto. Definir esses fundamentos antes das telas permite evoluir o app em etapas, mantendo compatibilidade com navegadores Tizen e foco previsível.

## What Changes

- Criar a estrutura inicial de uma aplicação web de página única, sem frameworks, preparada para resolução base de 1920×1080.
- Definir o contêiner e os pontos de integração para as telas futuras, sem implementar nesta mudança as telas de produto.
- Implementar navegação centralizada por direcionais, OK e Voltar, com foco sempre visível e determinístico.
- Manter suporte a teclado no navegador de computador para desenvolvimento e visualização.
- Estabelecer estilos base compatíveis com navegadores antigos de TV, evitando dependências de recursos modernos.

## Capabilities

### New Capabilities
- `app-shell`: Inicialização e estrutura comum da aplicação de página única, pronta para receber as telas do NEXORA.
- `remote-navigation`: Navegação por controle remoto e teclado, com foco visível, direcional, confirmação e retorno.

### Modified Capabilities

## Impact

- Novos arquivos HTML, CSS e JavaScript na raiz ou em diretórios estáticos do projeto.
- Nenhum framework, pacote, stream ou conteúdo real será adicionado.
- As telas Início, TV ao vivo, Filmes, Séries, Player e Configurações serão entregues em mudanças posteriores.
