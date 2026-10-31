# Worker de playlists do AXION

Este Worker é um fallback opcional para baixar a playlist M3U. O AXION tenta a origem diretamente e só chama o Worker quando necessário. O Worker **não** transmite vídeos, segmentos ou chaves; AVPlay e `<video>` sempre recebem as URLs originais.

## Pré-requisitos

- Conta Cloudflare no plano Free.
- Node.js/npm e Wrangler executados localmente pelo responsável pela implantação.
- Um domínio Worker HTTPS e os hosts exatos do endpoint da playlist e de seus redirecionamentos.

Nenhuma conta, secret ou implantação foi criada nesta mudança. A publicação é manual e não é executada pelos testes.

## Configuração

1. Abra `worker/wrangler.toml`.
2. Em `ALLOWED_HOSTS`, informe apenas os hosts exatos que servem a playlist e os destinos de redirecionamento, separados por vírgula. Exemplo fictício: `playlist.exemplo.net,redirect.exemplo.net`. Não inclua protocolo, caminho, credenciais, curingas ou IPs. Não adicione hosts de mídia: o Worker não os acessa.
3. Em `APP_ORIGINS`, configure as origens exatas da interface separadas por vírgula. Para prévia local, use a origem realmente aberta, por exemplo `http://localhost:8000`. Um WebView Tizen pode enviar `Origin: null`; inclua `null` somente se esse valor for observado na TV. Não use `*`.
4. O binding `RATE_LIMITER` vem configurado para 30 chamadas por 60 segundos por chave/IP e por localidade da Cloudflare. `namespace_id` precisa ser um inteiro único na conta; use outro valor se já estiver em uso. Esse limite é aproximado, não é uma quota global rígida.

A allowlist permite que o Worker acesse qualquer caminho nos hosts que você autorizar. Mantenha-a pequena e use somente servidores públicos que você controla ou em que confia. O Worker rejeita IPs literais, loopback, hosts locais/internos e destinos fora da lista, e revalida cada redirecionamento.

## Instalar e publicar

No PowerShell, na pasta do projeto:

```powershell
cd worker
npx wrangler login
npx wrangler secret put AXION_PROXY_TOKEN
npx wrangler deploy
```

O comando `secret put` solicita o token no terminal. Use um valor aleatório longo; não o escreva no `wrangler.toml`, em argumentos de comando, mensagens, screenshots ou arquivos versionados. O token deve ter pelo menos 32 caracteres.

Após o deploy, anote a URL HTTPS `workers.dev` apresentada pelo Wrangler. No arquivo local ignorado pelo Git, copie `config.example.js` para `config.local.js` e preencha as propriedades:

```js
(function (global) {
  "use strict";
  global.AXION_CONFIG = {
    workerUrl: "https://SEU-WORKER.workers.dev",
    workerToken: "O_MESMO_TOKEN_CADASTRADO_NO_WRANGLER"
  };
}(window));
```

O `config.local.js` precisa estar presente no diretório incluído no pacote local do app Tizen; ele não é enviado pelo Git. Sem esse arquivo, o app opera normalmente apenas com acesso direto.

O token é incluído no cliente e pode ser extraído de um pacote Tizen. Ele não é um segredo protegido contra o usuário final. Restrinja os hosts e as origens, monitore o uso e não distribua essa configuração como um serviço público multiusuário. Troque o secret no Cloudflare e no arquivo local se houver suspeita de exposição.

## Protocolo e privacidade

- Única rota: `GET /playlist`.
- O token vai no cabeçalho `Authorization: Bearer ...`; a URL original da playlist vai no cabeçalho `X-Playlist-URL`, nunca na URL do Worker.
- A preflight CORS `OPTIONS` apenas devolve permissão para `GET` e não busca a origem. Métodos diferentes de GET/OPTIONS e rotas desconhecidas são recusados.
- As respostas são limitadas a 8 MiB. Há no máximo quatro redirecionamentos e cada destino é validado novamente.
- O código não registra cabeçalhos, URL, token, corpo da playlist nem erros crus da origem; respostas de erro são sanitizadas e marcadas `Cache-Control: no-store`.
- Não habilite ferramentas externas que capturem cabeçalhos/corpos de requisição nem compartilhe traces com os valores. A URL da playlist pode conter credenciais no query string, e o token é enviado no cabeçalho de autorização.
- Não há endpoint de streaming, ticket, HLS, `Range` ou qualquer encaminhamento de mídia.

## Limites do plano Free

Conforme as [limitações oficiais](https://developers.cloudflare.com/workers/platform/limits/), a [página de preços](https://developers.cloudflare.com/workers/platform/pricing/) e a [documentação do binding de rate limit](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) consultadas em 31/10/2026:

- Até **100.000 requisições Workers por dia por conta Free**, com reposição à meia-noite UTC; ao exceder, Cloudflare retorna **Error 1027**.
- Até **10 ms de CPU por invocação** no plano Free.
- Até **50 subrequests por invocação**. Um fetch da playlist e seus redirecionamentos consomem subrequests.
- Cada chamada ao Worker conta para o limite diário; uma preflight CORS é uma chamada separada. Isso não é uma cota de bytes, banda garantida ou streaming ilimitado. O Worker deste projeto só transporta playlists.
- O binding de rate limit usa contadores por localidade da Cloudflare; os contadores podem divergir e ultrapassar o limiar configurado. O limite de 30/minuto não é proteção global contra abuso. Clientes atrás do mesmo IP público também compartilham a chave.

Os limites mudam; confira os links oficiais antes de ativar. Se a quota diária acabar, o app continua podendo usar uma playlist que funcione diretamente, mas não haverá fallback pelo Worker até a reposição.

## Testes locais

Na raiz do projeto:

```powershell
node tests/worker.mjs
```

Os testes usam hosts fictícios e `fetch` simulado; não acessam provedores, não fazem login e não publicam serviços. Eles não substituem `wrangler dev`, deploy ou teste em TV Samsung.
