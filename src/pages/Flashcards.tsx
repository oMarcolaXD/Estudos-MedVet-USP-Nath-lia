import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { Flashcard } from '../types';
import { Brain, RotateCcw, Check, X, ChevronUp, Sparkles } from 'lucide-react';
import GerarIA from '../components/GerarIA';

const GRADES = [
  { label: 'Errei', value: 0, cls: 'bg-red-500 hover:bg-red-600', icon: X },
  { label: 'Difícil', value: 1, cls: 'bg-orange-500 hover:bg-orange-600', icon: RotateCcw },
  { label: 'Bom', value: 2, cls: 'bg-blue-500 hover:bg-blue-600', icon: Check },
  { label: 'Fácil', value: 3, cls: 'bg-green-500 hover:bg-green-600', icon: ChevronUp },
];

export default function Flashcards() {
  const { conteudo, state, reviewCardIds, revisarCard } = useApp();
  const [modo, setModo] = useState<'revisar' | 'todos'>('revisar');
  const [temaSelecionado, setTemaSelecionado] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [idx, setIdx] = useState(0);
  const [gerarModal, setGerarModal] = useState(false);
  const [done, setDone] = useState(false);

  const todosCards: Flashcard[] = useMemo(
    () => [...conteudo.flashcards, ...state.flashcardsIA],
    [conteudo.flashcards, state.flashcardsIA]
  );

  const fila: Flashcard[] = useMemo(() => {
    if (modo === 'revisar') {
      return todosCards.filter((fc) => reviewCardIds.includes(fc.id));
    }
    return temaSelecionado
      ? todosCards.filter((fc) => fc.temaId === temaSelecionado)
      : todosCards;
  }, [modo, temaSelecionado, todosCards, reviewCardIds]);

  const card = fila[idx];

  function avancar(grade: number) {
    if (!card) return;
    revisarCard(card.id, grade);
    setFlipped(false);
    if (idx + 1 >= fila.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  function reiniciar() {
    setIdx(0);
    setFlipped(false);
    setDone(false);
  }

  const temaAtual = card ? conteudo.temas.find((t) => t.id === card.temaId) : null;
  const gerarTema = temaSelecionado
    ? conteudo.temas.find((t) => t.id === temaSelecionado)
    : conteudo.temas[0];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {gerarModal && gerarTema && (
        <GerarIA tema={gerarTema} onClose={() => setGerarModal(false)} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {todosCards.length} cartões · {reviewCardIds.length} para revisar hoje
          </p>
        </div>
        <button
          onClick={() => setGerarModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Sparkles size={14} />
          Gerar com IA
        </button>
      </div>

      {/* Controles */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
          <button
            onClick={() => { setModo('revisar'); reiniciar(); }}
            className={`px-3 py-1.5 transition-colors ${modo === 'revisar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Revisar hoje ({reviewCardIds.length})
          </button>
          <button
            onClick={() => { setModo('todos'); reiniciar(); }}
            className={`px-3 py-1.5 transition-colors ${modo === 'todos' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Todos
          </button>
        </div>

        {modo === 'todos' && (
          <select
            value={temaSelecionado}
            onChange={(e) => { setTemaSelecionado(e.target.value); reiniciar(); }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900"
          >
            <option value="">Todos os temas</option>
            {conteudo.temas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* Cartão */}
      {fila.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <Brain size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">
            {modo === 'revisar' ? 'Nenhum cartão para revisar hoje! 🎉' : 'Nenhum cartão neste filtro.'}
          </p>
        </div>
      ) : done ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center space-y-3">
          <p className="text-2xl">🎉</p>
          <p className="font-semibold">Sessão concluída!</p>
          <p className="text-sm text-gray-500">{fila.length} cartão(ões) revisado(s)</p>
          <button onClick={reiniciar} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Reiniciar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{idx + 1} / {fila.length}</span>
            {temaAtual && <span>{temaAtual.nome}</span>}
          </div>

          {/* Card flip */}
          <div
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 min-h-[200px] cursor-pointer flex flex-col items-center justify-center text-center gap-4 select-none hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            onClick={() => setFlipped(!flipped)}
          >
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {flipped ? 'Verso (resposta)' : 'Frente — clique para revelar'}
            </p>
            <p className="text-base font-medium leading-relaxed">
              {flipped ? card.verso : card.frente}
            </p>
          </div>

          {/* Avaliação */}
          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map(({ label, value, cls, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => avancar(value)}
                  className={`${cls} text-white text-xs font-medium py-2 rounded-lg flex flex-col items-center gap-1 transition-colors`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
