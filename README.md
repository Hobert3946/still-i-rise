# Still I Rise · v3

PWA pessoal de treino, alimentação, saúde e hábitos para manter o peso depois de uma grande perda. JavaScript puro, sem backend, sem framework. Feita para o celular (instalada na tela inicial).

- Código-fonte: `src/` · Gerar o app: `node build.js` (saída em `docs/`, servida pelo GitHub Pages)
- Testes: `npm test` (jsdom, confere também o formato) · Formatar: `npm run format` (Prettier)
- **Atualização automática:** o build gera um número de versão a partir do conteúdo (aparece no fim de Ajustes, ex.: `3.5.0 · 4b356adc`). Publicou (push na `main` com `docs/`), o app instalado no celular percebe sozinho ao voltar para a tela (e a cada 30 min) e recarrega na hora segura: em segundo plano, ou sem treino, painel aberto ou alguém digitando. `APP_VERSION` é só o nome da versão para pessoas.

## Princípio
**A complexidade fica no sistema, não na tela.** O app responde primeiro "o que eu faço agora?". O resto aparece quando você toca.

## Navegação
Barra de baixo com 4 seções com nome e a **logo no centro**:

| Hoje | Treino | **Registrar** (logo) | Nutrição | Saúde |
|---|---|---|---|---|

- **Coach:** botão fixo no canto de cima, em qualquer seção.
- **Perfil e ajustes:** toque no seu avatar, no canto de cima à esquerda.
- **Primeira vez:** a tela de boas-vindas pede nome, sexo biológico, peso, meta, altura e idade (ou restaura de um backup .json ou da nuvem).
- **Voltar:** o botão voltar do celular fecha a camada de cima.
- **Dicas:** explicações e gestos (segurar, arrastar) aparecem até você tocar em "Entendi". Ajustes › Aparência mostra todas de novo.
- **Apagar ou substituir** pede confirmação no próprio app. Tirar da rotina, remover remédio, hábito, suplemento ou meta é imediato, com **Desfazer** no aviso.
- **Números** sempre no padrão brasileiro (138,5 kg).

### Hoje
- **Card AGORA (abre a tela, aberto):** uma única ação, a mais relevante do momento. Pode ser o treino em 5 min, uma dose atrasada, o almoço, a água atrás do ritmo, "como dormiu?", "como está sua fome?", a Regra nº 1, a pesagem de segunda ou um alerta (ausência, dor, deload, backup). "Depois" adia por 30 min. Dá para recolher o card numa linha (fica salvo no aparelho), mas o que é urgente (dose atrasada, treino em andamento) aparece sempre aberto.
- **"Seu dia está X% alinhado":** tocar mostra o que conta e quanto, e deixa marcar os hábitos ali mesmo. Só entra no cálculo o que já dá para medir.
- **Água, proteína e calorias** em três barras.
- **A seguir:** os próximos itens da agenda.
- **Frase do dia** compacta, com a foto do autor, e **rodapé** com dica do dia e próximo marco (ao tocar).

### Agenda (Hoje → "Agenda")
A rotina não tem horário fixo. Cada item é de um destes tipos:
- **recorrente:** dias da semana + horário + duração
- **evento único:** data + horário (ex.: consulta)
- **flexível:** "fazer hoje", de manhã, de tarde ou de noite, sem hora
- **meta diária:** água, proteína, fibras, ou uma meta sua (ex.: passos)

Como editar:
- **Tocar** num item abre a edição: horário, duração, dias, concluir, pular, duplicar, reagendar e excluir. Toda mudança pergunta **"Só neste dia" ou "Sempre"**.
- **"Sempre" vale do dia escolhido em diante.** Os dias anteriores continuam como eram, e "Tirar da rotina" também não apaga o passado.
- **Arrastar pela alça ⋮⋮** muda o horário (de 15 em 15 min), só naquele dia. O aviso que aparece oferece "Aplicar sempre".
- **+ Adicionar** cria atividade, consulta, hábito, suplemento, refeição, treino ou meta diária.

### Registrar (logo)
- **8 ações grandes:** Água, Refeição, Treino, Peso, Fome, Remédio ou suplemento, Agenda, Cardio. Registrar água leva 2 toques.
- **Campo de texto:** entende frases como `água 500`, `frango 150 @jantar`, `peso 118,4 cintura 121`, `dor 3`, `fome`, `?pergunta ao Coach`.

