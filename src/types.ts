export type Categoria = 'geral' | 'interpretacao' | 'especifico';
export type Dificuldade = 'facil' | 'media' | 'dificil';
export type Origem = 'seed' | 'ia' | 'fuvest' | 'rp';

export interface Tema {
  id: string;
  nome: string;
  categoria: Categoria;
  bibliografia: string[];
  resumo: string;
  contextoGeracao: string;
}

export interface Flashcard {
  id: string;
  temaId: string;
  frente: string;
  verso: string;
  origem?: Origem;
}

export interface Questao {
  id: string;
  temaId: string;
  categoria: Categoria;
  enunciado: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
  dificuldade: Dificuldade;
  origem?: Origem;
  anoFuvest?: number;
  imagem?: string;
}

export interface Dissertativa {
  id: string;
  temaId: string;
  caso: string;
  pontosEsperados: string[];
  comentario: string;
  origem?: Origem;
}

export interface Meta {
  titulo: string;
  fonte: string;
  observacao: string;
  estruturaProvaP1: {
    conhecimentosGerais: number;
    interpretacaoTexto: number;
    especificas: number;
    total: number;
  };
  formulaNotaFinal: string;
  cortes: {
    P1_minimo: string;
    classificacao: string;
  };
}

export interface ConteudoData {
  meta: Meta;
  temas: Tema[];
  flashcards: Flashcard[];
  questoes: Questao[];
  dissertativas: Dissertativa[];
}

// SM-2 spaced repetition state per card
export interface CardState {
  flashcardId: string;
  easeFactor: number;  // starts at 2.5
  interval: number;    // days
  repetitions: number;
  nextReview: string;  // ISO date string
  lastReview?: string;
}

export interface SimuladoHistorico {
  id: string;
  data: string;
  tipo: 'completo' | 'tema';
  temas?: string[];
  questoesIds: string[];
  respostas: Record<string, number>;
  nota: number;
  tempoMinutos?: number;
}

export interface SessaoDia {
  data: string; // 'YYYY-MM-DD'
  temaId: string;
  etapas: {
    resumo: boolean;
    flashcards: boolean;
    simulado: boolean;
  };
}

export interface Gamificacao {
  streak: number;
  ultimoEstudo: string; // 'YYYY-MM-DD'
  escudoDisponivel: boolean;
  ultimoEscudoUsado: string; // 'YYYY-MM-DD'
  xp: number;
  badges: string[];
  ultimoTemaId: string;
}

export interface AppState {
  cardStates: Record<string, CardState>;
  simulados: SimuladoHistorico[];
  questoesIA: Questao[];
  flashcardsIA: Flashcard[];
  dissertativasIA: Dissertativa[];
  anotacoes: Record<string, string>;
  apiKey: string;
  modelId: string;
  darkMode: boolean;
  sessaoDia: SessaoDia | null;
  gamificacao: Gamificacao;
}
