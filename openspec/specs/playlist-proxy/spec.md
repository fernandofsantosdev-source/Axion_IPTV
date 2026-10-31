# Playlist Proxy Specification

## Purpose

Fornece um fallback remoto restrito para baixar playlists do usuário sem transformar o Worker em proxy genérico ou em caminho de reprodução.

## Requirements

### Requirement: Acesso autenticado somente para leitura de playlist
O Worker SHALL aceitar somente GET autenticado para obter uma playlist HTTP ou HTTPS e SHALL rejeitar outros métodos sem encaminhá-los ao destino.

#### Scenario: GET com token válido
- **WHEN** o cliente envia GET com token válido e um destino autorizado
- **THEN** o Worker obtém e devolve o conteúdo da playlist sem transcodificação

#### Scenario: Token ausente ou inválido
- **WHEN** o cliente envia GET sem token válido
- **THEN** o Worker responde com erro de autorização sem acessar o destino

#### Scenario: Método não permitido
- **WHEN** o Worker recebe um método diferente de GET, exceto uma preflight CORS necessária
- **THEN** rejeita a chamada sem buscar a playlist nem encaminhar a requisição

#### Scenario: Preflight CORS
- **WHEN** o navegador envia OPTIONS como preflight para a chamada GET autenticada
- **THEN** o Worker responde somente com os cabeçalhos CORS permitidos e não acessa o destino

### Requirement: Destinos externos autorizados
O Worker SHALL rejeitar endereços não HTTP(S), hosts ou endereços IP privados/internos e destinos fora da lista explícita de hosts autorizados; SHALL revalidar cada redirecionamento antes de acessá-lo.

#### Scenario: Destino privado ou interno
- **WHEN** o destino ou um redirecionamento aponta para loopback, rede privada, link-local, hostname local ou endereço interno
- **THEN** o Worker bloqueia o acesso antes de encaminhar a requisição

#### Scenario: Host não autorizado
- **WHEN** o endereço usa um host que não consta na configuração explícita de hosts permitidos
- **THEN** o Worker rejeita a requisição sem acessar esse host

#### Scenario: Redirecionamento para destino bloqueado
- **WHEN** um host permitido redireciona para um endereço privado, interno ou não permitido
- **THEN** o Worker interrompe o redirecionamento e não acessa o novo endereço

### Requirement: Limite de utilização
O Worker SHALL aplicar um limite configurado de requisições e SHALL recusar novas chamadas excedentes com resposta de limite, sem acessar o destino.

#### Scenario: Limite excedido
- **WHEN** um cliente ultrapassa o limite configurado no período
- **THEN** o Worker responde com status de limitação e não busca a playlist

### Requirement: Proteção de URL e token
O Worker SHALL exigir o token em cabeçalho de autorização, SHALL evitar registrar URL da playlist ou token e SHALL omitir esses valores de mensagens de erro e respostas.

#### Scenario: Pedido processado
- **WHEN** uma playlist é solicitada por uma chamada autorizada
- **THEN** o código não grava URL nem token em logs, e as respostas não os refletem

#### Scenario: Erro do destino
- **WHEN** a origem falha, excede limite de tamanho ou responde com erro
- **THEN** o Worker devolve mensagem sanitizada sem URL da playlist, credenciais, token ou corpo sensível da origem

### Requirement: Escopo de playlist exclusivamente
O Worker SHALL fornecer somente respostas de playlists e SHALL rejeitar rotas ou conteúdo destinados à reprodução de vídeo ou à obtenção de segmentos, chaves ou tickets de mídia.

#### Scenario: Tentativa de usar rota de mídia
- **WHEN** o cliente solicita rota de streaming, ticket ou conteúdo de vídeo
- **THEN** o Worker rejeita a chamada sem encaminhar mídia
