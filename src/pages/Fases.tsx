import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Lock, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

type FaseCor = 'emerald' | 'purple' | 'blue' | 'orange';

const FASES: { numero: 1 | 2 | 3 | 4; nome: string; cor: FaseCor; emoji: string }[] = [
  { numero: 1, nome: 'SUS e Políticas', cor: 'emerald', emoji: '🏥' },
  { numero: 2, nome: 'Ética e Leitura', cor: 'purple', emoji: '📖' },
  { numero: 3, nome: 'Clínica Veterinária', cor: 'blue', emoji: '🩺' },
  { numero: 4, nome: 'Especialidades', cor: 'orange', emoji: '⭐' },
];

const corMap: Record<FaseCor, { ativo: string; header: string; badge: string; progresso: string; btn: string }> = {
  emerald: {
    ativo: 'bg-emerald-600 border-emerald-600 text-white',
    header: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    progresso: 'bg-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  purple: {
    ativo: 'bg-purple-600 border-purple-600 text-white',
    header: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    progresso: 'bg-purple-500',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  blue: {
    ativo: 'bg-blue-600 border-blue-600 text-white',
    header: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    progresso: 'bg-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  orange: {
    ativo: 'bg-orange-500 border-orange-500 text-white',
    header: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    progresso: 'bg-orange-500',
    btn: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
};

function progressoTema(temaId: string, simulados: ReturnType<typeof useApp>['state']['simulados'], questoes: { id: string; temaId: string; correta: number }[]): number {
  const questoesTema = questoes.filter((q) => q.temaId === temaId);
  if (questoesTema.length === 0) return 0;
  let acertos = 0;
  let respondidas = 0;
  const respondidas_ids = new Set<string>();
  simulados.forEach((sim) => {
    questoesTema.forEach((q) => {
      if (q.id in sim.respostas && !respondidas_ids.has(q.id)) {
        respondidas_ids.add(q.id);
        respondidas++;
        if (sim.respostas[q.id] === q.correta) acertos++;
      }
    });
  });
  return respondidas === 0 ? 0 : Math.round((acertos / respondidas) * 100);
}

export default function Fases() {
  const { conteudo, state } = useApp();
  const navigate = useNavigate();

  const todasQuestoes = useMemo(
    () => [...conteudo.questoes, ...state.questoesIA],
    [conteudo.questoes, state.questoesIA]
  );

  const progressoPorFase = useMemo(() => {
    return FASES.map((fase) => {
      const temas = conteudo.temas.filter((t) => t.fase === fase.numero);
      const progs = temas.map((t) => progressoTema(t.id, state.simulados, todasQuestoes));
      const media = progs.length > 0 ? Math.round(progs.reduce((a, b) => a + b, 0) / progs.length) : 0;
      return { faseNumero: fase.numero, media, temas };
    });
  }, [conteudo.temas, state.simulados, todasQuestoes]);

  // Fase desbloqueada se for a 1, ou se a fase anterior tiver média ≥ 40%
  function faseBloqueada(numero: number): boolean {
    if (numero === 1) return false;
    const anterior = progressoPorFase.find((p) => p.faseNumero === numero - 1);
    return (anterior?.media ?? 0) < 40;
  }

  // Fase atual = menor fase desbloqueada com média < 80%
  const faseAtualNumero = useMemo(() => {
    for (const fase of FASES) {
      if (!faseBloqueada(fase.numero)) {
        const prog = progressoPorFase.find((p) => p.faseNumero === fase.numero);
        if ((prog?.media ?? 0) < 80) return fase.numero;
      }
    }
    return FASES[FASES.length - 1].numero;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressoPorFase]);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Trilha de Estudos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete cada fase para desbloquear a próxima</p>
      </div>

      {FASES.map((fase, idx) => {
        const bloqueada = faseBloqueada(fase.numero);
        const prog = progressoPorFase[idx];
        const cores = corMap[fase.cor];
        const atual = fase.numero === faseAtualNumero;

        return (
          <div
            key={fase.numero}
            className={`rounded-2xl border overflow-hidden transition-all ${
              bloqueada
                ? 'opacity-50 border-gray-200 dark:border-gray-700'
                : `border-2 ${atual ? `border-${fase.cor}-400 dark:border-${fase.cor}-600 shadow-md` : 'border-gray-200 dark:border-gray-700'}`
            }`}
          >
            {/* Header da fase */}
            <div className={`p-4 ${bloqueada ? 'bg-gray-100 dark:bg-gray-800' : cores.header}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${bloqueada ? 'bg-gray-200 dark:bg-gray-700' : cores.ativo}`}>
                    {bloqueada ? <Lock size={16} /> : fase.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fase {fase.numero}</span>
                      {atual && !bloqueada && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cores.badge}`}>
                          Atual
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-sm">{fase.nome}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold">{prog.media}%</span>
                  <p className="text-[10px] text-gray-400">acertos</p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${bloqueada ? 'bg-gray-400' : cores.progresso}`}
                  style={{ width: `${prog.media}%` }}
                />
              </div>
            </div>

            {/* Temas da fase */}
            {!bloqueada && (
              <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {prog.temas.map((tema) => {
                  const pTema = progressoTema(tema.id, state.simulados, todasQuestoes);
                  return (
                    <button
                      key={tema.id}
                      onClick={() => navigate(`/resumos`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {pTema >= 70 ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : pTema > 0 ? (
                          <Circle size={16} className="text-blue-400 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
                        )}
                        <span className="text-sm truncate">{tema.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pTema > 0 && (
                          <span className="text-xs text-gray-400">{pTema}%</span>
                        )}
                        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    </button>
                  );
                })}

                <div className="p-3">
                  <button
                    onClick={() => navigate('/simulados')}
                    className={`w-full py-2 text-sm rounded-xl font-medium transition-colors ${cores.btn}`}
                  >
                    Praticar questões desta fase
                  </button>
                </div>
              </div>
            )}

            {bloqueada && (
              <div className="bg-white dark:bg-gray-900 px-4 py-3">
                <p className="text-xs text-gray-400 text-center">
                  Complete a Fase {fase.numero - 1} com pelo menos 40% de acertos para desbloquear
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
