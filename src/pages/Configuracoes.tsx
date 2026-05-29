import { useState, useRef } from 'react';
import { useApp } from '../context';
import { importBackup } from '../store';
import { Key, Download, Upload, AlertTriangle } from 'lucide-react';

export default function Configuracoes() {
  const { state, setApiKey, setModelId, exportar, importar } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(state.apiKey);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function salvarChave() {
    setApiKey(apiKeyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newState = await importBackup(file);
      importar(newState);
      alert('Backup importado com sucesso!');
    } catch {
      alert('Erro ao importar backup. Verifique o arquivo.');
    }
    e.target.value = '';
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* API Key */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-blue-500" />
          <h2 className="font-semibold text-sm">Chave da API Anthropic</h2>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            A chave é salva apenas no localStorage do seu navegador (uso pessoal e local). Não publique este app com sua chave.
            Você pode usar também a variável de ambiente <code className="font-mono">VITE_ANTHROPIC_API_KEY</code> no arquivo <code className="font-mono">.env</code>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Chave (sk-ant-...)</label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Modelo</label>
          <select
            value={state.modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
          >
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (recomendado)</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (mais rápido/barato)</option>
          </select>
        </div>

        <button
          onClick={salvarChave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          {saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </div>

      {/* Backup */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-sm">Backup de dados</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exporte seu progresso (flashcards, simulados, questões geradas por IA) para um arquivo JSON. Importe para restaurar ou migrar.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportar}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={15} />
            Exportar backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Upload size={15} />
            Importar backup
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
        <h2 className="font-semibold text-sm mb-3">Dados armazenados</h2>
        <Row label="Questões geradas por IA" value={state.questoesIA.length} />
        <Row label="Flashcards gerados por IA" value={state.flashcardsIA.length} />
        <Row label="Dissertativas geradas por IA" value={state.dissertativasIA.length} />
        <Row label="Simulados realizados" value={state.simulados.length} />
        <Row label="Cartões com progresso SM-2" value={Object.keys(state.cardStates).length} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
