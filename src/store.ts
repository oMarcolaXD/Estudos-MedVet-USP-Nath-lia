import { AppState, CardState, SimuladoHistorico, Questao, Flashcard, Dissertativa, Tema, Gamificacao, SessaoDia } from './types';

const STORAGE_KEY = 'residencia_vet_usp_v1';

const defaultGamificacao: Gamificacao = {
  streak: 0,
  ultimoEstudo: '',
  escudoDisponivel: true,
  ultimoEscudoUsado: '',
  xp: 0,
  badges: [],
  ultimoTemaId: '',
};

const defaultState: AppState = {
  cardStates: {},
  simulados: [],
  questoesIA: [],
  flashcardsIA: [],
  dissertativasIA: [],
  anotacoes: {},
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
  modelId: 'claude-sonnet-4-6',
  darkMode: false,
  sessaoDia: null,
  gamificacao: defaultGamificacao,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_residencia_vet_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve({ ...defaultState, ...data });
      } catch {
        reject(new Error('Arquivo inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

// SM-2 algorithm
export function sm2(
  state: CardState | undefined,
  grade: number // 0=Errei, 1=Difícil, 2=Bom, 3=Fácil
): CardState {
  const ef = state?.easeFactor ?? 2.5;
  const reps = state?.repetitions ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  let newEF = ef + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newReps: number;

  if (grade === 0) {
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = reps + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round((state?.interval ?? 6) * newEF);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    flashcardId: state?.flashcardId ?? '',
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReview: nextDate.toISOString().slice(0, 10),
    lastReview: today,
  };
}

export function updateCardState(
  appState: AppState,
  flashcardId: string,
  grade: number
): AppState {
  const current = appState.cardStates[flashcardId];
  const updated = sm2(current, grade);
  updated.flashcardId = flashcardId;
  return {
    ...appState,
    cardStates: { ...appState.cardStates, [flashcardId]: updated },
  };
}

export function addSimulado(appState: AppState, simulado: SimuladoHistorico): AppState {
  return { ...appState, simulados: [simulado, ...appState.simulados] };
}

export function addQuestoesIA(appState: AppState, questoes: Questao[]): AppState {
  return { ...appState, questoesIA: [...appState.questoesIA, ...questoes] };
}

export function addFlashcardsIA(appState: AppState, cards: Flashcard[]): AppState {
  return { ...appState, flashcardsIA: [...appState.flashcardsIA, ...cards] };
}

export function addDissertativasIA(appState: AppState, items: Dissertativa[]): AppState {
  return { ...appState, dissertativasIA: [...appState.dissertativasIA, ...items] };
}

export function updateAnotacao(appState: AppState, temaId: string, texto: string): AppState {
  return { ...appState, anotacoes: { ...appState.anotacoes, [temaId]: texto } };
}

export function cardsParaRevisarHoje(appState: AppState): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return Object.values(appState.cardStates)
    .filter((cs) => cs.nextReview <= today)
    .map((cs) => cs.flashcardId);
}

// Returns how many days ago a date string was (negative = future)
function diasAtras(dateStr: string): number {
  if (!dateStr) return Infinity;
  const today = new Date().toISOString().slice(0, 10);
  const diffMs = new Date(today).getTime() - new Date(dateStr).getTime();
  return Math.round(diffMs / 86400000);
}

export function calcularTemaDoDia(
  state: AppState,
  temas: Tema[],
  todasQuestoes: Questao[]
): string {
  const hoje = new Date().toISOString().slice(0, 10);

  if (state.sessaoDia?.data === hoje) return state.sessaoDia.temaId;

  const acertosPorTema = temas.map((tema) => {
    const questoesTema = todasQuestoes.filter((q) => q.temaId === tema.id);
    let acertos = 0;
    let respondidas = 0;
    state.simulados.forEach((sim) => {
      questoesTema.forEach((q) => {
        if (q.id in sim.respostas) {
          respondidas++;
          if (sim.respostas[q.id] === q.correta) acertos++;
        }
      });
    });
    return { temaId: tema.id, pct: respondidas > 0 ? acertos / respondidas : -1, respondidas };
  });

  const semHistorico = acertosPorTema.every((t) => t.respondidas === 0);

  if (semHistorico) {
    const ultimoIdx = temas.findIndex((t) => t.id === state.gamificacao.ultimoTemaId);
    const nextIdx = ultimoIdx < 0 ? 0 : (ultimoIdx + 1) % temas.length;
    return temas[nextIdx].id;
  }

  const candidatos = acertosPorTema
    .filter((t) => t.temaId !== state.gamificacao.ultimoTemaId)
    .sort((a, b) => {
      if (a.pct === -1 && b.pct === -1) return 0;
      if (a.pct === -1) return -1;
      if (b.pct === -1) return 1;
      return a.pct - b.pct;
    });

  const pioresThree = candidatos.slice(0, 3);
  const idx = state.simulados.length % Math.max(pioresThree.length, 1);
  return pioresThree[idx]?.temaId ?? temas[0].id;
}

export function iniciarSessaoDia(state: AppState, temaId: string): AppState {
  const hoje = new Date().toISOString().slice(0, 10);

  if (state.sessaoDia?.data === hoje) return state;

  const novaSessao: SessaoDia = {
    data: hoje,
    temaId,
    etapas: { resumo: false, flashcards: false, simulado: false },
  };

  const gam = { ...state.gamificacao };
  const diasUltimoEstudo = diasAtras(gam.ultimoEstudo);

  // Regenera escudo a cada 7 dias
  if (gam.ultimoEscudoUsado && diasAtras(gam.ultimoEscudoUsado) >= 7) {
    gam.escudoDisponivel = true;
  }

  if (diasUltimoEstudo === 0) {
    // Já estudou hoje — não muda streak
  } else if (diasUltimoEstudo === 1) {
    gam.streak += 1;
  } else if (diasUltimoEstudo > 1) {
    if (gam.escudoDisponivel) {
      gam.escudoDisponivel = false;
      gam.ultimoEscudoUsado = hoje;
    } else {
      gam.streak = 1;
    }
  } else {
    gam.streak = 1;
  }

  gam.ultimoEstudo = hoje;
  gam.ultimoTemaId = temaId;

  return { ...state, sessaoDia: novaSessao, gamificacao: gam };
}

export function concluirEtapa(
  state: AppState,
  etapa: keyof SessaoDia['etapas'],
  xpGanho: number
): AppState {
  if (!state.sessaoDia) return state;

  const hoje = new Date().toISOString().slice(0, 10);
  if (state.sessaoDia.data !== hoje) return state;

  const novaSessao: SessaoDia = {
    ...state.sessaoDia,
    etapas: { ...state.sessaoDia.etapas, [etapa]: true },
  };

  const novoXp = state.gamificacao.xp + xpGanho;
  const badges = verificarBadges(state.gamificacao.badges, {
    ...state.gamificacao,
    xp: novoXp,
  }, state);

  return {
    ...state,
    sessaoDia: novaSessao,
    gamificacao: { ...state.gamificacao, xp: novoXp, badges },
  };
}

function verificarBadges(badges: string[], gam: Gamificacao, state: AppState): string[] {
  const novo = new Set(badges);

  if (state.simulados.length === 0 && !novo.has('primeiro_simulado')) {
    // Will be unlocked after first simulado
  }
  if (gam.streak >= 7 && !novo.has('semana_completa')) novo.add('semana_completa');
  if (gam.streak >= 30 && !novo.has('mes_completo')) novo.add('mes_completo');
  if (gam.xp >= 100 && !novo.has('100xp')) novo.add('100xp');
  if (gam.xp >= 500 && !novo.has('500xp')) novo.add('500xp');

  return [...novo];
}

export function registrarBadgeSimulado(state: AppState): AppState {
  const badges = new Set(state.gamificacao.badges);
  if (state.simulados.length >= 1) badges.add('primeiro_simulado');
  if (state.simulados.length >= 10) badges.add('dez_simulados');
  return { ...state, gamificacao: { ...state.gamificacao, badges: [...badges] } };
}
