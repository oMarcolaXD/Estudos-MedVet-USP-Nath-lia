import { useState, useRef } from 'react';
import { useApp } from '../context';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { Questao } from '../types';

const ANOS_DISPONIVEIS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

type Status = 'idle' | 'lendo' | 'processando' | 'sucesso' | 'erro';

export default function ImportarFuvest() {
  const { state, conteudo, addQuestoes } = useApp();
  const [ano, setAno] = useState<number>(2023);
  const [arquivoProva, setArquivoProva] = useState<File | null>(null);
  const [arquivoGabarito, setArquivoGabarito] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [mensagem, setMensagem] = useState('');
  const [questoesImportadas, setQuestoesImportadas] = useState(0);

  const refProva = useRef<HTMLInputElement>(null);
  const refGabarito = useRef<HTMLInputElement>(null);

  const jaImportados = state.questoesIA.filter((q) => q.origem === 'fuvest' && q.anoFuvest === ano).length;

  async function lerPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('Não foi possível ler o arquivo'));
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'utf-8');
    });
  }

  async function importar() {
    if (!arquivoProva || !arquivoGabarito) return;
    if (!state.apiKey) {
      setMensagem('Configure sua chave da API Anthropic em Configurações primeiro.');
      setStatus('erro');
      return;
    }

    try {
      setStatus('lendo');
      setMensagem('Lendo os arquivos PDF...');

      const [textoProva, textoGabarito] = await Promise.all([
        lerPDF(arquivoProva),
        lerPDF(arquivoGabarito),
      ]);

      setStatus('processando');
      setMensagem('Enviando para o Claude extrair as questões...');

      const temasList = conteudo.temas
        .map((t) => `- id: "${t.id}" | nome: "${t.nome}" | categoria: "${t.categoria}"`)
        .join('\n');

      const prompt = `Você vai extrair questões de uma prova FUVEST ${ano} e estruturá-las em JSON.

## PROVA (texto extraído do PDF)
${textoProva.slice(0, 40000)}

## GABARITO (texto extraído do PDF)
${textoGabarito.slice(0, 10000)}

## TEMAS DISPONÍVEIS NO APP
${temasList}

## INSTRUÇÃO

1. Extraia TODAS as 40 questões da prova (8 gerais + 7 interpretação + 25 específicas de veterinária).
2. Para cada questão, encontre a resposta correta no gabarito buscando a seção "Grupo 5: Veterinária" (ou equivalente para medicina veterinária).
3. Para cada questão, classifique em qual temaId do app ela se encaixa melhor. Se não encaixar em nenhum, use o temaId mais próximo.
4. A categoria deve ser:
   - "geral" para questões de conhecimentos gerais (1-8)
   - "interpretacao" para questões de interpretação de texto (9-15 ou similar)
   - "especifico" para questões específicas de veterinária

Retorne APENAS um array JSON válido, sem markdown, sem explicação, com esta estrutura exata:
[
  {
    "numero": 1,
    "temaId": "id-do-tema",
    "categoria": "geral",
    "enunciado": "texto completo da questão",
    "alternativas": ["A) texto", "B) texto", "C) texto", "D) texto", "E) texto"],
    "correta": 0,
    "explicacao": "breve explicação do gabarito",
    "dificuldade": "media"
  }
]

O campo "correta" é o índice (0=A, 1=B, 2=C, 3=D, 4=E).
A "explicacao" deve ser curta (1-2 frases) baseada apenas no gabarito.
Retorne SOMENTE o array JSON, começando com [ e terminando com ].`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': state.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: state.modelId,
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Erro HTTP ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const texto = data.content.find((c) => c.type === 'text')?.text ?? '';

      // Extrai o JSON mesmo que venha com markdown
      const match = texto.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Claude não retornou JSON válido. Tente novamente.');

      const questoesRaw = JSON.parse(match[0]) as Array<{
        numero: number;
        temaId: string;
        categoria: string;
        enunciado: string;
        alternativas: string[];
        correta: number;
        explicacao: string;
        dificuldade: string;
      }>;

      const questoes: Questao[] = questoesRaw.map((q) => ({
        id: `fuvest-${ano}-q${q.numero}-${Date.now()}`,
        temaId: q.temaId,
        categoria: q.categoria as Questao['categoria'],
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        correta: q.correta,
        explicacao: q.explicacao,
        dificuldade: (q.dificuldade as Questao['dificuldade']) ?? 'media',
        origem: 'fuvest',
        anoFuvest: ano,
      }));

      addQuestoes(questoes);
      setQuestoesImportadas(questoes.length);
      setStatus('sucesso');
      setMensagem(`${questoes.length} questões importadas com sucesso!`);
      setArquivoProva(null);
      setArquivoGabarito(null);
    } catch (err) {
      setStatus('erro');
      setMensagem(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }

  const podeImportar = arquivoProva && arquivoGabarito && status !== 'processando' && status !== 'lendo';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Prova FUVEST</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Faça upload dos PDFs da prova e do gabarito. O Claude extrai todas as 40 questões automaticamente.
        </p>
      </div>

      {/* Seleção de ano */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-sm">Ano da prova</h2>
        <div className="flex flex-wrap gap-2">
          {ANOS_DISPONIVEIS.map((a) => {
            const count = state.questoesIA.filter((q) => q.origem === 'fuvest' && q.anoFuvest === a).length;
            return (
              <button
                key={a}
                onClick={() => setAno(a)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all relative ${
                  ano === a
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {a}
                {count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                    ano === a ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white'
                  }`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {jaImportados > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle size={12} />
            {jaImportados} questões de FUVEST {ano} já importadas. Importar novamente adicionará duplicatas.
          </p>
        )}
      </div>

      {/* Upload dos arquivos */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Arquivos da prova FUVEST {ano}</h2>
          <Dica texto="Os PDFs precisam ter texto selecionável (não são imagens). Baixe os originais do site da FUVEST." />
        </div>

        <ArquivoUpload
          label="Prova (PDF)"
          descricao="O arquivo da prova com as questões"
          arquivo={arquivoProva}
          onSelect={setArquivoProva}
          inputRef={refProva}
        />

        <ArquivoUpload
          label="Gabarito (PDF)"
          descricao="O arquivo com as respostas de todos os grupos"
          arquivo={arquivoGabarito}
          onSelect={setArquivoGabarito}
          inputRef={refGabarito}
        />
      </div>

      {/* Aviso sobre o processo */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
        <p className="font-semibold">Como funciona:</p>
        <p>1. O texto dos PDFs é lido direto no seu navegador (nenhum arquivo é enviado ao servidor).</p>
        <p>2. O texto é enviado à API do Claude para extrair e estruturar as 40 questões.</p>
        <p>3. O gabarito do Grupo 5 (Veterinária) é usado como resposta correta.</p>
        <p>4. As questões ficam disponíveis em Simulados e Flashcards com o badge "FUVEST {ano}".</p>
      </div>

      {/* Feedback de status */}
      {status !== 'idle' && (
        <div className={`rounded-xl p-4 flex items-start gap-3 text-sm ${
          status === 'sucesso'
            ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : status === 'erro'
            ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          {status === 'lendo' || status === 'processando' ? (
            <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
          ) : status === 'sucesso' ? (
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{mensagem}</p>
            {status === 'sucesso' && (
              <p className="mt-0.5 opacity-75">
                Vá em Simulados para usar as questões importadas. Elas aparecem com o badge FUVEST {ano}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão */}
      <button
        onClick={importar}
        disabled={!podeImportar}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          podeImportar
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        {status === 'lendo' || status === 'processando' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {status === 'lendo' ? 'Lendo arquivos...' : 'Extraindo questões...'}
          </>
        ) : (
          <>
            <Upload size={16} />
            Importar FUVEST {ano}
          </>
        )}
      </button>

      {/* Resumo total importado */}
      {state.questoesIA.some((q) => q.origem === 'fuvest') && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-sm mb-3">Questões FUVEST no banco</h2>
          <div className="space-y-1.5">
            {ANOS_DISPONIVEIS.map((a) => {
              const count = state.questoesIA.filter((q) => q.origem === 'fuvest' && q.anoFuvest === a).length;
              if (count === 0) return null;
              return (
                <div key={a} className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                      FUVEST {a}
                    </span>
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{count} questões</span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800 font-semibold">
              <span>Total</span>
              <span>{state.questoesIA.filter((q) => q.origem === 'fuvest').length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Questões importadas nesta sessão */}
      {status === 'sucesso' && questoesImportadas > 0 && (
        <p className="text-center text-xs text-gray-400">
          {questoesImportadas} questões adicionadas ao banco · FUVEST {ano}
        </p>
      )}
    </div>
  );
}

function ArquivoUpload({
  label, descricao, arquivo, onSelect, inputRef,
}: {
  label: string;
  descricao: string;
  arquivo: File | null;
  onSelect: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">— {descricao}</p>
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center gap-3 transition-all ${
          arquivo
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
        }`}
      >
        {arquivo ? (
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
        ) : (
          <FileText size={20} className="text-gray-400 shrink-0" />
        )}
        <div className="text-left min-w-0">
          {arquivo ? (
            <>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">{arquivo.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {(arquivo.size / 1024).toFixed(0)} KB — clique para trocar
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clique para selecionar</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Arquivo PDF</p>
            </>
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          onSelect(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Dica({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <HelpCircle size={14} />
      </button>
      {aberto && (
        <div className="absolute left-0 top-6 z-10 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg">
          {texto}
          <button onClick={() => setAberto(false)} className="block mt-1 text-gray-400 hover:text-white">
            fechar
          </button>
        </div>
      )}
    </div>
  );
}
