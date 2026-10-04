# Novidades do Still I Rise: versão 3.3.0 → 3.5.0

Publicada em 04/10/2026.

## Como atualizar (só desta vez)

1. Feche o app de vez (tire da lista de apps abertos) e abra de novo.
2. Confira em **Ajustes** (toque no seu avatar), no fim da tela: deve aparecer **"Versão 3.5.0 · 4b356adc"**.

Daqui em diante o app se atualiza sozinho (veja "Atualização automática", no fim).

> Não apague o app nem limpe os dados do site para forçar a atualização: seus registros ficam só no celular. Se quiser segurança extra, exporte um backup antes.

---

## O que você vai notar

### Tela Hoje
- O **card Agora** abre a tela, já aberto. Ele mostra a ação mais importante do momento.
- Dá para **recolher** o card numa linha (a escolha fica salva). O que é urgente, como dose atrasada ou treino em andamento, aparece sempre aberto.
- A **frase do dia** foi para o fim da tela, menor.

### Confirmações e "Desfazer"
- As perguntas de confirmação agora aparecem num **painel do próprio app**, não na janela do navegador. O botão diz o que vai acontecer ("Apagar tudo", "Baixar e substituir") e fica vermelho quando apaga algo.
- Tirar um item da rotina, remover remédio, hábito, suplemento ou meta é **imediato**, com **Desfazer** no aviso que aparece embaixo.

### Agenda e remédios
- **"Salvar sempre" vale do dia escolhido em diante.** Os dias anteriores continuam como eram.
- **Mudar o horário de um remédio não zera mais a adesão.** Antes, trocar 08:00 por 09:00 apagava o histórico de doses da conta.
- Acrescentar um horário novo de remédio começa a contar a partir de hoje, sem criar doses "perdidas" no passado.
- Tirar um item da rotina não apaga os dias passados.

### Perfil e metas
- Novo campo **sexo biológico**. A meta de calorias usa a fórmula certa para mulheres (antes era sempre a masculina, cerca de 166 kcal acima para uma mulher de 50 anos).
- Perfis que já existiam aparecem como **"Não informado"** e continuam com o cálculo de antes. **Informe o sexo em Ajustes › Perfil e metas.**
- Instalação nova abre uma tela de **boas-vindas** (nome, sexo, peso, meta, altura e idade), sem dados de outra pessoa e sem remédio cadastrado. Ela também oferece restaurar de um backup ou da nuvem.

### Lembretes no calendário
- O arquivo de lembretes agora sai da sua **Agenda**, com os **remédios** (e a dose informada), o treino e as consultas marcados. Suplementos, hábitos, refeições e atividades podem ser marcados também.
- Dá para escolher avisar **na hora, 10 ou 30 minutos antes**.
- Pesagem semanal e copos de água continuam como lembretes extras.
- **Gere o arquivo de novo** e apague do calendário os eventos antigos (o de 04:50, por exemplo) para não duplicar.

### Backup e nuvem
- **Compartilhar backup:** onde o celular permite (como no iPhone), o backup vai direto para WhatsApp ou Drive. Baixar o arquivo continua como alternativa.
- **Restaurar num celular novo não apaga mais a cópia da nuvem.** Antes, ligar a nuvem num aparelho novo enviava os dados vazios por cima da cópia.
- **Dois aparelhos:** se outro aparelho mudou a nuvem, a cópia automática para e o app pergunta qual versão vale, em vez de sobrescrever.
- **Senha da cópia (opcional):** com ela, os dados vão criptografados para o GitHub e só abrem com a senha. Guarde a senha junto com o Gist ID: sem ela não dá para restaurar.
- **Passo a passo** em Ajustes › Nuvem, com link que já cria o token do GitHub com a permissão certa.

### Coach
- Passo a passo para criar a **chave do Gemini**, com link direto para o Google AI Studio.

### Dicas de uso
- Explicações e gestos (segurar uma tecla para escolher os gramas, arrastar para excluir, arrastar o horário na agenda, arrastar a carga no treino) aparecem como **dicas** até você tocar em **"Entendi"**.
- Para ver todas de novo: **Ajustes › Aparência › Mostrar as dicas de novo**.
- Avisos de saúde e privacidade (remédios, tratamento, chave do Gemini) continuam sempre na tela.

### Visual e leitura
- Números sempre com **vírgula** (138,5 kg) em todas as telas.
- A **cor escolhida** em Ajustes agora pinta o app inteiro. Antes, os brilhos de fundo ficavam roxos em qualquer paleta.
- **Contraste melhor** no tema claro e em todas as 12 paletas. Verde, Laranja, Rosa e Ouro (claro) e Bordô (escuro) ficaram um pouco mais escuras para ler melhor.
- **Nenhuma letra menor que 12 px.**
- O texto do Treino mostra os dias e o horário da **sua** agenda (antes dizia sempre "segunda a sexta às 5h").
- A pergunta de **dor no ombro** depois dos treinos A, D e E pode ser desligada em Treino.

### Acessibilidade
- Ao abrir um painel, o foco vai para o título dele e volta ao botão quando ele fecha (para quem usa leitor de tela ou teclado).
- Os botões de escolha (tema, horário fixo ou flexível, manhã, tarde ou noite...) informam ao leitor de tela qual está marcado.

---

## Correções que você talvez não veja, mas importam

- O **texto digitado não some mais** quando o app redesenha a tela (acontecia a cada minuto e ao voltar para o app, apagando o que você escrevia no Coach ou em Ajustes).
- O app usa **uma conexão só** com o banco de dados do celular (antes abria uma nova a cada gravação).
- **Proteção extra (CSP):** o app só roda o próprio código e só conversa com Gemini, GitHub, Wikipédia e Google Fonts. Um conteúdo malicioso dentro de um backup importado não consegue rodar.

---

## Atualização automática

- O app procura versão nova **sozinho**: ao voltar para a tela, quando a internet volta e a cada 30 minutos.
- Ele recarrega numa **hora segura**: com o app em segundo plano, ou quando não há treino aberto, painel aberto nem alguém digitando. Depois avisa "App atualizado".
- Em **Ajustes**, no fim da tela, aparecem a versão e o número do build, além do botão **"Procurar atualização"**.

---

## Para quem mexe no código

- `npm run format` (Prettier) antes de `npm test`: o teste agora reprova código fora do formato.
- A versão do cache é gerada no build pelo conteúdo; não é preciso trocar `V` à mão.
- O repositório tem regras novas em `COLABORACAO.md`: sem janelas do navegador (`confirm`/`alert`), dica com `hint()`, número na tela com `fmtN()`, contraste testado e novo serviço externo liberado na CSP.
- Testes: de 273 para 410 verificações.
