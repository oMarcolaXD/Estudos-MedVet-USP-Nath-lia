import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context';
import { useSearchParams } from 'react-router-dom';
import { Questao, SimuladoHistorico } from '../types';
import { ClipboardList, Clock, Check, X, Sparkles } from 'lucide-react';
import GerarIA from '../components/GerarIA';

type Fase = 'config' | 'prova' | 'gabarito';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function calcularNota(questoes: Questao[], respostas: Record<string, number>): number {
  const total = questoes.length;
  if (total === 0) return 0;
  const acertos = questoes.filter((q) => respostas[q.id] === q.correta).length;
  return (acertos / total) * 10;
}

export default function Simulados() {
  const { conteudo, state, salvarSimulado } = useApp();
  const [searchParams] = useSearchParams();
  const [fase, setFase] = useState<Fase>('config');
  const [tipo, setTipo] = useState<'completo' | 'tema'>('completo');
  const [temasSel, setTemasSel] = useState<string[]>([]);
  const [qtd, setQtd] = useState(10);
  const [useTimer, setUseTimer] = useState(false);
  const [questoesProva, setQuestoesProva] = useState<Questao[]>([]);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(240 * 60);
  const [gerarModal, setGerarModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const temaId = searchParams.get('temaId');

  useEffect(() => {
    if (temaId) {
      setTipo('tema');
      setTemasSel([temaId]);
    }
  }, [temaId]);

  const todasQuestoes = useMemo(
    () => [...conteudo.questoes, ...state.questoesIA],
    [conteudo.questoes, state.questoesIA]
  );

  useEffect(() => {
    if (fase === 'prova' && useTimer) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            finalizarProva();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fase, useTimer]);

  function montarProva() {
    let selecionadas: Questao[] = [];

    if (tipo === 'completo') {
      const gerais = shuffle(todasQuestoes.filter((q) => q.categoria === 'geral')).slice(0, 8);
      const interp = shuffle(todasQuestoes.filter((q) => q.categoria === 'interpretacao')).slice(0, 7);
      const espec = shuffle(todasQuestoes.filter((q) => q.categoria === 'especifico')).slice(0, 25);
      selecionadas = shuffle([...gerais, ...interp, ...espec]);
    } else {
      const pool = todasQuestoes.filter((q) => temasSel.length === 0 || temasSel.includes(q.temaId));
      selecionadas = shuffle(pool).slice(0, qtd);
    }

    if (selecionadas.length === 0) {
      alert('Não há questões suficientes para este filtro. Gere mais questões com IA!');
      return;
    }

    setQuestoesProva(selecionadas);
    setRespostas({});
    setTimer(240 * 60);
    setFase('prova');
  }

  function finalizarProva() {
    if (timerRef.current) clearInterval(timerRef.current);
    const nota = calcularNota(questoesProva, respostas);
    const sim: SimuladoHistorico = {
      id: `sim_${Date.now()}`,
      data: new Date().toISOString(),
      tipo,
      temas: temasSel.length > 0 ? temasSel : undefined,
      questoesIds: questoesProva.map((q) => q.id),
      respostas,
      nota,
    };
    salvarSimulado(sim);
    setFase('gabarito');
  }

  const gerarTema = temasSel.length > 0
    ? conteudo.temas.find((t) => t.id === temasSel[0])
    : conteudo.temas[0];

  if (fase === 'config') {
    return (
      <div className="max-w-2xl space-y-5">
        {gerarModal && gerarTema && (
          <GerarIA tema={gerarTema} onClose={() => setGerarModal(false)} />
        )}
        <div>
          <h1 className="text-2xl font-bold">Simulados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure e faça uma prova</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de simulado</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTipo('completo')}
                className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${tipo === 'completo' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Completo (formato P1)
              </button>
              <button
                onClick={() => setTipo('tema')}
                className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${tipo === 'tema' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Por tema
              </button>
            </div>
          </div>

          {tipo === 'completo' && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
              8 conhecimentos gerais + 7 interpretação + 25 específicas = 40 questões
            </div>
          )}

          {tipo === 'tema' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Temas</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {conteudo.temas.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={temasSel.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTemasSel((prev) => [...prev, t.id]);
                          else setTemasSel((prev) => prev.filter((x) => x !== t.id));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{t.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantidade: {qtd}</label>
                <input type="range" min={5} max={40} value={qtd} onChange={(e) => setQtd(Number(e.target.value))} className="w-full" />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useTimer} onChange={(e) => setUseTimer(e.target.checked)} className="rounded" />
            <span className="text-sm">Timer de 4 horas</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={montarProva}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardList size={15} />
              Iniciar simulado
            </button>
            <button
              onClick={() => setGerarModal(true)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
            >
              <Sparkles size={15} />
              Gerar questões
            </button>
          </div>
        </div>

        {/* Histórico */}
        {state.simulados.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Histórico</h2>
            <div className="space-y-2">
              {state.simulados.slice(0, 10).map((sim) => {
                const acertos = sim.questoesIds.filter((id) => {
                  const q = todasQuestoes.find((q) => q.id === id);
                  return q && sim.respostas[id] === q.correta;
                }).length;
                return (
                  <div key={sim.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium">{sim.tipo === 'completo' ? 'Completo' : 'Por tema'}</p>
                      <p className="text-xs text-gray-500">{new Date(sim.data).toLocaleDateString('pt-BR')} · {acertos}/{sim.questoesIds.length} acertos</p>
                    </div>
                    <span className={`text-lg font-bold ${sim.nota >= 5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {sim.nota.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (fase === 'prova') {
    const totalRes = Object.keys(respostas).length;
    const mm = Math.floor(timer / 60).toString().padStart(2, '0');
    const ss = (timer % 60).toString().padStart(2, '0');

    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-950 py-2 z-10">
          <p className="text-sm text-gray-600 dark:text-gray-400">{totalRes}/{questoesProva.length} respondidas</p>
          {useTimer && (
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Clock size={14} />
              {mm}:{ss}
            </div>
          )}
          <button
            onClick={finalizarProva}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Finalizar
          </button>
        </div>

        <div className="space-y-5">
          {questoesProva.map((q, qi) => (
            <div key={q.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400 text-sm">{qi + 1}.</span>
                {q.origem === 'fuvest' && q.anoFuvest && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    FUVEST {q.anoFuvest}
                  </span>
                )}
                {q.origem === 'rp' && q.anoFuvest && (
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    RP {q.anoFuvest}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mb-3">{q.enunciado}</p>
              {q.imagem && (
                <img
                  src={q.imagem}
                  alt={`Imagem da questão ${qi + 1}`}
                  className="mb-3 max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              )}
              <div className="space-y-2">
                {q.alternativas.map((alt, ai) => (
                  <button
                    key={ai}
                    onClick={() => setRespostas((prev) => ({ ...prev, [q.id]: ai }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      respostas[q.id] === ai
                        ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={finalizarProva}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Finalizar simulado
        </button>
      </div>
    );
  }

  // Gabarito
  const nota = calcularNota(questoesProva, respostas);
  const acertos = questoesProva.filter((q) => respostas[q.id] === q.correta).length;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
        <p className="text-4xl font-bold mb-1" style={{ color: nota >= 5 ? '#16a34a' : '#dc2626' }}>
          {nota.toFixed(1)}
        </p>
        <p className="text-sm text-gray-500">{acertos}/{questoesProva.length} acertos</p>
        <p className={`text-sm font-medium mt-1 ${nota >= 3 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {nota >= 3 ? 'Aprovado na P1 ✓' : 'Abaixo do corte mínimo de 30%'}
        </p>
      </div>

      <div className="space-y-4">
        {questoesProva.map((q, qi) => {
          const resp = respostas[q.id];
          const acertou = resp === q.correta;
          return (
            <div key={q.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${acertou ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800'}`}>
              <div className="flex items-start gap-2 mb-3">
                {acertou ? <Check size={16} className="text-green-500 shrink-0 mt-0.5" /> : <X size={16} className="text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{qi + 1}.</span>
                    {q.origem === 'fuvest' && q.anoFuvest && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        FUVEST {q.anoFuvest}
                      </span>
                    )}
                    {q.origem === 'rp' && q.anoFuvest && (
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        RP {q.anoFuvest}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{q.enunciado}</p>
                  {q.imagem && (
                    <img
                      src={q.imagem}
                      alt={`Imagem da questão ${qi + 1}`}
                      className="mt-2 max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {q.alternativas.map((alt, ai) => (
                  <div
                    key={ai}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      ai === q.correta
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium'
                        : ai === resp && !acertou
                          ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 line-through'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {alt}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <span className="font-medium">Explicação: </span>{q.explicacao}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setFase('config')}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        Novo simulado
      </button>
    </div>
  );
}
