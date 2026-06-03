import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { Dissertativa as DissertativaType } from '../types';
import { PenLine, Eye, EyeOff, Sparkles } from 'lucide-react';
import GerarIA from '../components/GerarIA';

export default function Dissertativa() {
  const { conteudo, state } = useApp();
  const [temaSel, setTemaSel] = useState('');
  const [caso, setCaso] = useState<DissertativaType | null>(null);
  const [resposta, setResposta] = useState('');
  const [mostrarPontos, setMostrarPontos] = useState(false);
  const [gerarModal, setGerarModal] = useState(false);

  const todasDissertativas: DissertativaType[] = useMemo(
    () => [...conteudo.dissertativas, ...state.dissertativasIA],
    [conteudo.dissertativas, state.dissertativasIA]
  );

  const filtradas = temaSel
    ? todasDissertativas.filter((d) => d.temaId === temaSel)
    : todasDissertativas;

  const gerarTema = temaSel
    ? conteudo.temas.find((t) => t.id === temaSel)
    : conteudo.temas[0];

  function abrirCaso(d: DissertativaType) {
    setCaso(d);
    setResposta('');
    setMostrarPontos(false);
  }

  if (caso) {
    const temaObj = conteudo.temas.find((t) => t.id === caso.temaId);
    return (
      <div className="max-w-3xl space-y-4">
        <button onClick={() => setCaso(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Lista de casos
        </button>

        {temaObj && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{temaObj.nome}</p>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Caso clínico</h2>
            {caso.origem === 'rp' && caso.anoFuvest && (
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                RP {caso.anoFuvest} · Fase 2
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">{caso.caso}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sua resposta</label>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Escreva sua resposta dissertativa aqui..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-sm bg-white dark:bg-gray-900 min-h-[200px] resize-y"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{resposta.length} caracteres</p>
        </div>

        <button
          onClick={() => setMostrarPontos(!mostrarPontos)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {mostrarPontos ? <EyeOff size={15} /> : <Eye size={15} />}
          {mostrarPontos ? 'Ocultar gabarito' : 'Ver pontos esperados'}
        </button>

        {mostrarPontos && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold mb-3">Pontos esperados</h3>
              <ul className="space-y-2">
                {caso.pontosEsperados.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
              <h3 className="text-sm font-semibold mb-1 text-amber-800 dark:text-amber-200">Comentário do avaliador</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">{caso.comentario}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {gerarModal && gerarTema && (
        <GerarIA tema={gerarTema} onClose={() => setGerarModal(false)} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dissertativa (P2)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{todasDissertativas.length} casos disponíveis</p>
        </div>
        <button
          onClick={() => setGerarModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Sparkles size={14} />
          Gerar caso com IA
        </button>
      </div>

      <select
        value={temaSel}
        onChange={(e) => setTemaSel(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
      >
        <option value="">Todos os temas</option>
        {conteudo.temas.map((t) => (
          <option key={t.id} value={t.id}>{t.nome}</option>
        ))}
      </select>

      {filtradas.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <PenLine size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Nenhum caso para este filtro.</p>
          <button onClick={() => setGerarModal(true)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Gerar com IA
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((d) => {
            const temaObj = conteudo.temas.find((t) => t.id === d.temaId);
            return (
              <button
                key={d.id}
                onClick={() => abrirCaso(d)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  {temaObj && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{temaObj.nome}</p>
                  )}
                  {d.origem === 'rp' && d.anoFuvest && (
                    <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      RP {d.anoFuvest} · F2
                    </span>
                  )}
                </div>
                <p className="text-sm line-clamp-3">{d.caso.slice(0, 180)}...</p>
                <p className="text-xs text-gray-400 mt-2">{d.pontosEsperados.length} pontos esperados</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
