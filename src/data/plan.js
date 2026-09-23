// Cada slot: id, sets, reps [min,max], rest(s), inc(kg), push/pull (para balanço semanal), v = variações [id, nome, como fazer]
const CUFF = [
  {id:"w_rot", name:"Rotação externa na polia (cotovelo colado)", sets:2, reps:[15,15], how:"Polia na altura do cotovelo, cotovelo colado na costela dobrado a 90°. Gire o antebraço para fora devagar, segure 1 segundo e volte em 2. Carga bem leve: o ombro tem que sentir trabalhar, não sofrer."},
  {id:"w_face", name:"Face pull na polia alta", sets:2, reps:[15,15], how:"Corda na altura do rosto. Puxe em direção à testa abrindo os cotovelos para os lados, como se fosse mostrar os bíceps de trás. Segura 1 segundo. Peso leve."}
];
const PLAN = {
A: {name:"Peito", focus:"Peito + tríceps", cuff:true, ex:[
  {id:"a1", sets:4, reps:[8,10], rest:120, inc:2.5, push:4, v:[
    ["a1_halt","Supino reto com halteres (pegada neutra)","Deite no banco reto com um halter em cada mão, palmas viradas uma para a outra. Empurre para cima sem bater os halteres. Desça em 2 segundos só até a linha do tronco, sem afundar o cotovelo abaixo do peito."],
    ["a1_maq","Chest press na máquina (pegada neutra)","Ajuste o banco para a alça ficar na altura do meio do peito. Costas coladas, empurre sem esticar totalmente os cotovelos e volte devagar."]]},
  {id:"a2", sets:3, reps:[10,12], rest:90, inc:2.5, push:3, v:[
    ["a2_incl_halt","Supino inclinado com halteres 30° (pegada neutra)","Banco só um pouco inclinado (30°, dois furos acima do reto). Palmas viradas uma para a outra. Empurre em linha reta e desça em 2 segundos até a linha do tronco."],
    ["a2_incl_barra","Supino inclinado com barra (só se a dor estiver ≤ 2)","Só use se o ombro esquerdo estiver sem dor. Pegada um pouco mais aberta que os ombros, desça até quase tocar o peito alto, cotovelos a 45°. Se fisgar na frente do ombro, pare e troque por halteres."],
    ["a2_flex_smith","Flexão inclinada no Smith (barra na altura do quadril)","Mãos na barra do Smith numa altura que deixe o corpo inclinado, cotovelos a 45° do corpo. Desça o peito até a barra e empurre. Barra mais alta = mais fácil."]]},
  {id:"a3", sets:3, reps:[12,15], rest:75, inc:2.5, push:3, v:[
    ["a3_peck","Peck deck (amplitude parcial)","Costas coladas no encosto. Junte as mãos na frente do peito e volte só até a linha do tronco, sem abrir mais que isso. Aperta o peito 1 segundo."],
    ["a3_cross","Crossover na polia média (amplitude curta)","Polias na altura do peito, um passo à frente. Junte as mãos na frente do umbigo com os cotovelos levemente dobrados. Volte só até a linha do ombro."]]},
  {id:"a4", sets:3, reps:[12,15], rest:60, inc:2.5, push:3, v:[
    ["a4_corda","Tríceps na polia com corda (para baixo)","Cotovelos colados na costela. Empurre a corda para baixo abrindo as pontas no final e volte devagar até o antebraço ficar na horizontal. Só o antebraço se mexe."],
    ["a4_barra","Tríceps na polia com barra reta (para baixo)","Cotovelos colados. Empurre para baixo até esticar os braços, segura 1 segundo, volta em 2. Sem levantar o braço acima da cabeça."]]},
  {id:"a5", sets:3, reps:[30,45], rest:45, inc:0, push:0, unit:"s", v:[
    ["a5_prancha","Prancha no chão (segundos)","Antebraços no chão, corpo em linha reta, barriga contraída. Se dobrar a lombar, apoie os joelhos. Meça o tempo, não as repetições."],
    ["a5_crunch","Abdominal na máquina","Segure as alças junto ao peito e feche o tronco soltando o ar. Volte devagar. Não puxe com os braços."]]}
]},
B: {name:"Costas", focus:"Costas + posterior de ombro", cuff:false, ex:[
  {id:"b1", sets:4, reps:[8,12], rest:120, inc:2.5, pull:4, v:[
    ["b1_pux_neutra","Puxada na frente (pegada neutra)","Sente com as coxas presas. Puxe a barra para o alto do peito pensando em levar os cotovelos para o bolso de trás. Peito para frente, sem balançar o corpo. Volte esticando devagar."],
    ["b1_pux_aberta","Puxada na frente (pegada aberta)","Mãos um pouco mais abertas que os ombros. Puxe até a linha do queixo ao peito, cotovelos apontando para baixo. Sem jogar o corpo para trás."],
    ["b1_pux_maq","Puxada em máquina guiada","Ajuste o banco e puxe as alças com os cotovelos para baixo. Trajetória fixa, ideal para o começo do treino."]]},
  {id:"b2", sets:4, reps:[8,12], rest:120, inc:2.5, pull:4, v:[
    ["b2_rem_baixa","Remada baixa no cabo (triângulo)","Sentado, pés apoiados, joelhos levemente dobrados. Puxe o triângulo até o umbigo, juntando as escápulas, e volte esticando sem arredondar as costas."],
    ["b2_rem_maq","Remada na máquina com apoio no peito","Peito colado no apoio. Puxe as alças levando os cotovelos para trás e segura 1 segundo apertando as costas."],
    ["b2_rem_curv","Remada curvada com halteres (apoio no banco inclinado)","Peito apoiado no banco inclinado. Puxe os halteres até as costelas com o cotovelo junto ao corpo."]]},
  {id:"b3", sets:3, reps:[10,12], rest:90, inc:2.5, pull:3, v:[
    ["b3_uni","Remada unilateral com halter","Joelho e mão de um lado apoiados no banco. Puxe o halter até o quadril como quem liga um cortador de grama. Desça devagar."],
    ["b3_cavalinho","Remada cavalinho (T-bar)","Apoie o peito, puxe a barra até o peito e segura 1 segundo. Não use impulso."]]},
  {id:"b4", sets:3, reps:[12,15], rest:75, inc:1, pull:3, v:[
    ["b4_peck_inv","Crucifixo inverso no peck deck","De frente para o encosto, abra os braços para trás até a linha dos ombros. Peso leve e controle total, é o que protege o ombro."],
    ["b4_pullover","Pullover na polia alta (braços esticados)","Braços quase esticados, puxe a barra em arco até as coxas sentindo as costas. Não dobre os cotovelos."]]},
  {id:"b5", sets:3, reps:[15,15], rest:60, inc:1, pull:3, v:[
    ["b5_face","Face pull na polia alta","Corda na altura do rosto. Puxe abrindo os cotovelos para os lados e segure 1 segundo. Peso leve."]]},
  {id:"b6", sets:3, reps:[30,45], rest:45, inc:0, push:0, unit:"s", v:[
    ["b6_prancha_lat","Prancha lateral (segundos por lado)","Deite de lado, apoie o antebraço no chão e levante o quadril até o corpo ficar em linha reta. Mantenha o tempo e troque de lado."]]}
]},
C: {name:"Pernas", focus:"Quadríceps, posterior e glúteos", cuff:false, ex:[
  {id:"c1", sets:4, reps:[10,12], rest:150, inc:10, push:0, v:[
    ["c1_leg","Leg press 45°","Pés na largura dos ombros no meio da plataforma. Desça até os joelhos formarem 90° e empurre sem trancar os joelhos. Costas coladas no encosto."],
    ["c1_hack","Hack squat na máquina","Ombros sob as almofadas, pés à frente. Desça controlando até 90° nos joelhos e suba empurrando pelo meio do pé."],
    ["c1_agach_smith","Agachamento no Smith até o banco","Pés um pouco à frente da barra. Sente no banco atrás de você tocando de leve e levante. Guia fixo do Smith ajuda no equilíbrio."]]},
  {id:"c2", sets:3, reps:[12,15], rest:75, inc:5, push:0, v:[
    ["c2_ext","Cadeira extensora","Ajuste o encosto para o joelho ficar alinhado com o eixo. Estenda as pernas, segure 1 segundo no topo e desça em 2 segundos."]]},
  {id:"c3", sets:3, reps:[10,12], rest:75, inc:5, pull:0, v:[
    ["c3_flex_deit","Mesa flexora (deitado)","Deite de bruços, calcanhar sob o rolo. Leve os calcanhares em direção ao bumbum sem tirar o quadril da máquina e volte devagar."],
    ["c3_flex_sent","Cadeira flexora (sentado)","Puxe o rolo para baixo dobrando os joelhos e volte em 2 segundos."]]},
  {id:"c4", sets:3, reps:[10,12], rest:90, inc:10, push:0, v:[
    ["c4_hip","Elevação de quadril (hip thrust) na máquina ou banco","Costas apoiadas no banco, pés no chão. Empurre o quadril para cima apertando o bumbum e segura 1 segundo no topo."],
    ["c4_gluteo_polia","Coice na polia (glúteo)","Tornozeleira na polia baixa. Chute para trás sem arquear a lombar e volte devagar."]]},
  {id:"c5", sets:3, reps:[12,15], rest:60, inc:5, push:0, v:[
    ["c5_abd","Cadeira abdutora","Sente com as costas coladas, abra as pernas empurrando as almofadas para fora e volte devagar."]]},
  {id:"c6", sets:4, reps:[12,15], rest:60, inc:10, push:0, v:[
    ["c6_pant_leg","Panturrilha no leg press","Na ponta dos pés na borda da plataforma. Suba o máximo que der, segura 1 segundo e desça alongando."],
    ["c6_pant_pe","Panturrilha em pé (Smith ou máquina)","Ombros sob a almofada, suba na ponta dos pés e segure 1 segundo."]]}
]},
D: {name:"Ombros e Trapézio", focus:"Ombros, deltoide posterior e trapézio", cuff:true, ex:[
  {id:"d1", sets:4, reps:[12,15], rest:75, inc:1, push:4, v:[
    ["d1_lat_halt","Elevação lateral com halteres","Cotovelos levemente dobrados, levante os halteres para os lados até a altura do ombro e não mais que isso. Desça em 2 segundos."],
    ["d1_lat_polia","Elevação lateral na polia (unilateral)","Polia baixa, braço do lado oposto à polia. Levante o braço lateralmente até o ombro. Tensão contínua, bom para o ombro."],
    ["d1_lat_maq","Elevação lateral na máquina","Ajuste o banco e empurre as almofadas para os lados até a altura do ombro."]]},
  {id:"d2", sets:3, reps:[8,10], rest:120, inc:2.5, push:3, v:[
    ["d2_des_maq","Desenvolvimento na máquina (pegada neutra)","Banco ajustado para as alças ficarem na altura das orelhas. Empurre para cima sem trancar os cotovelos e desça devagar. Se o ombro esquerdo fisgar, reduza o peso ou pare."],
    ["d2_des_halt","Desenvolvimento com halteres sentado (pegada neutra)","Banco com encosto quase vertical. Palmas viradas uma para a outra, empurre para cima e desça até a altura das orelhas."]]},
  {id:"d3", sets:4, reps:[12,15], rest:75, inc:1, pull:4, v:[
    ["d3_post_peck","Crucifixo inverso no peck deck","De frente para o encosto, abra os braços para trás até a linha do ombro. Peso leve."],
    ["d3_post_polia","Voador inverso na polia cruzada","Polias altas cruzadas, puxe os cabos abrindo os braços para os lados na altura dos ombros."]]},
  {id:"d4", sets:3, reps:[12,15], rest:75, inc:2.5, pull:3, v:[
    ["d4_enc_halt","Encolhimento com halteres","Segure os halteres ao lado do corpo e leve os ombros em direção às orelhas, segura 1 segundo e desce."],
    ["d4_enc_smith","Encolhimento no Smith","Barra à frente das coxas, suba os ombros e segure 1 segundo. Sem rolar os ombros."]]},
  {id:"d5", sets:3, reps:[15,15], rest:60, inc:1, pull:3, v:[
    ["d5_face","Face pull na polia alta","Puxe a corda em direção à testa abrindo os cotovelos. Segure 1 segundo."]]}
]},
E: {name:"Braços", focus:"Bíceps, tríceps e antebraço", cuff:true, ex:[
  {id:"e1", sets:3, reps:[10,12], rest:75, inc:2.5, pull:3, v:[
    ["e1_rosca_w","Rosca direta com barra W","Cotovelos colados no corpo. Suba a barra até o peito sem balançar e desça em 2 segundos. Se fisgar o ombro, troque pela martelo."],
    ["e1_rosca_alt","Rosca alternada com halteres","Palmas para cima, suba um halter de cada vez girando a mão. Cotovelo parado."],
    ["e1_rosca_polia","Rosca na polia baixa","Barra reta ou W na polia baixa, cotovelos colados. Tensão contínua o movimento todo."]]},
  {id:"e2", sets:3, reps:[10,12], rest:75, inc:2.5, pull:3, v:[
    ["e2_martelo","Rosca martelo (pegada neutra)","Palmas viradas uma para a outra. Suba os halteres sem girar o punho. Pegada mais amiga do ombro."],
    ["e2_martelo_corda","Rosca martelo na polia com corda","Corda na polia baixa, palmas para dentro, puxe até o peito com os cotovelos colados."]]},
  {id:"e3", sets:4, reps:[12,15], rest:60, inc:2.5, push:4, v:[
    ["e3_corda","Tríceps na polia com corda (para baixo)","Cotovelos colados. Empurre para baixo abrindo a corda no final e volte devagar."],
    ["e3_barra_v","Tríceps na polia com barra V","Pegada fechada, empurre para baixo até esticar e volte em 2 segundos."]]},
  {id:"e4", sets:3, reps:[12,15], rest:60, inc:2.5, push:3, v:[
    ["e4_polia_uni","Tríceps na polia unilateral (para baixo)","Um braço por vez, cotovelo colado. Empurre a alça para baixo e volte devagar."],
    ["e4_mergulho_maq","Mergulho na máquina (paralelas assistidas)","Empurre as alças para baixo com o tronco reto, sem descer os cotovelos além de 90°."]]},
  {id:"e5", sets:3, reps:[12,15], rest:45, inc:1, pull:3, v:[
    ["e5_inversa","Rosca inversa (pegada por cima)","Barra com pegada por cima, suba mantendo os punhos firmes. Peso leve, é para antebraço."],
    ["e5_punho","Rosca de punho","Antebraços apoiados nas coxas, dobre e estenda o punho devagar."]]},
  {id:"e6", sets:3, reps:[12,15], rest:45, inc:2.5, push:0, v:[
    ["e6_abd_polia","Abdominal na polia (corda)","De joelhos, corda atrás da cabeça, curve o tronco levando os cotovelos aos joelhos soltando o ar."],
    ["e6_abd_maq","Abdominal na máquina","Segure as alças, feche o tronco soltando o ar e volte devagar."]]}
]}
};
const DAY_ORDER = ["A","B","C","D","E"]; // seg a sex

