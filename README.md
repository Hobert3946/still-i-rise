# Still I Rise · v2 "Maré"

PWA pessoal de treino, alimentação e hábitos para manter o peso depois de uma grande perda. JavaScript puro, sem backend, sem framework. Feita para o celular (instalada na tela inicial).

- Código-fonte: `src/` · Gerar o app: `node build.js` (saída em `docs/`, servida pelo GitHub Pages)
- Testes: `npm test` (jsdom) · Ao publicar, suba a versão `V` em `src/sw.js`

## O paradigma: o dia como um rio

Não há abas. A tela principal é **o seu dia, hora a hora**, das 04:30 às 22:30. Cada coisa aparece no horário em que acontece: suplementos, treino das 5h, café, almoço, caminhada, jantar, magnésio, sono. Uma linha **AGORA** separa o que passou do que vem.

| Camada | O que é | Como chegar |
|---|---|---|
| **Rio** | O dia vivo: anéis, Regra nº 1, sinais, nós por horário, trilho "o dia todo" | Tela inicial |
| **Orbe** | Paleta de comandos com texto livre | Botão redondo embaixo · `/` ou `Ctrl+K` no computador |
| **Lentes** | Corpo, Treino, Nutrição, Água, Aura, Sistema | Tocar nos anéis/números, na gota, na paleta ou nas cápsulas de sequência |
| **Arena** | Modo Treino imersivo, tela sempre acesa | Nó do treino → "Entrar na Arena" |

### Gestos
- **Tocar num nó** abre o nó ali mesmo. Uma refeição vira o teclado de alimentos, e um grupo de suplementos vira uma lista de checks.
- **Deslizar um nó ou hábito para a direita** marca como feito.
- **Deslizar um item da refeição para o lado** exclui o item, e o toast oferece desfazer.
- **Teclado de alimentos:**
  - tocar numa tecla = +1 porção
  - tocar de novo = soma no mesmo item
  - **segurar** = escolher gramas e favoritar na refeição
- **Arena:**
  - arrastar o número da carga ou das repetições para cima ou para baixo ajusta o valor, e tocar no número permite digitar
  - deslizar para os lados troca de exercício
- **‹ ›** no topo trocam o dia para corrigir registros antigos.
- O **voltar** do Android fecha a camada de cima.

### A maré
A espinha do rio se enche de água até o horário em que o volume bebido "estaria no ritmo" (meta linear das 6h às 21h). Se a água passou da linha AGORA, você está adiantado. Se ficou abaixo, está atrasado.

### O que a paleta entende
`água 500` · `500` · `garrafa` · `frango 150` · `arroz 100 @jantar` · `peso 118,4 cintura 121` · `cardio 30 6,5 5` · `fibra 5` · `dor 3` · `pescoço 4` · `repetir almoço` · `perfil Mãe` · `rua` · `backup` · `?pergunta para a Aura`. Sem refeição explícita, o alimento entra na refeição do horário atual.

## Onde está cada coisa
- **Corpo:**
  - peso, gráfico das últimas 16 pesagens com linha de meta, cintura
  - marcos
  - termômetro do pescoço (acantose)
  - ritmo das 8 semanas e sequências
  - maiores cargas
  - resumo da semana
  - protocolo de recaída
- **Treino:**
  - plano A–E com variações e "como fazer"
  - próxima carga por exercício
  - regras de progressão
  - rodízio de variações (liga/desliga e intervalo em semanas)
  - modo de registro
  - empurrar × puxar
  - dor no ombro e deload
  - "Não consegui ir hoje"
- **Nutrição:**
  - metas do dia
  - foto do prato (Gemini) e registro por rótulo
  - motor metabólico
  - fibras
  - as 5 refeições com teclado, favoritos e "repetir"
  - Comer na rua (7 cartões: boa × armadilha)
- **Água:**
  - garrafa animada e ritmo por hora
  - 6 tamanhos, valor livre e desfazer
  - sequência na meta
  - gráfico semanal e histórico do dia
  - meta
- **Aura:** chat com o Gemini, com contexto do dia e dos últimos 7 dias, foto e histórico de 40 mensagens. Os modelos são o `gemini-3.8-flash` (padrão) e o `gemini-3.5-flash-lite`, com botão "Verificar modelos".
- **Sistema:**
  - perfis
  - perfil e metas (peso, meta, altura, idade, déficit, fator de atividade, piso, água)
  - hábitos (Regra nº 1 e N)
  - suplementos e remédios
  - catálogo
  - tema, notificações e lembretes `.ics`
  - nuvem (Gist) e backup

## Dados
- **Perfis:** cada perfil guarda os próprios dias, treinos, pesos, hábitos, suplementos, favoritos e conversa.
- **Formato:** o estado fica em `sir_v2`. Na primeira abertura, o `sir_v1` antigo é migrado para o perfil "Hobert" e não é apagado, para servir de rollback.
- **3 camadas de backup:**
  1. localStorage
  2. espelho em IndexedDB
  3. arquivo `.json` exportado

  Além delas, há a cópia automática num gist secreto.
- **Segredos:** a chave do Gemini, o token e o gist ficam em `sir_secrets`, só neste aparelho. Nunca entram em backup nem na nuvem (`safeState()`).
