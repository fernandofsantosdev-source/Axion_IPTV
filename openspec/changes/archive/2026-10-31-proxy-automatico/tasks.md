# Tasks

## 1. Configuração local e tela de Configurações

- [x] 1.1 Criar `config.example.js` com endpoint/token exclusivamente fictícios, adicionar `config.local.js` ao novo `.gitignore` e carregar a configuração local opcional antes dos módulos de mídia; verificar que o app abre sem esse arquivo e que `git check-ignore config.local.js` o ignora.
- [x] 1.2 Remover campos, botão e persistência de URL/token do Worker nas Configurações e no armazenamento local; atualizar `tests/settings.html` e verificar que a fixture não contém controles de proxy e ainda salva/carrega a playlist.

## 2. Roteamento da playlist e reprodução direta

- [x] 2.1 Implementar seleção de rota com primeiro acesso direto, rota bem-sucedida memorizada por origem do servidor, uma única tentativa alternativa para falhas de transporte/bloqueio e mensagem simples após falha dupla; ampliar `tests/media-source.html` e verificar ausência de repetição para M3U inválida.
- [x] 2.2 Remover a emissão e o uso de tickets de mídia, garantindo URLs originais no AVPlay e `<video>`; atualizar fixtures do player e verificar que falha de vídeo nunca chama o Worker.
- [x] 2.3 Atualizar documentação principal para explicar configuração local, CORS versus `<access>`, rota lembrada, limitação de token no cliente e reprodução sempre direta; verificar que as instruções não pedem configurar o Worker pela tela.

## 3. Worker remoto restrito a playlists

- [x] 3.1 Criar `worker/` com configuração Wrangler e endpoint GET autenticado, CORS preflight sem busca upstream, allowlist exata, bloqueio de hosts/IPs privados e internos, validação de redirects, limite de tamanho e rate limit; criar testes locais para métodos, autenticação, SSRF, redirecionamentos e cota.
- [x] 3.2 Garantir que o Worker não registra nem reflete URL/token, retorna erros sanitizados e não oferece rotas de mídia; executar os testes locais com valores fictícios e verificar por busca que não existem `console.log` nem endpoints de vídeo/ticket.
- [x] 3.3 Escrever instruções de publicação em português em `worker/README.md` e alinhar o README raiz; verificar que os passos explicam secrets, allowlist, limites, ausência de publicação automática e descontinuação da documentação incompatível em `cloudflare-worker/`.

## 4. Integração e validação

- [x] 4.1 Executar verificações de sintaxe e todas as fixtures de configuração, playlist, player e telas afetadas; confirmar que a configuração ausente mantém funcionamento direto e que somente a playlist pode usar o Worker.
- [x] 4.2 Executar os testes do Worker e `git diff --check`, conferir que nenhum segredo real ou URL real de playlist aparece nos arquivos versionados e deixar publicação e teste em TV explicitamente pendentes.

## Workflow follow-up

- Arquivar a mudança somente depois da revisão e de todas as tarefas rastreadas concluídas; fazer commit local ao arquivar, sem incluir token nem URL real de playlist na mensagem.
