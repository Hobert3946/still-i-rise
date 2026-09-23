/* ============ CONTEÚDO: frases do dia e sugestões por refeição ============ */
const FRASES = [
  ["Você pode me pisotear na própria lama, mas, ainda assim, como a poeira, eu me levanto.", "Maya Angelou, Still I Rise"],
  ["Somos aquilo que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.", "Will Durant, sobre Aristóteles"],
  ["A gota d'água cava a pedra, não pela força, mas pela constância.", "Ovídio"],
  ["Água mole em pedra dura, tanto bate até que fura.", "Provérbio popular"],
  ["Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", "Sêneca"],
  ["Primeiro diga a si mesmo o que você quer ser; depois faça o que tem de fazer.", "Epicteto"],
  ["O que está no caminho torna-se o caminho.", "Marco Aurélio, Meditações"],
  ["Uma jornada de mil milhas começa com um único passo.", "Lao Tsé"],
  ["Tudo vale a pena se a alma não é pequena.", "Fernando Pessoa"],
  ["Disciplina é a ponte entre metas e realizações.", "Jim Rohn"],
  ["Não se trata de quão forte você bate, e sim de quão forte aguenta apanhar e continuar em frente.", "Rocky Balboa"],
  ["A força não vem da vitória. Suas lutas desenvolvem suas forças.", "Arnold Schwarzenegger"],
  ["Você pode não controlar tudo o que acontece com você, mas pode decidir não ser reduzido por isso.", "Maya Angelou"],
  ["Odiei cada minuto do treino, mas disse a mim mesmo: não desista. Sofra agora e viva o resto da vida como campeão.", "Muhammad Ali"]
];
// [refeição, dica, sugestões (nomes exatos da tabela)]
const MEALS = [
  ["Café da manhã", "Comece com proteína: ovos, iogurte, queijo.", ["Ovo de galinha cozido", "Omelete simples (2 ovos)", "Ovo mexido", "Crepioca (1 ovo + 2 col. goma)", "Tapioca (goma hidratada)", "Iogurte grego natural", "Queijo cottage", "Queijo minas frescal", "Pão de forma integral", "Aveia em flocos", "Banana prata", "Mamão papaia", "Albumina (pó)", "Café sem açúcar"]],
  ["Almoço", "Metade do prato de vegetais, uma palma de proteína.", ["Arroz branco cozido", "Arroz integral cozido", "Feijão carioca cozido", "Peito de frango grelhado", "Patinho grelhado", "Tilápia grelhada", "Carne moída refogada", "Alcatra grelhada", "Batata-doce cozida", "Brócolis cozido", "Salada de folhas com azeite", "Lentilha cozida", "Azeite de oliva"]],
  ["Lanche", "Proteína com fruta ou castanha. Zero açúcar.", ["Iogurte natural desnatado", "Iogurte grego natural", "Banana prata", "Maçã", "Castanha-do-pará", "Amendoim torrado", "Pasta de amendoim", "Queijo cottage", "Ovo de galinha cozido", "Atum em conserva (natural)", "Barra de proteína", "Albumina (pó)"]],
  ["Jantar", "Leve, com proteína. Termine 2 a 3 h antes de dormir.", ["Peito de frango grelhado", "Tilápia grelhada", "Salmão grelhado", "Patinho grelhado", "Omelete simples (2 ovos)", "Peito de frango cozido desfiado", "Batata-doce cozida", "Abobrinha cozida", "Brócolis cozido", "Couve refogada", "Salada de folhas com azeite", "Arroz branco cozido"]],
  ["Ceia", "Opcional e leve.", ["Iogurte natural desnatado", "Queijo cottage", "Leite desnatado", "Clara de ovo cozida", "Chá sem açúcar", "Mamão papaia", "Morango", "Albumina (pó)"]]
];
