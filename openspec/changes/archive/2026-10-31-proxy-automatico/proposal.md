# Proposal

## Why

O fallback do Worker hoje depende de campos e de um botão nas Configurações, e pode também intermediar a reprodução. Isso torna a configuração técnica visível e amplia desnecessariamente o caminho de vídeo; o app deve resolver o acesso à playlist sozinho, sem comprometer a conexão direta do player.

## What Changes

- Remover da interface e do armazenamento do app as configurações editáveis do Worker.
- Carregar endpoint e token de `config.local.js`, ignorado pelo Git, com `config.example.js` versionado como modelo; sem configuração local, o app continua sem proxy.
- Automatizar o fallback de playlist e memorizar por servidor a última rota bem-sucedida; nesta mudança, uma rota conhecida tem prioridade nas cargas seguintes e, se falhar, a outra é tentada uma vez.
- Restringir o Worker ao download autenticado de playlists por GET; impedir que o vídeo, incluindo AVPlay, use o Worker.
- Criar `worker/` com implantação Cloudflare, limite de requisições, validação contra destinos internos e documentação em português, sem registrar URLs de playlists ou tokens.
- Manter `<access origin="*" subdomains="true"/>` no `config.xml`, mas não tratá-lo como bypass de CORS: ele declara acesso de rede do widget, enquanto a permissão de leitura cross-origin depende dos cabeçalhos CORS enviados pelo servidor remoto. A origem direta continua sendo testada primeiro e o Worker permanece como plano B.

## Capabilities

### New Capabilities

- `playlist-source-routing`: carregamento da playlist, configuração local opcional, seleção e memória de rota, mensagens de falha e separação da reprodução direta.
- `playlist-proxy`: proxy remoto autenticado e limitado, restrito a playlists e protegido contra acesso a redes internas.

### Modified Capabilities

Nenhuma. O inventário OpenSpec atual não contém especificações vigentes.

## Impact

- App: `index.html`, `scripts/media-source.js`, `scripts/media-library.js`, `scripts/settings.js`, `scripts/player-screen.js`, fixtures em `tests/`, `config.xml` e um novo `.gitignore`.
- Configuração local: novos `config.example.js` e `config.local.js` (este último não versionado); a ausência do arquivo local deve ser suportada.
- Worker: nova pasta `worker/` com código, configuração e instruções de publicação; a antiga implementação em `cloudflare-worker/` precisa deixar de ser a referência para evitar manter suporte de proxy de vídeo.
- Implantação: requisições GET autenticadas do app ao Worker e respostas CORS compatíveis com o app. O token distribuído no cliente pode ser extraído do pacote; ele não deve ser descrito como segredo irrecuperável nem como proteção para um serviço público multiusuário.
- Verificação: testes de fallback, rota lembrada, configuração ausente, ausência de proxy no player e controles de segurança/limite do Worker. Publicação e teste em TV permanecem externos.
