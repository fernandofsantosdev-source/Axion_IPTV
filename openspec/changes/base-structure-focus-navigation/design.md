# Design

## Context

O repositório contém apenas documentação e a imagem de referência; ainda não há código de aplicação nem specs existentes. Consulte [proposal.md](./proposal.md) e as specs desta mudança para motivação e contratos. A implementação deve usar HTML, CSS e JavaScript puros e atender navegadores antigos de Tizen.

## Goals / Non-Goals

**Goals:**
- Permitir que futuras telas sejam montadas na área principal sem recarregar a página.
- Concentrar a interpretação de entrada e o estado de foco em um módulo reutilizável.
- Manter a base simples, legível e compatível com os navegadores alvo.

**Non-Goals:**
- Implementar conteúdo ou layout específico das telas, player, integração AVPlay ou dados de catálogo.
- Introduzir dependências, transpilação ou APIs indisponíveis no ambiente alvo.

## Decisions

- **Arquivos estáticos separados, sem framework.** Uma página HTML inicial carrega CSS e scripts JavaScript comuns. Isso mantém a execução transparente e evita ferramentas de build ou recursos de módulos que possam não existir em navegadores antigos. Um bundler/framework foi descartado por não atender à tecnologia pedida.
- **Scripts compatíveis com navegadores antigos.** Usar JavaScript tradicional e encapsulamento por função, sem depender de módulos ES, sintaxe recente ou APIs exclusivas de desktop. A estrutura CSS usa dimensões de viewport e margens seguras para a referência 1920×1080.
- **Um único controlador central de foco.** Um adaptador normaliza eventos do controle Tizen e do teclado do computador para direções, confirmação e retorno. O controlador consulta apenas controles ativos e acionáveis; movimentos direcionais escolhem o candidato mais próximo na direção solicitada, usando ordem do documento como desempate estável. Sem candidato, o foco não se move.
- **Foco explícito e recuperável.** O estado de foco é representado por uma classe/atributo comum, com estilo visível e sem exigir efeitos pesados. Se o controle atual deixar de estar disponível, o controlador escolhe um controle elegível remanescente ou limpa a seleção. A confirmação chama a ação do controle uma única vez; Voltar é entregue à navegação da aplicação.
- **Animações limitadas.** Os estilos base não animam propriedades de layout nem aplicam `backdrop-filter` ou `filter: blur`. Qualquer transição de foco futura limita-se a `transform` e `opacity`; fundos e brilho são imagens ou gradientes sem desfoque.

## Risks / Trade-offs

- **Diferenças entre controles e navegadores Tizen** → Normalizar as entradas num adaptador e manter o teclado do navegador como caminho de desenvolvimento; validar a entrada real na TV quando houver ambiente disponível.
- **Seleção espacial ambígua em layouts irregulares** → Usar desempate pela ordem do documento e cobrir os casos de borda com testes do módulo de foco.
- **Compatibilidade limita sintaxe e APIs disponíveis** → Preferir APIs tradicionais e testar a página nos navegadores alvo antes de depender de recursos adicionais.
