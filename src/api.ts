import { Questao, Flashcard, Dissertativa, Dificuldade, Categoria } from './types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_MODEL = 'gemini-2.0-flash';

function geminiUrl(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

function anthropicHeaders(apiKey: string) {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

function parseJSON(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

async function callAnthropic(
  apiKey: string,
  modelId: string,
  system: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const resp = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: anthropicHeaders(apiKey),
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Erro HTTP ${resp.status}`);
  }

  const data = await resp.json() as { content: { type: string; text?: string }[] };
  return data.content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
}

async function callGemini(
  apiKey: string,
  system: string,
  userPrompt: string
): Promise<string> {
  const resp = await fetch(geminiUrl(apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message;
    throw new Error(msg ?? `Erro HTTP ${resp.status}`);
  }

  const data = await resp.json() as {
    candidates: { content: { parts: { text: string }[] } }[];
  };
  return data.candidates[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
}

async function callIA(params: {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  geminiApiKey: string;
  modelId: string;
  system: string;
  userPrompt: string;
  maxTokens: number;
}): Promise<string> {
  if (params.provider === 'gemini') {
    return callGemini(params.geminiApiKey, params.system, params.userPrompt);
  }
  return callAnthropic(params.apiKey, params.modelId, params.system, params.userPrompt, params.maxTokens);
}

interface GerarQuestoesParams {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  geminiApiKey: string;
  modelId: string;
  contexto: string;
  temaId: string;
  temaCategoria: Categoria;
  quantidade: number;
  dificuldade: Dificuldade;
}

export async function gerarQuestoes(params: GerarQuestoesParams): Promise<Questao[]> {
  const { contexto, temaId, temaCategoria, quantidade, dificuldade } = params;

  const system = 'Você é um elaborador de questões para o processo seletivo da residência em Medicina Veterinária da USP (FUVEST). Gere questões fiéis ao estilo da banca, baseadas estritamente no contexto fornecido. Responda APENAS com JSON válido, sem markdown.';

  const userPrompt = `Gere exatamente ${quantidade} questões de múltipla escolha sobre o seguinte tema para o processo seletivo de residência em Medicina Veterinária da USP (FUVEST).

CONTEXTO DO TEMA:
${contexto}

REQUISITOS:
- Cada questão deve ter exatamente 5 alternativas (a-e)
- Apenas uma alternativa correta
- Dificuldade: ${dificuldade}
- Estilo da banca FUVEST/USP: enunciado claro, alternativas plausíveis
- Inclua explicação detalhada para a alternativa correta

Responda APENAS com JSON válido, sem markdown, no formato:
{
  "questoes": [
    {
      "enunciado": "...",
      "alternativas": ["a) ...", "b) ...", "c) ...", "d) ...", "e) ..."],
      "correta": 0,
      "explicacao": "...",
      "dificuldade": "${dificuldade}"
    }
  ]
}`;

  const text = await callIA({ ...params, system, userPrompt, maxTokens: 3000 });
  const parsed = parseJSON(text) as { questoes: { enunciado: string; alternativas: string[]; correta: number; explicacao: string; dificuldade: string }[] };

  return parsed.questoes.map((q, i) => ({
    id: `ia_${temaId}_${Date.now()}_${i}`,
    temaId,
    categoria: temaCategoria,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    correta: q.correta,
    explicacao: q.explicacao,
    dificuldade: q.dificuldade as Dificuldade,
    origem: 'ia',
  }));
}

interface GerarFlashcardsParams {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  geminiApiKey: string;
  modelId: string;
  contexto: string;
  temaId: string;
  quantidade: number;
}

export async function gerarFlashcards(params: GerarFlashcardsParams): Promise<Flashcard[]> {
  const { contexto, temaId, quantidade } = params;

  const system = 'Você é um tutor especializado em Medicina Veterinária. Crie flashcards objetivos e precisos para estudo. Responda APENAS com JSON válido, sem markdown.';

  const userPrompt = `Gere exatamente ${quantidade} flashcards de estudo sobre o seguinte tema para a residência em Medicina Veterinária da USP.

CONTEXTO:
${contexto}

Responda APENAS com JSON válido, sem markdown, no formato:
{
  "flashcards": [
    { "frente": "pergunta ou conceito", "verso": "resposta objetiva" }
  ]
}`;

  const text = await callIA({ ...params, system, userPrompt, maxTokens: 2000 });
  const parsed = parseJSON(text) as { flashcards: { frente: string; verso: string }[] };

  return parsed.flashcards.map((fc, i) => ({
    id: `ia_fc_${temaId}_${Date.now()}_${i}`,
    temaId,
    frente: fc.frente,
    verso: fc.verso,
    origem: 'ia',
  }));
}

interface GerarDissertativaParams {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  geminiApiKey: string;
  modelId: string;
  contexto: string;
  temaId: string;
}

export async function gerarDissertativa(params: GerarDissertativaParams): Promise<Dissertativa> {
  const { contexto, temaId } = params;

  const system = 'Você é um elaborador de casos clínicos para residência em Medicina Veterinária da USP. Crie casos realistas e didáticos. Responda APENAS com JSON válido, sem markdown.';

  const userPrompt = `Crie UM caso clínico dissertativo para a prova P2 da residência em Medicina Veterinária da USP (FUVEST).

CONTEXTO:
${contexto}

O caso deve ser realista, complexo e integrar conhecimentos clínicos e de saúde pública quando pertinente.

Responda APENAS com JSON válido, sem markdown, no formato:
{
  "caso": "descrição detalhada do caso clínico",
  "pontosEsperados": ["ponto 1", "ponto 2", "ponto 3"],
  "comentario": "orientações para autoavaliação da resposta"
}`;

  const text = await callIA({ ...params, system, userPrompt, maxTokens: 2000 });
  const parsed = parseJSON(text) as { caso: string; pontosEsperados: string[]; comentario: string };

  return {
    id: `ia_diss_${temaId}_${Date.now()}`,
    temaId,
    caso: parsed.caso,
    pontosEsperados: parsed.pontosEsperados,
    comentario: parsed.comentario,
    origem: 'ia',
  };
}