const TIPS = [
"A balança sobe 1,5 kg depois de um prato salgado e isso não é gordura. Por isso a pesagem é semanal e sempre igual.",
"Treino ruim feito vale mais que treino perfeito adiado.",
"Se hoje você falhou em tudo menos em não beber açúcar, o dia foi bom.",
"As manchas no pescoço clareiam antes da balança mudar. É o termômetro mais honesto que você tem.",
"Cansaço na terceira semana não significa que não está funcionando. Significa que está.",
"Carga é dado, não ego. Anotar 20 kg hoje é o que permite ver 40 kg em março.",
"Ninguém na academia às 5h está olhando pra você. Metade ainda está dormindo em pé.",
"Proteína e sono fazem mais pelo seu resultado que qualquer suplemento que você possa comprar.",
"Você já perdeu 45 kg uma vez. Não foi sorte, foi você. O que faltou foi o registro que te avisasse quando começou a voltar. Agora tem.",
"Um dia de 4.000 kcal numa semana de 2.000 ainda é déficit. Um dia ruim não desfaz uma semana.",
"Furou uma refeição? A próxima é normal. Não compensa pulando, não treina dobrado.",
"Regra nº 1: zero bebida com açúcar. Se você cumprir uma regra só, que seja esta."
];

const HABITS = [
 ["treino","Treinei às 5h"],["acucar","Zero bebida com açúcar"],["proteina","Proteína em toda refeição"],
 ["caminhada","30 min de caminhada"],["agua","3 litros de água"],["sono","Dormi às 22:00"]
];
// Suplementos base (checklist diário). preço 1-4 ($), ajuda 1-5
const SUPP_BASE = [
 ["metformina","Metformina","Com a refeição. Prescrição médica."],
 ["creatina","Creatina 5 g","Todo dia, inclusive sem treino."],
 ["d3","Vitamina D3","Com refeição gordurosa."],
 ["psyllium","Psyllium","Antes da maior refeição, com bastante água."],
 ["omega3","Ômega 3 (DHA/EPA)","Anti-inflamatório articular para o ombro."],
 ["magnesio","Magnésio quelato","À noite, para relaxar e dormir."]
];
// Catálogo maior: tipo S=suplemento, M=prescrição para levar ao médico (sem dose)
const SUPP_CATALOG = [
 {n:"Psyllium",t:"S",price:1,help:4,why:"Saciedade e menor pico de glicose após a refeição. Beba bastante água.",risk:"Baixo. Gases no começo. Espace de outros remédios em 1–2 h."},
 {n:"Vitamina D3",t:"S",price:1,help:3,why:"Corrige deficiência comum em quem tem obesidade. Vale ver o nível no exame.",risk:"Baixo em dose normal."},
 {n:"Creatina 5 g",t:"S",price:1,help:4,why:"Mais força e massa magra preservada no déficit. Sobe o peso 1–2 kg de água no começo, não é gordura.",risk:"Baixo com boa hidratação."},
 {n:"Magnésio quelato",t:"S",price:1,help:3,why:"Sono e recuperação. Ajuda a regular o intestino.",risk:"Baixo. Pode soltar o intestino em dose alta."},
 {n:"Cafeína pré-treino (100–200 mg)",t:"S",price:1,help:3,why:"Mais energia às 5h e um pouco de gasto extra. Não tome depois do meio-dia.",risk:"Médio: pressão, ansiedade, sono. Evite se tiver pressão alta."},
 {n:"Eletrólitos no cardio (sal, potássio)",t:"S",price:1,help:2,why:"Evita câimbra e queda de rendimento com suor intenso em Salvador.",risk:"Baixo, exceto com pressão alta ou problema renal."},
 {n:"Albumina em pó",t:"S",price:2,help:4,why:"Proteína prática e barata sem whey. Ajuda a bater os 170 g.",risk:"Baixo. Confira a marca."},
 {n:"Ômega 3 (EPA/DHA)",t:"S",price:2,help:3,why:"Anti-inflamatório para o ombro e triglicerídeos altos.",risk:"Baixo. Pode dar refluxo com gosto de peixe."},
 {n:"Vitamina B12 (checar no exame)",t:"S",price:2,help:3,why:"Metformina por muito tempo pode baixar a B12 e causar cansaço. Peça a dosagem.",risk:"Baixo."},
 {n:"Berberina",t:"S",price:2,help:3,why:"Pode reduzir a glicemia de forma modesta.",risk:"Médio: soma efeito com a metformina (hipoglicemia, intestino). Só com o médico."},
 {n:"Chá verde / EGCG",t:"S",price:2,help:1,why:"Efeito pequeno no peso.",risk:"Atenção: extratos concentrados podem sobrecarregar o fígado. Com suspeita de esteatose, evite."},
 {n:"Cromo picolinato",t:"S",price:2,help:1,why:"Evidência fraca para glicemia.",risk:"Baixo, mas custo-benefício ruim."},
 {n:"Metformina: ajuste de dose / liberação prolongada",t:"M",price:1,help:4,why:"Já é a base do controle glicêmico. Pergunte se a versão XR ou outro ajuste reduz o desconforto e melhora a resposta.",risk:"Intestino, B12 baixa. O médico define."},
 {n:"Topiramato",t:"M",price:1,help:3,why:"Reduz apetite em alguns pacientes (uso off-label).",risk:"Médio: formigamento, lentidão mental, sonolência. Não usar na gravidez."},
 {n:"Bupropiona + naltrexona (combinação)",t:"M",price:3,help:4,why:"Atua no apetite e na compulsão por comida. Costuma ser manipulada no Brasil.",risk:"Médio: náusea, insônia, pressão. Contraindicada com histórico de convulsão."},
 {n:"Sibutramina",t:"M",price:2,help:3,why:"Reduz apetite. Uso controlado por receita especial no Brasil.",risk:"Alto: aumenta pressão e frequência cardíaca. Exige avaliação cardiovascular antes."},
 {n:"Orlistate",t:"M",price:3,help:2,why:"Bloqueia parte da gordura da dieta. Efeito modesto.",risk:"Médio: diarreia oleosa e vazamento fecal se comer gordura. Pede polivitamínico."}
];
const MILESTONES = [
 {id:1,nm:"Marco 1",lbl:s=>`Peso inicial − 5 kg (${(s-5).toFixed(0)} kg)`,test:(s,w)=>w<=s-5,txt:"Primeiros 5 kg. A maioria é água, não confie ainda."},
 {id:2,nm:"Marco 2",lbl:s=>`Peso inicial − 10 kg (${(s-10).toFixed(0)} kg)`,test:(s,w)=>w<=s-10,txt:"As roupas começam a mudar visivelmente."},
 {id:3,nm:"Marco 3",lbl:()=>"Abaixo de 130 kg",test:(s,w)=>w<130,txt:"Joelhos e lombar agradecem."},
 {id:4,nm:"Marco 4",lbl:()=>"Abaixo de 120 kg",test:(s,w)=>w<120,txt:"O pescoço costuma clarear de vez."},
 {id:5,nm:"Marco 5",lbl:()=>"Abaixo de 110 kg",test:(s,w)=>w<110,txt:"Fôlego e mobilidade em outro patamar."},
 {id:6,nm:"Meta final",lbl:()=>"105 kg",test:(s,w)=>w<=105,txt:"Onde você já esteve. Desta vez com os dados para não devolver."}
];
const STREET = [
 {t:"Restaurante por quilo",ok:{d:"Prato montado: metade salada e legumes, 1 proteína grelhada (150 g), 3 colheres de feijão, 2 de arroz. ≈ 650 kcal / 45 g prot.",k:650,p:45},bad:{d:"Frituras, macarrão, farofa, feijoada e sobremesa. ≈ 1.300 kcal / 40 g prot.",k:1300,p:40}},
 {t:"Padaria",ok:{d:"Tapioca com frango e queijo + café sem açúcar. ≈ 380 kcal / 28 g prot.",k:380,p:28},bad:{d:"Pão na chapa com manteiga + pingado com açúcar. ≈ 450 kcal / 12 g prot.",k:450,p:12}},
 {t:"Churrasco",ok:{d:"Carne magra (alcatra, frango, coração) à vontade + salada. ≈ 700 kcal / 65 g prot.",k:700,p:65},bad:{d:"Linguiça, farofa, vinagrete, pão de alho e cerveja. ≈ 1.500 kcal / 50 g prot.",k:1500,p:50}},
 {t:"Fast-food",ok:{d:"Sanduíche avulso (sem queijo extra, sem molho) + refri zero. ≈ 500 kcal / 30 g prot.",k:500,p:30},bad:{d:"Combo grande com batata e refri. ≈ 1.300 kcal / 30 g prot.",k:1300,p:30}},
 {t:"Japonês",ok:{d:"Sashimi + 2 hot rolls + missô. ≈ 450 kcal / 40 g prot.",k:450,p:40},bad:{d:"Rodízio com hot roll frito e cream cheese. ≈ 1.800 kcal / 45 g prot.",k:1800,p:45}},
 {t:"Pizzaria",ok:{d:"3 fatias decididas antes de sentar + salada. ≈ 800 kcal / 33 g prot.",k:800,p:33},bad:{d:"Meia pizza + refri. ≈ 1.600 kcal / 55 g prot.",k:1600,p:55}},
 {t:"Trabalho",ok:{d:"Marmita de casa: proteína, arroz, feijão, legumes. ≈ 600 kcal / 45 g prot.",k:600,p:45},bad:{d:"Salgado + refrigerante. ≈ 550 kcal / 10 g prot.",k:550,p:10}}
];
const ABSENCE = [
 {min:8,txt:"Da última vez, a recuperação dos 45 kg começou exatamente assim: com uma pausa que virou semana. Volte pelo menor degrau possível: só não beber açúcar. Só isso."},
 {min:4,txt:"Pausa reconhecida, sem drama. Hoje faz só uma coisa: vai à academia e faz metade do treino."},
 {min:2,txt:"Marca o hábito mais fácil de hoje e a roda volta a girar."}
];
const INCS_TXT = "Perna: +10 kg. Extensora/Flexora/Abdutora: +5 kg. Elevação lateral, rosca inversa, face pull: +1 kg. Restante: +2,5 kg.";
