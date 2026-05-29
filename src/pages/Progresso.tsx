import { useMemo } from 'react';
import { useApp } from '../context';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

export default function Progresso() {
  const { conteudo, state } = useApp();

  const todasQuestoes = useMemo(
    () => [...conteudo.questoes, ...state.questoesIA],
    [conteudo.questoes, state.questoesIA]
  );

  const acertosPorTema = useMemo(() => {
    return conteudo.temas.map((tema) => {
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
      const pct = respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0;
      return { nome: tema.nome.slice(0, 20), pct, respondidas };
    }).filter((d) => d.respondidas > 0);
  }, [conteudo.temas, todasQuestoes, state.simulados]);

  const evolucaoSimulados = useMemo(() => {
    return state.simulados
      .slice()
      .reverse()
      .slice(-15)
      .map((sim, i) => ({
        num: i + 1,
        nota: Number(sim.nota.toFixed(1)),
        data: new Date(sim.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }));
  }, [state.simulados]);

  const totalCards = conteudo.flashcards.length + state.flashcardsIA.length;
  const revisados = Object.keys(state.cardStates).length;

  if (state.simulados.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Progresso</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Faça simulados para ver seu progresso aqui.
        </p>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500">
          Sem dados ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Progresso</h1>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Simulados" value={state.simulados.length} />
        <Stat label="Flashcards revisados" value={`${revisados}/${totalCards}`} />
        <Stat
          label="Melhor nota"
          value={Math.max(...state.simulados.map((s) => s.nota)).toFixed(1)}
        />
      </div>

      {/* Evolução de notas */}
      {evolucaoSimulados.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold mb-4">Evolução das notas</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evolucaoSimulados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="nota" stroke="#2563eb" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Acertos por tema */}
      {acertosPorTema.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold mb-4">% Acertos por tema</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, acertosPorTema.length * 32)}>
            <BarChart data={acertosPorTema} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="nome" type="category" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="pct" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
