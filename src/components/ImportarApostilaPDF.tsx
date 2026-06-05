import { useState, useRef } from 'react';
import { useApp } from '../context';
import { identificarTema } from '../api';
import { extrairTextoPDF } from '../utils/pdf';
import { FileText, Upload, Check, ChevronDown, Loader2, X } from 'lucide-react';

type Etapa = 'idle' | 'extraindo' | 'identificando' | 'confirmar' | 'salvo';

interface Props {
  onClose: () => void;
}

export default function ImportarApostilaPDF({ onClose }: Props) {
  const { conteudo, state, setApostila } = useApp();
  const [etapa, setEtapa] = useState<Etapa>('idle');
  const [erro, setErro] = useState('');
  const [textoExtraido, setTextoExtraido] = useState('');
  const [temaIdSugerido, setTemaIdSugerido] = useState<string | null>(null);
  const [temaIdEscolhido, setTemaIdEscolhido] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const temaSugerido = conteudo.temas.find((t) => t.id === temaIdSugerido);
  const temaEscolhido = conteudo.temas.find((t) => t.id === temaIdEscolhido);
  const temFinal = temaEscolhido ?? temaSugerido;

  async function processar(file: File) {
    setErro('');

    if (file.size > 20_000_000) {
      setErro('PDF muito grande. Use arquivos de até 20 MB.');
      return;
    }

    try {
      setEtapa('extraindo');
      const texto = await extrairTextoPDF(file);

      if (!texto.trim()) {
        setErro('Não foi possível extrair texto deste PDF. Verifique se o arquivo tem texto selecionável (não é imagem).');
        setEtapa('idle');
        return;
      }

      setTextoExtraido(texto);

      const chaveAtiva = state.provider === 'gemini' ? state.geminiApiKey : state.apiKey;
      if (chaveAtiva) {
        setEtapa('identificando');
        const idEncontrado = await identificarTema({
          provider: state.provider,
          apiKey: state.apiKey,
          geminiApiKey: state.geminiApiKey,
          modelId: state.modelId,
          textoPDF: texto,
          temas: conteudo.temas.map((t) => ({ id: t.id, nome: t.nome })),
        });
        setTemaIdSugerido(idEncontrado);
        setTemaIdEscolhido(idEncontrado ?? '');
      } else {
        setTemaIdSugerido(null);
        setTemaIdEscolhido('');
      }

      setEtapa('confirmar');
    } catch (e) {
      setErro((e as Error).message ?? 'Erro ao processar PDF.');
      setEtapa('idle');
    }
  }

  function salvar() {
    const id = temaIdEscolhido || temaIdSugerido;
    if (!id) return;
    setApostila(id, textoExtraido);
    setEtapa('salvo');
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            <h2 className="font-semibold">Importar apostila em PDF</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Estado: idle */}
          {etapa === 'idle' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Envie o PDF da sua apostila. O app extrai o texto e identifica automaticamente o tema.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processar(f); e.target.value = ''; }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
              >
                <Upload size={28} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Clique para selecionar o PDF</span>
                <span className="text-xs text-gray-400">Até 20 MB · Texto extraído das primeiras 30 páginas</span>
              </button>
              {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
            </>
          )}

          {/* Estado: extraindo */}
          {etapa === 'extraindo' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium">Extraindo texto do PDF...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Estado: identificando */}
          {etapa === 'identificando' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <p className="text-sm font-medium">Identificando o tema...</p>
              <p className="text-xs text-gray-400">Consultando IA</p>
            </div>
          )}

          {/* Estado: confirmar */}
          {etapa === 'confirmar' && (
            <>
              {/* Preview do texto */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {Math.round(textoExtraido.length / 5)} palavras extraídas
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 font-mono">
                  {textoExtraido.slice(0, 200)}...
                </p>
              </div>

              {/* Tema sugerido / seletor */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {temaIdSugerido ? 'Tema identificado' : 'Selecione o tema'}
                </label>
                {temaIdSugerido && (
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={14} className="text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                      {temaSugerido?.nome}
                    </span>
                  </div>
                )}
                <div className="relative">
                  <select
                    value={temaIdEscolhido}
                    onChange={(e) => setTemaIdEscolhido(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 appearance-none pr-8"
                  >
                    <option value="">
                      {temaIdSugerido ? '— Ou escolha outro tema —' : '— Escolha o tema —'}
                    </option>
                    {conteudo.temas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

              {!temaIdSugerido && !state.geminiApiKey && !state.apiKey && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Configure uma chave de API nas Configurações para que o app identifique o tema automaticamente.
                </p>
              )}
            </>
          )}

          {/* Estado: salvo */}
          {etapa === 'salvo' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium">Apostila salva com sucesso!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Em <strong>{temFinal?.nome}</strong>. Acesse o tema nos Resumos para verificar ou gerar conteúdo com IA.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {etapa === 'salvo' ? (
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          ) : etapa === 'confirmar' ? (
            <>
              <button
                onClick={() => setEtapa('idle')}
                className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={salvar}
                disabled={!temaIdEscolhido && !temaIdSugerido}
                className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Salvar apostila
              </button>
            </>
          ) : etapa === 'idle' ? (
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
