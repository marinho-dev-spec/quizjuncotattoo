# Quiz Junco Tattoo

Página independente para qualificar projetos de tatuagem e preparar uma mensagem editável para o WhatsApp do Gabriel Junco. São 10 perguntas de escolha e o nome do cliente.

## Projeto

- HTML, CSS e JavaScript estáticos, sem dependências em produção.
- Fotos reais, fontes locais e carrossel contínuo com fotos completas.
- Fundo com pequenos símbolos brancos de tatuagem, brilho suave e opacidade variável.
- Respostas somente na memória da página. O envio é confirmado pelo visitante no WhatsApp.
- Pixel da Meta `1075539164267174`, o mesmo do site principal, com `PageView` e `Contact` no clique para o WhatsApp. Sem Google Analytics, Google Ads ou GTM.
- Respostas, nome e mensagem não são enviados como parâmetros do Pixel. Não há formulários externos, armazenamento de leads ou vínculo com o layout do site principal.
- Página com `noindex, nofollow`, preservando a configuração aprovada do quiz.

## Prévia local

Com Node.js 22 ou superior, execute `npm start` e abra http://127.0.0.1:3002. A página também atende `/quiz`.

## Testes

Execute `npm install`, `npx playwright install chromium` e `npm test`. Com a prévia local rodando, use `npm run test:browser` e `npm run test:motion`.

Os testes verificam o fluxo completo em sete larguras, acessibilidade automática, fotos, carrossel, animação, edição e composição da mensagem. Não enviam mensagens no WhatsApp.

`QUIZ_BASE_URL` permite testar outra URL. `PLAYWRIGHT_MODULE`, `CHROME_PATH` e `AXE_PATH` permitem usar um navegador e bibliotecas já instalados.

## Publicação

O `vercel.json` entrega somente a pasta `public`, sem instalação ou compilação em produção. As rotas `/` e `/quiz` apontam para a mesma página.

Repositório: https://github.com/marinho-dev-spec/quizjuncotattoo.

Após conectar o projeto na Vercel, os pushes para `main` atualizam a versão de produção. Alterações futuras deste quiz devem ser feitas neste repositório separado.

## Pixel da Meta

O arquivo `public/quiz/meta-pixel.js` carrega o Pixel apenas em `quizjuncotattoo.vercel.app`, preservando os testes locais e deployments de prévia. `PageView` dispara uma vez por carregamento. `Contact` dispara no primeiro clique válido no WhatsApp por carregamento; não significa mensagem enviada nem agendamento confirmado.

A configuração automática de eventos fica desativada. Os parâmetros de `Contact` são fixos e não incluem respostas, dados de identificação ou o link completo do WhatsApp. O bloqueio do Pixel pelo navegador não impede o formulário ou o contato. Caso um domínio próprio seja adicionado, ele precisa ser incluído na condição de hostname deste arquivo.

`npm run test:pixel` carrega o SDK real da Meta, verifica o ID, os eventos, a ausência de duplicatas e de dados do formulário, e intercepta qualquer envio de teste. `QUIZ_META_LIVE=true` valida os arquivos publicados. O teste verifica o processamento pelo SDK; a confirmação de recebimento e atribuição é feita no Gerenciador de Eventos da Meta.
