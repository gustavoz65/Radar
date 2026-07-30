import 'server-only';

const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';

/** Reasoning costs ~8s per call and this task needs none; disabling it takes ~1.7s. */
const THINKING_OFF = { thinking: false };

const TIMEOUT_MS = 30_000;

export interface ExplainRequest {
  id: string;
  name: string;
  factors: { label: string; direction: string }[];
  headlines: string[];
}

export interface Explanation {
  id: string;
  title: string;
  summary: string;
}

const SYSTEM_PROMPT = [
  'Você escreve explicações curtas de análises de renda fixa em português do Brasil.',
  'Responda SOMENTE com JSON válido, sem markdown e sem raciocínio.',
  'Nunca recomende comprar, vender ou manter. Nunca cite um número de score.',
  'Descreva apenas o que os fatores informados dizem sobre o cenário.',
].join(' ');

function buildPrompt(requests: ExplainRequest[]): string {
  const blocks = requests.map((request) => {
    const factors = request.factors
      .map((factor) => `  - ${factor.label} (${factor.direction})`)
      .join('\n');
    const news = request.headlines.length
      ? `\n  Manchetes recentes:\n${request.headlines.map((h) => `  - ${h}`).join('\n')}`
      : '';
    return `id: ${request.id}\n  Título: ${request.name}\n  Fatores:\n${factors}${news}`;
  });

  return [
    blocks.join('\n\n'),
    '',
    'Para cada id, devolva um objeto no array "signals":',
    '{"signals":[{"id":"...","title":"até 60 caracteres","summary":"2 frases, até 240 caracteres"}]}',
  ].join('\n');
}

/** Pulls the JSON object out of a response that may carry stray prose around it. */
function extractJson(content: string): unknown {
  const match = /\{[\s\S]*\}/.exec(content);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function readExplanations(payload: unknown): Explanation[] {
  if (!payload || typeof payload !== 'object') return [];
  const signals = (payload as { signals?: unknown }).signals;
  if (!Array.isArray(signals)) return [];

  return signals.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { id, title, summary } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof title !== 'string' || typeof summary !== 'string') {
      return [];
    }
    return [{ id, title: title.slice(0, 120), summary: summary.slice(0, 400) }];
  });
}

/**
 * Asks the model to phrase the factors already computed.
 *
 * The score is deliberately absent from the prompt: the model cannot restate or
 * contradict a number it never received. Returns an empty array on any failure —
 * the caller keeps the deterministic score and falls back to fixed prose.
 */
export async function explainSignals(requests: ExplainRequest[]): Promise<Explanation[]> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key || requests.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(requests) },
        ],
        temperature: 0.2,
        max_tokens: 2048,
        chat_template_kwargs: THINKING_OFF,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) return [];

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return [];

    return readExplanations(extractJson(content));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
