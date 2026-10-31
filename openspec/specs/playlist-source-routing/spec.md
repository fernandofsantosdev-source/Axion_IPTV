# Playlist Source Routing Specification

## Purpose

Carrega playlists M3U com configuração local opcional e recuperação automática, mantendo o acesso direto como padrão e separado da reprodução de vídeo.

## Requirements

### Requirement: Proxy opcional por configuração local
O app SHALL obter o endpoint e o token do proxy de uma configuração local ignorada pelo Git e SHALL continuar funcionando sem proxy quando essa configuração estiver ausente ou incompleta.

#### Scenario: Configuração local ausente
- **WHEN** o app inicia sem configuração local do proxy
- **THEN** as telas e a conexão direta com playlists continuam disponíveis sem exibir erro de configuração do proxy

#### Scenario: Configuração de exemplo
- **WHEN** o projeto fornece o modelo de configuração
- **THEN** ele contém somente valores fictícios e instruções para criar a configuração local, que não é versionada

### Requirement: Seleção automática e memória da rota da playlist
O app SHALL tentar a conexão direta quando não houver uma rota conhecida para o servidor, SHALL usar o último caminho bem-sucedido nas cargas seguintes e SHALL tentar a outra rota uma única vez se a rota escolhida falhar por rede, CORS ou bloqueio de acesso.

#### Scenario: Primeiro carregamento sem histórico
- **WHEN** uma playlist de um servidor ainda não conhecido é carregada
- **THEN** o app tenta diretamente primeiro e chama o proxy configurado uma vez somente se o acesso direto falhar por rede, CORS ou bloqueio

#### Scenario: Inicia pela rota conhecida
- **WHEN** uma playlist de um servidor com rota bem-sucedida memorizada é carregada novamente
- **THEN** o app inicia por essa rota e, se ela falhar, tenta a rota alternativa no máximo uma vez

#### Scenario: Memoriza sucesso por servidor
- **WHEN** uma rota carrega e analisa com sucesso uma playlist
- **THEN** o app registra localmente essa rota associada ao servidor, sem armazenar o token do proxy junto ao histórico

#### Scenario: Ambos os caminhos falham
- **WHEN** a rota escolhida e a única tentativa alternativa falham
- **THEN** o app apresenta uma única mensagem em linguagem simples, sem mostrar URL, token, detalhes internos ou erro bruto de rede

#### Scenario: Falha que não é de transporte
- **WHEN** a resposta é obtida, mas não contém uma playlist M3U válida
- **THEN** o app informa que a playlist não é válida e não repete o mesmo download pelo proxy

### Requirement: Reprodução de vídeo direta
O app SHALL reproduzir canais, filmes e episódios diretamente pela origem da mídia, sem solicitar tickets de vídeo nem encaminhar mídia pelo Worker.

#### Scenario: Reprodução de mídia
- **WHEN** o usuário inicia um vídeo carregado por uma playlist, na TV ou no navegador
- **THEN** AVPlay ou `<video>` recebe a URL original do item e nenhuma requisição de proxy de vídeo é feita

#### Scenario: Falha da origem de vídeo
- **WHEN** a reprodução direta falha
- **THEN** o app mostra o estado de reprodução já previsto e não tenta recuperar o vídeo pelo Worker
