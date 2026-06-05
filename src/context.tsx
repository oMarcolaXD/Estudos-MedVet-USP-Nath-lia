import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState, Questao, Flashcard, Dissertativa, SimuladoHistorico, SessaoDia } from './types';
import {
  loadState, saveState, updateCardState, addSimulado,
  addQuestoesIA, addFlashcardsIA, addDissertativasIA, updateAnotacao, updateApostila,
  cardsParaRevisarHoje, calcularTemaDoDia, iniciarSessaoDia,
  concluirEtapa, registrarBadgeSimulado,
} from './store';
import conteudoRaw from './data/conteudo.json';
import { ConteudoData } from './types';

const conteudo = conteudoRaw as ConteudoData;

interface AppContextValue {
  state: AppState;
  conteudo: ConteudoData;
  reviewCardIds: string[];
  temaDoDia: string;
  revisarCard: (id: string, grade: number) => void;
  salvarSimulado: (s: SimuladoHistorico) => void;
  addQuestoes: (q: Questao[]) => void;
  addFlashcards: (f: Flashcard[]) => void;
  addDissertativas: (d: Dissertativa[]) => void;
  setAnotacao: (temaId: string, texto: string) => void;
  setApostila: (temaId: string, texto: string) => void;
  setApiKey: (key: string) => void;
  setModelId: (id: string) => void;
  setProvider: (p: 'anthropic' | 'gemini') => void;
  setGeminiApiKey: (key: string) => void;
  toggleDarkMode: () => void;
  exportar: () => void;
  importar: (s: AppState) => void;
  iniciarSessao: () => void;
  marcarEtapa: (etapa: keyof SessaoDia['etapas'], xp: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => fn(prev));
  }, []);

  const reviewCardIds = cardsParaRevisarHoje(state);
  const todasQuestoes = [...conteudo.questoes, ...state.questoesIA];
  const temaDoDia = calcularTemaDoDia(state, conteudo.temas, todasQuestoes);

  return (
    <AppContext.Provider value={{
      state,
      conteudo,
      reviewCardIds,
      temaDoDia,
      revisarCard: (id, grade) => update((s) => updateCardState(s, id, grade)),
      salvarSimulado: (s) => update((st) => registrarBadgeSimulado(addSimulado(st, s))),
      addQuestoes: (q) => update((s) => addQuestoesIA(s, q)),
      addFlashcards: (f) => update((s) => addFlashcardsIA(s, f)),
      addDissertativas: (d) => update((s) => addDissertativasIA(s, d)),
      setAnotacao: (temaId, texto) => update((s) => updateAnotacao(s, temaId, texto)),
      setApostila: (temaId, texto) => update((s) => updateApostila(s, temaId, texto)),
      setApiKey: (key) => update((s) => ({ ...s, apiKey: key })),
      setModelId: (id) => update((s) => ({ ...s, modelId: id })),
      setProvider: (p) => update((s) => ({ ...s, provider: p })),
      setGeminiApiKey: (key) => update((s) => ({ ...s, geminiApiKey: key })),
      toggleDarkMode: () => update((s) => ({ ...s, darkMode: !s.darkMode })),
      exportar: () => {
        import('./store').then(({ exportBackup }) => exportBackup(state));
      },
      importar: (s) => setState(s),
      iniciarSessao: () => update((s) => iniciarSessaoDia(s, calcularTemaDoDia(s, conteudo.temas, [...conteudo.questoes, ...s.questoesIA]))),
      marcarEtapa: (etapa, xp) => update((s) => concluirEtapa(s, etapa, xp)),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
