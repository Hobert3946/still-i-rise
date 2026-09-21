# Como trabalhar neste repositório (pessoas e agentes de IA)

Este app já quebrou duas vezes (tela em branco e "syntax error") porque várias mãos editaram o mesmo arquivo sem teste. As regras abaixo existem para isso não voltar.

## Regras

1. **Um editor por vez.** Se outro agente ou pessoa estiver mexendo no repositório, espere ele dar commit. Antes de começar: `git pull` e `git status` limpo.
2. **Edite só `src/`.** A pasta `docs/` é gerada por `npm run build`. Nunca edite `docs/index.html` à mão.
3. **Rode `npm test` antes de dar push.** O push é bloqueado automaticamente (hook `.githooks/pre-push`, ativado por `git config core.hooksPath .githooks`) se o build ou algum teste falhar, ou se `docs/` não estiver commitado em dia.
4. **Não empilhe remendos.** Não crie `orig_algo`, não reatribua `rDeck = function...`, não injete HTML com `insertBefore` por cima de outra tela. Edite a função que já existe.
5. **Um único ouvinte de clique.** Para uma nova ação, registre `ACT["nome-da-acao"] = (botao, evento) => {...}` no módulo e use `data-act="nome-da-acao"` no HTML. Sem `onclick` inline.
6. **Segredos nunca saem do aparelho.** `gemKey` e `ghToken` ficam só no localStorage. Todo backup e toda cópia na nuvem passam por `safeState()`.
7. **Não escreva na tela o que o app não sabe.** Sem alertas inventados (ex.: "pico glicêmico" sem medir glicose) e sem números fixos disfarçados de dados.
8. **Mudou o app? Suba o cache.** Altere `V` em `src/sw.js` a cada release, senão o celular pode continuar com a versão antiga.

## Estrutura

| Arquivo | Função |
|---|---|
| `src/base.js` | registro de ações `ACT` |
| `src/foods.js`, `src/plan.js` | tabela de alimentos; plano de treino, hábitos, suplementos |
| `src/progressao.js` | progressão automática de carga e sequência A a E |
| `src/agua.js` | aba Água e frase do dia |
| `src/comer.js` | aba Comer: refeições, favoritos, arrastar para excluir |
| `src/metabolico.js` | dica de proteína e água para o resto do dia |
| `src/deck.js` | Deck, cabeçalho, Aura, cardio, resumo semanal |
| `src/lembretes.js` | lembretes em arquivo .ics |
| `src/ia.js`, `src/foto.js` | A.I. (Gemini) |
| `src/nuvem.js` | cópia dos dados em gist e `safeState()` |
| `src/app.js` | estado, treino, evolução, mais, ações e inicialização |

A ordem de junção está em `build.js`.

## Testes

`npm test` monta o app, abre no jsdom e confere abas, ações, alertas, progressão, backup e IA. Para um novo recurso, crie `test/t-nome.js` (veja os existentes). O CI do GitHub roda o mesmo teste em cada push.
