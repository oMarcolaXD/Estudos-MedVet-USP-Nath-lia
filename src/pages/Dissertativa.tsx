import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { Dissertativa as DissertativaType } from '../types';
import { PenLine, Eye, EyeOff, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import GerarIA from '../components/GerarIA';

// Representa um caso clínico — pode ter múltiplas sub-questões (partes)
interface GrupoCaso {
  grupoId: string; // único por caso; para dissertativas sem grupo, igual ao id
  partes: DissertativaType[];
  anoFuvest?: number;
  temaNomes: string[];
}

export default function Dissertativa() {
  const { conteudo, state } = useApp();
  const [temaSel, setTemaSel] = useState('');
  const [grupoAberto, setGrupoAberto] = useState<GrupoCaso | null>(null);
  const [parteIdx, setParteIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [mostrarPontos, setMostrarPontos] = useState<Record<string, boolean>>({});
  const [gerarModal, setGerarModal] = useState(false);

  const todasDissertativas: DissertativaType[] = useMemo(
    () => [...conteudo.dissertativas, ...state.dissertativasIA],
    [conteudo.dissertativas, state.dissertativasIA]
  );

  const grupos: GrupoCaso[] = useMemo(() => {
    // Monta grupos com TODAS as partes, independente do filtro
    const map = new Map<string, DissertativaType[]>();
    todasDissertativas.forEach((d) => {
      const key = d.grupoId ?? d.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });

    const todosGrupos = Array.from(map.entries()).map(([grupoId, partes]) => {
      const temaNomes = [...new Set(partes.map((p) => {
        const t = conteudo.temas.find((t) => t.id === p.temaId);
        return t?.nome ?? p.temaId;
      }))];
      return { grupoId, partes, anoFuvest: partes[0].anoFuvest, temaNomes };
    });

    // Filtra grupos que contenham ao menos uma parte do tema selecionado
    if (!temaSel) return todosGrupos;
    return todosGrupos.filter((g) => g.partes.some((p) => p.temaId === temaSel));
  }, [todasDissertativas, temaSel, conteudo.temas]);

  const gerarTema = temaSel
    ? conteudo.temas.find((t) => t.id === temaSel)
    : conteudo.temas[0];

  function abrirGrupo(grupo: GrupoCaso) {
    setGrupoAberto(grupo);
    setParteIdx(0);
    setRespostas({});
    setMostrarPontos({});
  }

  function togglePontos(id: string) {
    setMostrarPontos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (grupoAberto) {
    const parte = grupoAberto.partes[parteIdx];
    const totalPartes = grupoAberto.partes.length;
    const isGrupado = totalPartes > 1;

    return (
      <div className="max-w-3xl space-y-4">
        <button onClick={() => setGrupoAberto(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Lista de casos
        </button>

        {/* Cabeçalho do caso */}
        <div className="flex items-center gap-2 flex-wrap">
          {grupoAberto.anoFuvest && (
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              FUVEST {grupoAberto.anoFuvest} · Fase 2
            </span>
          )}
          {grupoAberto.temaNomes.map((n) => (
            <span key={n} className="text-xs text-gray-500 dark:text-gray-400">{n}</span>
          ))}
        </div>

        {/* Navegação entre partes (só para grupos) */}
        {isGrupado && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setParteIdx((i) => Math.max(0, i - 1)); setMostrarPontos({}); }}
              disabled={parteIdx === 0}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">Questão {parteIdx + 1} de {totalPartes}</span>
            <button
              onClick={() => { setParteIdx((i) => Math.min(totalPartes - 1, i + 1)); setMostrarPontos({}); }}
              disabled={parteIdx === totalPartes - 1}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronRight size={16} />
            </button>
            <span className="ml-auto text-xs text-gray-400">
              {conteudo.temas.find((t) => t.id === parte.temaId)?.nome}
            </span>
          </div>
        )}

        {/* Caso clínico */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            Caso clínico{isGrupado ? ` — Questão ${parteIdx + 1}` : ''}
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{parte.caso}</p>
        </div>

        {/* Resposta */}
        <div>
          <label className="block text-sm font-medium mb-2">Sua resposta</label>
          <textarea
            value={respostas[parte.id] ?? ''}
            onChange={(e) => setRespostas((prev) => ({ ...prev, [parte.id]: e.target.value }))}
            placeholder="Escreva sua resposta dissertativa aqui..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-sm bg-white dark:bg-gray-900 min-h-[180px] resize-y"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{(respostas[parte.id] ?? '').length} caracteres</p>
        </div>

        <button
          onClick={() => togglePontos(parte.id)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {mostrarPontos[parte.id] ? <EyeOff size={15} /> : <Eye size={15} />}
          {mostrarPontos[parte.id] ? 'Ocultar gabarito' : 'Ver pontos esperados'}
        </button>

        {mostrarPontos[parte.id] && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold mb-3">Pontos esperados</h3>
              <ul className="space-y-2">
                {parte.pontosEsperados.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
              <h3 className="text-sm font-semibold mb-1 text-amber-800 dark:text-amber-200">Comentário do avaliador</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">{parte.comentario}</p>
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
          <p className="text-sm text-gray-500 dark:text-gray-400">{grupos.length} caso(s) disponíveis</p>
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

      {grupos.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <PenLine size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Nenhum caso para este filtro.</p>
          <button onClick={() => setGerarModal(true)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Gerar com IA
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => (
            <button
              key={grupo.grupoId}
              onClick={() => abrirGrupo(grupo)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {grupo.anoFuvest && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    FUVEST {grupo.anoFuvest} · F2
                  </span>
                )}
                {grupo.partes.length > 1 && (
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    {grupo.partes.length} questões
                  </span>
                )}
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {grupo.temaNomes.join(' · ')}
                </span>
              </div>
              <p className="text-sm line-clamp-2">{grupo.partes[0].caso.slice(0, 180)}...</p>
              <p className="text-xs text-gray-400 mt-2">
                {grupo.partes.reduce((acc, p) => acc + p.pontosEsperados.length, 0)} pontos esperados no total
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
