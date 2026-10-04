/* ============ SINAIS: alertas para o card Agora (ausência, dor, deload, perfil, nuvem, backup, pesagem) ============ */
function candSignals(k) {
  const out = [],
    abs = daysAbsent(),
    ab = ABSENCE.find(a => abs >= a.min),
    pa = painAvg();
  if (ab)
    out.push(
      cand("abs", 95, "Bem-vindo de volta", `${abs} dias sem registro`, ab.txt, "habit", "Marcar a Regra nº 1", {
        id: S.settings.rule1
      })
    );
  if (pa !== null && pa >= 4)
    out.push(
      cand(
        "pain",
        45,
        "Ombro",
        "Dor em alta",
        `Média das 3 últimas: ${fmtN(pa)}/10. Procure um fisioterapeuta antes de aumentar carga de empurrar.`,
        "go",
        "Ver treino",
        { tab: "treino" }
      )
    );
  if (deloadSignal())
    out.push(
      cand(
        "deload",
        44,
        "Treino",
        "Sinal de deload",
        "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie.",
        "go",
        "Ver treino",
        { tab: "treino" }
      )
    );
  if (S.profile.todo)
    out.push(
      cand(
        "setup",
        99,
        "Bem-vindo",
        "Complete seu perfil",
        "Nome, sexo, peso, meta, altura e idade: o app usa para calcular suas metas.",
        "profile-setup",
        "Completar"
      )
    );
  if (SEC.ghConflict)
    out.push(
      cand(
        "cloud",
        90,
        "Nuvem",
        "Cópia automática parada",
        "A nuvem tem dados que este aparelho ainda não baixou. Escolha qual versão vale para não perder nada.",
        "cloud-resolve",
        "Escolher"
      )
    );
  if (backupDays() > 21)
    out.push(
      cand(
        "backup",
        35,
        "Seus dados",
        "Backup atrasado",
        `${S.settings.lastBackup ? `Último backup há ${backupDays()} dias.` : "Você nunca exportou um backup."} O arquivo .json é o único que sobrevive à troca de celular.`,
        "export",
        "Exportar agora"
      )
    );
  if (parseKey(k).getDay() === 1 && !S.weights.some(w => w.d >= mondayOf(k)) && new Date().getHours() < 12)
    out.push(
      cand(
        "weigh",
        75,
        "Segunda-feira",
        "Dia de pesagem",
        "Ao acordar, depois do banheiro, antes de comer. Meça a cintura junto.",
        "weigh",
        "Registrar peso"
      )
    );
  return out;
}
