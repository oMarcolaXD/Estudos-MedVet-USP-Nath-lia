import { useState } from 'react';
import { useApp } from '../context';
import { gerarQuestoes, gerarFlashcards, gerarDissertativa } from '../api';
import { Tema, Dificuldade } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

type Modo = 'questoes' | 'flashcards' | 'dissertativa';

interface Props {
  tema: Tema;
  onClose: () => void;
}

export default function GerarIA({ tema, onClose }: Props) {
  const { state, addQuestoes, addFlashcards, addDissertativas } = useApp();
  const [modo, setModo] = useState<Modo>('questoes');
  const [quantidade, setQuantidade] = useState(5);
  const [dificuldade, setDificuldade] = useState<Dificuldade>('media');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function gerar() {
    const chaveAtiva = state.provider === 'gemini' ? state.geminiApiKey : state.apiKey;
    if (!chaveAtiva) {
      const providerLabel = state.provider === 'gemini' ? 'Gemini' : 'Anthropic';
      setErro(`Configure a chave da API ${providerLabel} nas Configurações antes de gerar conteúdo.`);
      return;
    }
    setLoading(true);
    setErro('');
    setSucesso('');
    const baseParams = {
      provider: state.provider,
      apiKey: state.apiKey,
      geminiApiKey: state.geminiApiKey,
      modelId: state.modelId,
    };
    try {
      if (modo === 'questoes') {
        const questoes = await gerarQuestoes({
          ...baseParams,
          contexto: tema.contextoGeracao,
          temaId: tema.id,
          temaCategoria: tema.categoria,
          quantidade,
          dificuldade,
        });
        addQuestoes(questoes);
        setSucesso(`${questoes.length} questão(ões) adicionada(s) ao banco!`);
      } else if (modo === 'flashcards') {
        const cards = await gerarFlashcards({
          ...baseParams,
          contexto: tema.contextoGeracao,
          temaId: tema.id,
          quantidade,
        });
        addFlashcards(cards);
        setSucesso(`${cards.length} flashcard(s) adicionado(s)!`);
      } else {
        const diss = await gerarDissertativa({
          ...baseParams,
          contexto: tema.contextoGeracao,
          temaId: tema.id,
        });
        addDissertativas([diss]);
        setSucesso('Caso dissertativo gerado!');
      }
    } catch (e) {
      setErro((e as Error).message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          <h2 className="font-semibold">Gerar com IA</h2>
          <span className="text-sm text-gray-500 ml-1">— {tema.nome}</span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de conteúdo</label>
            <div className="flex gap-2">
              {(['questoes', 'flashcards', 'dissertativa'] as Modo[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModo(m)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                    modo === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {m === 'questoes' ? 'Questões' : m === 'flashcards' ? 'Flashcards' : 'Dissertativa'}
                </button>
              ))}
            </div>
          </div>

          {modo !== 'dissertativa' && (
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade: {quantidade}</label>
              <input
                type="range" min={1} max={10} value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {modo === 'questoes' && (
            <div>
              <label className="block text-sm font-medium mb-1">Dificuldade</label>
              <select
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value as Dificuldade)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
              >
                <option value="facil">Fácil</option>
                <option value="media">Média</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          )}

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
          {sucesso && <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={gerar}
            disabled={loading}
            className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Gerando...' : 'Gerar'}
          </button>
        </div>
      </div>
    </div>
  );
}
