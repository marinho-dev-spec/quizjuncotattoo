# Revisão do quiz — 8 de setembro de 2026

Escopo: abertura, seis projetos, seis avaliações, 11 etapas, campos opcionais, validação, resumo, edição e composição do WhatsApp. Foram aplicadas as skills Impeccable, UI/UX Pro Max e Web Design Guidelines, preservando a identidade, as perguntas e os efeitos automáticos aprovados.

## Melhorias entregues

- `public/quiz/index.html`: retrato de Gabriel em WebP de 228 px; primeira foto responsiva; fonte do texto pré-carregada; título principal em cada tela; progresso com nome, valor e descrição acessíveis.
- `public/quiz/quiz-gallery.mjs`: versões de 640/800 px no carrossel; originais de 1400 px na ampliação; carregamento tardio da cópia do carrossel; transição breve ao trocar a foto. Corrigidos descritores de largura que anunciavam 480 px para miniaturas de 640 px.
- `public/quiz/quiz.css`: opções com frases longas ocupam uma coluna no celular; ação de continuar acompanha a rolagem, com espaço para a área segura; campos focados mantêm distância da ação; fotos de referência sem recorte; modal cabe em telas baixas na horizontal; nomes longos quebram linha; efeitos de hover limitados a dispositivos com mouse.
- `public/quiz/quiz.js`: animação de progresso por transformação, entrada curta das telas e retorno imediato ao topo antes da transição da pergunta. Removida a execução duplicada do tratamento de respostas por `input` e `change`.
- `vercel.json`: cache de um dia para imagens e fontes, com revalidação em segundo plano; HTML e scripts mantêm sua atualização normal a cada publicação.

## Medições

Laboratório local em Chromium: cache frio, download de 1,6 Mbps, latência de 150 ms, CPU com desaceleração de 4 vezes. Celular em 390 × 844, densidade 3; desktop em 1440 × 844, densidade 1. O carregamento local não inclui o SDK remoto da Meta, habilitado somente em produção. São amostras controladas, não dados de visitantes reais nem uma pontuação Lighthouse.

| Medida | Antes | Depois |
|---|---:|---:|
| Recursos iniciais no celular | 691.298 bytes | 290.308 bytes |
| Recursos iniciais no desktop | 402.398 bytes | 306.476 bytes |
| LCP no celular | 1,196 s | 1,232 s |
| LCP no desktop | 2,352 s | 1,216 s |
| CLS no celular | 0,0023 | 0 |
| CLS no desktop | 0,0034 | 0 |

A redução de transferência foi de aproximadamente 58% no celular e 24% no desktop. O LCP móvel ficou essencialmente estável nesta amostra; não foi observada aceleração dessa métrica no celular. As fotos e fontes leves reduzem o consumo de dados. Não foram observados intervalos de animação acima de 50 ms na amostra de dois segundos de cada viewport. Isso não substitui medição em aparelhos físicos.

## Testes executados

- `npm test`: validação de todas as opções, dez perguntas de marcar e nome, limites, campos opcionais, remoção de respostas condicionais antigas, personalização e codificação do WhatsApp.
- `npm run test:browser`: fluxo completo em 320, 360, 390, 430, 768, 1024 e 1440 px; retorno às respostas, teclado, erros, edição, cópia com alternativa em caso de falha, resumo e galeria. Sem erros de JavaScript, recursos falhando ou solicitações externas locais.
- `npm run test:ux`: 42 estados no Chromium e 42 no WebKit 26.5. Todas as opções foram selecionadas individualmente; contraste e semântica verificados com axe; sem textos transbordando ou alvos abaixo de 44 px nos controles inspecionados. Inclui 844 × 390 na horizontal, resultado com nome de 60 caracteres, detalhes extensos e simulação da área disponível acima do teclado em 390 × 420.
- `npm run test:motion`: movimento contínuo dos dois carrosséis, emenda sem salto, fotos inteiras, ícones brancos em queda, efeitos automáticos, redução de movimento do sistema e suspensão do trabalho das regiões fora da tela.
- Capturas das 11 etapas, abertura e resultado em mobile e desktop, além da galeria na horizontal. Inspeção visual da distribuição das opções, qualidade das fotos, leitura, mensagem e controles.

Os testes de WhatsApp interceptam a ação; nenhuma mensagem é enviada. WebKit foi executado no Windows e não representa um teste em iPhone físico. A suíte automática não certifica conformidade completa com WCAG nem o recebimento de eventos no Gerenciador da Meta.

## Resultado da auditoria

| Dimensão | Avaliação | Evidência / limite |
|---|---:|---|
| Acessibilidade | 3/4 | Axe sem violações nos estados testados; contraste, foco e teclado verificados. Movimento automático preservado por solicitação. |
| Desempenho | 3/4 | Menos bytes e layout estável no laboratório; produção com serviços externos e aparelhos reais não medida como CWV de campo. |
| Responsividade | 4/4 | Sete larguras, horizontal, viewport de teclado e textos longos passaram. |
| Tema e consistência | 3/4 | Fontes locais, tokens e estados coerentes; ainda existem cores pontuais nas regras CSS. |
| Integridade | 4/4 | Conteúdo real, dez perguntas por seleção, fotos sem corte e WhatsApp editável preservados. |
| Total | 17/20 | Boa qualidade nos cenários cobertos. |

O detector Impeccable registrou somente os dois carrosséis automáticos. São escolhas expressamente solicitadas, mantidas com redução de movimento do sistema e suspensão quando invisíveis. A ausência de um controle manual de pausa permanece uma exceção à recomendação de acessibilidade para conteúdo em movimento; não se declara conformidade integral.

Fontes de orientação: [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Evidências detalhadas nos arquivos `performance-before.json`, `performance-after.json`, `validacao-quiz-local.json`, `validacao-quiz-motion.json` e `validacao-ux-*.json` desta pasta.
