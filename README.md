# Quiz Junco Tattoo

Página independente para qualificar projetos de tatuagem e preparar uma mensagem editável para o WhatsApp do Gabriel Junco. São 10 perguntas de escolha e o nome do cliente.

## Projeto

- HTML, CSS e JavaScript estáticos, sem dependências em produção.
- Fotos reais, fontes locais e carrossel contínuo com fotos completas.
- Fundo com pequenos símbolos brancos de tatuagem, brilho suave e opacidade variável.
- Respostas somente na memória da página. O envio é confirmado pelo visitante no WhatsApp.
- Sem pixels, formulários externos, armazenamento de leads ou vínculo com o layout do site principal.
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
