# Como trabalhar neste repositório (pessoas e agentes de IA)

Este app já quebrou duas vezes (tela em branco e "syntax error") porque várias mãos editaram o mesmo arquivo sem teste. As regras abaixo existem para isso não voltar.

## Regras

1. **Um editor por vez.** Se outro agente ou pessoa estiver mexendo no repositório, espere ele dar commit. Antes de começar: `git pull` e `git status` limpo.
2. **Edite só `src/`.** A pasta `docs/` é gerada por `npm run build`. Nunca edite `docs/index.html` à mão.
3. **Rode `npm test` antes de dar push.** O push é bloqueado automaticamente (hook `.githooks/pre-push`, ativado por `git config core.hooksPath .githooks`) se o build ou algum teste falhar, ou se `docs/` não estiver commitado em dia.
4. **Não empilhe remendos.** Não crie `orig_algo`, não reatribua `rDeck = function...`, não injete HTML com `insertBefore` por cima de outra tela. Edite a função que já existe.
5. **Um único ouvinte de clique.** Para uma nova ação, registre `ACT["nome-da-acao"] = (botao, evento) => {...}` no módulo e use `data-act="nome-da-acao"` no HTML. Sem `onclick` inline.
6. **Segredos nunca saem do aparelho.** `gemKey`, `ghToken` e `ghGistId` ficam só em `sir_secrets` (localStorage), fora do estado. Todo backup e toda cópia na nuvem passam por `safeState()`.
7. **Não escreva na tela o que o app não sabe.** Sem alertas inventados (ex.: "pico glicêmico" sem medir glicose) e sem números fixos disfarçados de dados.
8. **Mudou o app? Suba o cache.** Altere `V` em `src/sw.js` a cada release, senão o celular pode continuar com a versão antiga.

## Estrutura

| Pasta | Função |
|---|---|
| `src/core/` | `util` (utilidades e registro `ACT`), `store` (perfis, migrações, localStorage + IndexedDB, segredos), `rules` (dia ativo, sequências, metas), `init` |
| `src/data/` | `foods` (189 alimentos), `plan` (treino, hábitos, catálogo, marcos, rua), `content` (frases, refeições), `defaults`, `suplementos` (fichas com evidência), `tratamento` (educação em 4 níveis) |
| `src/domain/` | regras sem tela: `progressao`, `treino`, `agua`, `comida`, `metabolico`, `agenda` (rotina flexível), `remedios` (doses e adesão), `apetite` (padrões), `agora` (card Agora e dia alinhado) |
| `src/svc/` | `backup` (`safeState()`), `nuvem` (gist), `ia` (Gemini), `foto` (foto do prato), `fotos` (fotos de progresso, só no aparelho), `lembretes` (.ics) |
| `src/ui/` | `shell` (seções, páginas, camadas, voltar), `parts`, `hoje`, `agenda-ui` + `agenda-add`, `acoes` (botão da logo) + `parser`, `keyboard`, `arena` + `rest`, `*-ui` das seções, `coach-ui`, `ajustes-ui`, `profiles`, `list-editor`, `events` (o único ouvinte de clique), `gestures` |
| `src/css/` | `tokens` (roxo/azul), `base`, `layout`, `sections`, `keyboard`, `arena` |

A ordem de junção está em `build.js`. Arquivos com menos de 250 linhas (o teste de fumaça confere).

## Testes

`npm test` monta o app, abre no jsdom e confere abas, ações, alertas, progressão, backup e IA. Para um novo recurso, crie `test/t-nome.js` (veja os existentes). O CI do GitHub roda o mesmo teste em cada push.