### Treino
- **Hoje:** o treino do dia (os dias vêm da agenda) e o botão para a **Arena**.
- **Plano:** A–E com variações e "como fazer".
- **Progressão e regras:** progressão automática, regras de carga, rodízio de variações.
- **Ombro e deload:** dor no ombro e sinal de deload.
- **Números:** empurrar × puxar e maiores cargas.

### Nutrição: Refeições · Água · Apetite
- **Refeições:**
  - metas do dia
  - foto do prato (Gemini) e registro por rótulo
  - motor metabólico
  - as 5 refeições com o teclado de alimentos (toque = porção, segurar = gramas e favoritar, arrastar = excluir)
  - fibras e comer na rua
- **Água:** garrafa animada, ritmo por hora, tamanhos rápidos, histórico e meta.
- **Apetite:**
  - registro de fome em ~5 s: fome, vontade, perda de controle, gatilhos e estresse
  - horas de sono
  - **padrões** calculados com os seus dados, que só aparecem com dados suficientes e dizem em quantos dias se basearam

### Saúde: Corpo · Remédios · Suplementos · Tratamento
- **Corpo:** peso, gráfico, IMC, cintura, marcos, pescoço (acantose), ritmo das 8 semanas, **fotos de progresso** (só no aparelho) e protocolo de recaída.
- **Remédios:** área sóbria.
  - dose **informada por você** conforme a receita; o app nunca sugere dose
  - horários na agenda (mudar um horário vale de hoje em diante; as doses já registradas e a adesão continuam)
  - "Registrar dose", com a hora registrada
  - adesão de 30 dias
  - **perguntas para a próxima consulta**
- **Suplementos:** os de hoje e a sua lista. Cada suplemento tem uma ficha com a **evidência** (Forte / Moderada / Limitada / Insuficiente), benefícios, uso, efeitos, interações e quem deve evitar.
- **Tratamento da obesidade:** educação em 4 níveis:
  1. Base
  2. Com acompanhamento (inclui GLP-1)
  3. Especializado
  4. Procedimentos

  Não recomenda nada, não dá dose e não promete perda de peso. Cada opção tem o botão "Quero perguntar ao médico".

## Lembretes
O app gera um arquivo `.ics` que o calendário do celular importa, e os avisos tocam mesmo com o app fechado (Ajustes › Lembretes).
- Os horários vêm da **Agenda**: remédios (com a dose), treino e consultas vêm marcados; suplementos, hábitos, refeições e atividades podem ser marcados.
- Itens sem horário fixo não entram. Pesagem semanal e copos de água ficam como lembretes extras.
- Dá para avisar na hora, 10 ou 30 min antes. Mudou a agenda? Gere o arquivo de novo.

## Dados
- **Perfis:** cada perfil guarda os próprios dias, treinos, agenda, remédios, apetite, favoritos e conversa.
- **3 camadas de backup:**
  1. localStorage
  2. espelho em IndexedDB
  3. arquivo `.json` exportado (no iPhone, "Compartilhar backup" manda direto para WhatsApp ou Drive)

  Além delas, há a cópia automática num gist secreto do GitHub.
- **Nuvem (gist):**
  - Num aparelho novo, "Salvar" não envia nada se o gist já tem dados: o app pergunta qual versão vale. "Baixar da nuvem" lê os campos da tela.
  - Antes de cada envio automático, o app confere se outro aparelho mudou o gist. Se mudou, a cópia automática para e o card Agora pede para escolher.
  - **Senha da cópia** (opcional): os dados vão criptografados (PBKDF2 + AES-GCM) e só abrem com ela.
  - Ajustes › Nuvem tem um passo a passo com link que já cria o token com a permissão certa. O Coach tem o passo a passo da chave do Gemini.
- **Segredos:** a chave do Gemini, o token, o gist e a senha da nuvem ficam em `sir_secrets`, só neste aparelho, fora de todo backup (`safeState()`).
- **Metas:** Mifflin-St Jeor com o sexo biológico do perfil (perfis antigos sem sexo informado seguem com a fórmula masculina).
- **Acessibilidade:** contraste AA nos dois temas e nas 12 paletas, letra mínima de 12 px, foco no painel que abre (e de volta ao fechar), botões de escolha com estado para leitor de tela.
- **Segurança:** a página tem uma CSP gerada no build (hash de cada script, sem `unsafe-inline`); a rede só fala com Gemini, GitHub, Wikipédia e Google Fonts.
- **Fotos de progresso:** ficam só no IndexedDB do aparelho.
- **Migração:** os dados antigos migram sozinhos.
  - `sir_v1` é preservado para permitir rollback.
  - Os horários fixos viram rotina.
  - A metformina vira remédio, com o histórico preservado.
