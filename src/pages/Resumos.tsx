import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Sparkles, ClipboardList, StickyNote, TrendingUp, BookMarked, Upload, Trash2, FileUp } from 'lucide-react';
import { Tema } from '../types';
import GerarIA from '../components/GerarIA';
import ImportarApostilaPDF from '../components/ImportarApostilaPDF';

const categoriaCor: Record<string, string> = {
  geral: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  interpretacao: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  especifico: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const categoriaLabel: Record<string, string> = {
  geral: 'Geral',
  interpretacao: 'Interpretação',
  especifico: 'Específico',
};

export default function Resumos() {
  const { conteudo, state, setAnotacao, setApostila } = useApp();
  const navigate = useNavigate();
  const [temaSelecionado, setTemaSelecionado] = useState<Tema | null>(null);
  const [gerarModal, setGerarModal] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [ordemMaisCobrados, setOrdemMaisCobrados] = useState(false);
  const [anotacaoEdit, setAnotacaoEdit] = useState('');
  const [showAnotacao, setShowAnotacao] = useState(false);
  const [showApostila, setShowApostila] = useState(false);
  const [apostilaEdit, setApostilaEdit] = useState('');
  const [importarPDFModal, setImportarPDFModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Frequência FUVEST por tema
  const freqFuvest = useMemo(() => {
    const questoesFuvest = conteudo.questoes.filter(
      (q) => q.origem === 'fuvest' || q.origem === 'rp'
    );
    const total = questoesFuvest.length;
    if (total === 0) return {} as Record<string, number>;
    const contagem: Record<string, number> = {};
    questoesFuvest.forEach((q) => {
      contagem[q.temaId] = (contagem[q.temaId] ?? 0) + 1;
    });
    const pct: Record<string, number> = {};
    Object.entries(contagem).forEach(([id, n]) => {
      pct[id] = Math.round((n / total) * 100);
    });
    return pct;
  }, [conteudo.questoes]);

  function abrirTema(tema: Tema) {
    setTemaSelecionado(tema);
    setAnotacaoEdit(state.anotacoes[tema.id] ?? '');
    setApostilaEdit(state.apostilas?.[tema.id] ?? '');
    setShowAnotacao(false);
    setShowApostila(false);
  }

  function handleArquivoApostila(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert('Arquivo muito grande. Use arquivos de até 500 KB (aprox. 80 páginas de texto).');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setApostilaEdit(ev.target?.result as string ?? '');
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo. Verifique se é um arquivo de texto válido.');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  const temasFiltrados = useMemo(() => {
    const base = conteudo.temas.filter((t) =>
      t.nome.toLowerCase().includes(filtro.toLowerCase())
    );
    if (ordemMaisCobrados) {
      return [...base].sort((a, b) => (freqFuvest[b.id] ?? 0) - (freqFuvest[a.id] ?? 0));
    }
    return base;
  }, [conteudo.temas, filtro, ordemMaisCobrados, freqFuvest]);

  if (temaSelecionado) {
    return (
      <div className="max-w-3xl space-y-4">
        {gerarModal && (
          <GerarIA tema={temaSelecionado} onClose={() => setGerarModal(false)} />
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setTemaSelecionado(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Todos os temas
          </button>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaCor[temaSelecionado.categoria]}`}>
            {categoriaLabel[temaSelecionado.categoria]}
          </span>
        </div>

        <h1 className="text-xl font-bold">{temaSelecionado.nome}</h1>

        {/* Resumo */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{temaSelecionado.resumo}</ReactMarkdown>
          </div>
        </div>

        {/* Bibliografia */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Bibliografia oficial</h3>
          <ul className="space-y-1">
            {temaSelecionado.bibliografia.map((b, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {b}</li>
            ))}
          </ul>
        </div>

        {/* Anotações */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <button
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
            onClick={() => setShowAnotacao(!showAnotacao)}
          >
            <StickyNote size={15} />
            {showAnotacao ? 'Ocultar anotações' : 'Minhas anotações'}
          </button>
          {showAnotacao && (
            <>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-800 min-h-[100px] resize-y"
                placeholder="Digite suas anotações sobre este tema..."
                value={anotacaoEdit}
                onChange={(e) => setAnotacaoEdit(e.target.value)}
              />
              <button
                onClick={() => setAnotacao(temaSelecionado.id, anotacaoEdit)}
                className="mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </>
          )}
        </div>

        {/* Apostila */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleArquivoApostila}
          />
          <div className="flex items-center justify-between mb-2">
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
              onClick={() => setShowApostila(!showApostila)}
            >
              <BookMarked size={15} />
              Minha apostila
              {(state.apostilas?.[temaSelecionado.id]) && (
                <span className="ml-1 text-[10px] font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                  Ativa
                </span>
              )}
            </button>
            {showApostila && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Upload size={12} />
                Importar .txt / .md
              </button>
            )}
          </div>
          {showApostila && (
            <>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-800 min-h-[140px] resize-y font-mono"
                placeholder="Cole aqui o conteúdo da sua apostila ou importe um arquivo .txt / .md. Este texto será incluído como contexto ao gerar questões, flashcards e casos com IA."
                value={apostilaEdit}
                onChange={(e) => setApostilaEdit(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setApostila(temaSelecionado.id, apostilaEdit)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salvar apostila
                </button>
                {state.apostilas?.[temaSelecionado.id] && (
                  <button
                    onClick={() => { setApostilaEdit(''); setApostila(temaSelecionado.id, ''); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 size={13} />
                    Remover
                  </button>
                )}
                {apostilaEdit && (
                  <span className="text-xs text-gray-400 ml-auto">
                    ~{Math.round(apostilaEdit.length / 5)} palavras
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/simulados?temaId=${temaSelecionado.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <ClipboardList size={15} />
            Praticar questões
          </button>
          <button
            onClick={() => setGerarModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Sparkles size={15} />
            Gerar com IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {importarPDFModal && (
        <ImportarApostilaPDF onClose={() => setImportarPDFModal(false)} />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Resumos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{conteudo.temas.length} temas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportarPDFModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FileUp size={14} />
            PDF
          </button>
          <button
            onClick={() => setOrdemMaisCobrados((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              ordemMaisCobrados
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp size={14} />
            Mais cobrados
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar tema..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900"
      />

      <div className="grid gap-3">
        {temasFiltrados.map((tema) => {
          const pct = freqFuvest[tema.id];
          const temApostila = !!state.apostilas?.[tema.id];
          return (
            <button
              key={tema.id}
              onClick={() => abrirTema(tema)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-sm">{tema.nome}</span>
                  {temApostila && (
                    <BookMarked size={13} className="text-green-500 shrink-0" aria-label="Apostila salva" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {pct !== undefined && pct > 0 && (
                    <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                      FUVEST {pct}%
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaCor[tema.categoria]}`}>
                    {categoriaLabel[tema.categoria]}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-6 line-clamp-2">
                {tema.resumo.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120)}...
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
