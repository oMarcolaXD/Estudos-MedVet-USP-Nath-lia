import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, ClipboardList, Shield, ChevronRight, Check, Flame, Star, Trophy, Zap } from 'lucide-react';
import { useEffect } from 'react';
import Simba from '../components/Simba';

const BADGES: Record<string, { label: string; icon: string }> = {
  primeiro_simulado: { label: 'Primeiro simulado', icon: '🏆' },
  dez_simulados: { label: '10 simulados', icon: '🎯' },
  semana_completa: { label: '7 dias seguidos', icon: '🔥' },
  mes_completo: { label: '30 dias seguidos', icon: '⚡' },
  '100xp': { label: '100 XP', icon: '⭐' },
  '500xp': { label: '500 XP', icon: '💎' },
};

export default function Dashboard() {
  const { state, conteudo, reviewCardIds, temaDoDia, iniciarSessao, marcarEtapa } = useApp();
  const navigate = useNavigate();

  const hoje = new Date().toISOString().slice(0, 10);
  const sessaoHoje = state.sessaoDia?.data === hoje ? state.sessaoDia : null;

  useEffect(() => {
    iniciarSessao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tema = conteudo.temas.find((t) => t.id === temaDoDia) ?? conteudo.temas[0];
  const { streak, xp, escudoDisponivel, badges } = state.gamificacao;

  const todasQuestoes = [...conteudo.questoes, ...state.questoesIA];
  const questoesTema = todasQuestoes.filter((q) => q.temaId === tema.id);
  const cardsHoje = reviewCardIds.length;

  const etapaResumoConcluida = sessaoHoje?.etapas.resumo ?? false;
  const etapaFlashcardsConcluida = sessaoHoje?.etapas.flashcards ?? false;
  const etapaSimuladoConcluida = sessaoHoje?.etapas.simulado ?? false;
  const totalEtapas = [etapaResumoConcluida, etapaFlashcardsConcluida, etapaSimuladoConcluida].filter(Boolean).length;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const simbaHumor =
    totalEtapas === 3 ? 'excited' : streak >= 7 ? 'happy' : streak === 0 ? 'neutral' : 'happy';

  function irParaResumo() {
    marcarEtapa('resumo', 10);
    navigate(`/resumos?temaId=${tema.id}`);
  }

  function irParaFlashcards() {
    marcarEtapa('flashcards', 20);
    navigate('/flashcards');
  }

  function irParaSimulado() {
    marcarEtapa('simulado', 30);
    navigate(`/simulados?temaId=${tema.id}&mini=true`);
  }

  const sessaoConcluida = totalEtapas === 3;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">

      {/* ── Hero card com gradiente ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ background: sessaoConcluida
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />

        <div className="relative flex items-end px-5 pt-6 pb-0">
          {/* Texto */}
          <div className="flex-1 pb-6">
            {/* Pills de streak e XP */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Flame size={14} className="text-orange-200" />
                <span className="text-sm font-extrabold text-white">{streak}</span>
                <span className="text-xs text-white/70">dias</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star size={13} className="text-yellow-200" />
                <span className="text-sm font-extrabold text-white">{xp} XP</span>
              </div>
              {escudoDisponivel && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                  <Shield size={13} className="text-blue-200" />
                </div>
              )}
              {badges.length > 0 && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                  <Trophy size={13} className="text-yellow-200" />
                  <span className="text-xs font-bold text-white">{badges.length}</span>
                </div>
              )}
            </div>

            <p className="text-white/80 text-xs font-medium mb-0.5">
              {sessaoConcluida ? '🎉 Sessão concluída!' : saudacao}
            </p>
            <p className="text-white font-extrabold text-2xl leading-tight">
              {sessaoConcluida ? 'Incrível, Nathalia!' : 'Nathalia! 🐾'}
            </p>
            <p className="text-white/70 text-sm mt-1.5">
              {sessaoConcluida
                ? 'O Simba está orgulhoso de você!'
                : totalEtapas > 0
                ? `${totalEtapas} de 3 etapas feitas`
                : 'Vamos estudar hoje?'}
            </p>
          </div>

          {/* Simba — encostado na borda inferior */}
          <div className="shrink-0 self-end">
            <Simba mood={simbaHumor} size={130} />
          </div>
        </div>
      </div>

      {/* ── Progresso da sessão ── */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Tema de hoje
            </p>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
              sessaoConcluida
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
            }`}>
              {totalEtapas}/3 etapas
            </span>
          </div>
          <p className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">
            {tema.nome}
          </p>

          {/* Barra de progresso */}
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${(totalEtapas / 3) * 100}%`,
                background: sessaoConcluida
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #059669, #34d399)',
              }}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Etapas */}
        <div className="p-3 space-y-2">
          <Etapa
            numero={1}
            icone={<BookOpen size={18} />}
            cor="emerald"
            titulo="Resumo & Referências"
            descricao="Leia o resumo do tema e as fontes"
            xp={10}
            concluida={etapaResumoConcluida}
            onClick={irParaResumo}
          />
          <Etapa
            numero={2}
            icone={<Brain size={18} />}
            cor="blue"
            titulo="Flashcards"
            descricao={cardsHoje > 0 ? `${cardsHoje} para revisar hoje` : 'Revisar cartões do tema'}
            xp={20}
            concluida={etapaFlashcardsConcluida}
            onClick={irParaFlashcards}
          />
          <Etapa
            numero={3}
            icone={<ClipboardList size={18} />}
            cor="orange"
            titulo="Mini simulado"
            descricao={`10 questões · ${questoesTema.length} disponíveis`}
            xp={30}
            concluida={etapaSimuladoConcluida}
            onClick={irParaSimulado}
          />
        </div>
      </div>

      {/* ── Simulado completo ── */}
      <button
        onClick={() => navigate('/simulados')}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all active:scale-95"
      >
        <Zap size={16} />
        Simulado completo · 40 questões
      </button>

      {/* ── Badges conquistadas ── */}
      {badges.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Conquistas</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const badge = BADGES[b];
              if (!badge) return null;
              return (
                <div
                  key={b}
                  className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl px-3 py-1.5"
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const COR_CONFIG = {
  emerald: {
    bg: 'bg-emerald-500',
    light: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500',
    xp: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-500',
    light: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
    xp: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  },
  orange: {
    bg: 'bg-orange-500',
    light: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500',
    xp: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  },
};

function Etapa({
  numero, icone, cor, titulo, descricao, xp, concluida, onClick,
}: {
  numero: number;
  icone: React.ReactNode;
  cor: keyof typeof COR_CONFIG;
  titulo: string;
  descricao: string;
  xp: number;
  concluida: boolean;
  onClick: () => void;
}) {
  const c = COR_CONFIG[cor];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98] ${
        concluida ? `${c.light} opacity-70` : 'bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {/* Círculo numerado / check */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          concluida ? `${c.bg} text-white` : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600'
        }`}
      >
        {concluida ? (
          <Check size={16} strokeWidth={3} />
        ) : (
          <span className={`text-xs font-extrabold ${c.text}`}>{numero}</span>
        )}
      </div>

      {/* Ícone */}
      <div className={`shrink-0 ${concluida ? 'opacity-40' : c.icon}`}>
        {icone}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-snug ${
          concluida ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'
        }`}>
          {titulo}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{descricao}</p>
      </div>

      {/* XP pill + seta */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!concluida && (
          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${c.xp}`}>
            +{xp}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
      </div>
    </button>
  );
}
