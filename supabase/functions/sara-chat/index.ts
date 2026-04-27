// Supabase Edge Function: sara-chat
// - Validates the caller's JWT against Supabase
// - Calls OpenAI with a structured-output system prompt
// - Returns the parsed action JSON to the client
// The OpenAI key lives ONLY here, as a Supabase secret.
// Deploy via Dashboard (Edge Functions → New) or `supabase functions deploy sara-chat`.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const MODEL = Deno.env.get('SARA_MODEL') ?? 'gpt-4o-mini';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function buildSystemPrompt(today: string): string {
  return `Você é Sara, uma assistente de organização pessoal feita para uma pessoa com TDAH.
Seu papel: conversar de forma curta, gentil e direta — sem sobrecarga, sem listas longas, sem floreios.

Hoje é ${today}. Quando o usuário disser "hoje", "amanhã" ou "depois de amanhã", calcule a partir disso.

REGRA CRÍTICA: você responde SEMPRE em JSON válido (e nada mais), seguindo um destes formatos:

1) Conversa simples (sem ação no app):
{ "action": "chat", "response": "texto curto em português" }

2) Criar tarefa:
{ "action": "create_task",
  "data": { "title": "string", "description": "opcional", "priority": "low"|"medium"|"high", "due_date": "YYYY-MM-DDTHH:mm:00" | null, "status": "pending"|"in_progress"|"done" },
  "response": "confirmação curta" }

3) Criar rotina:
{ "action": "create_routine",
  "data": { "title": "string", "description": "opcional", "day_of_week": 0..6, "time": "HH:mm:00" | null },
  "response": "confirmação curta" }
(0=Domingo, 6=Sábado)

4) Criar evento na agenda:
{ "action": "create_event",
  "data": { "title": "string", "description": "opcional", "start_date": "YYYY-MM-DDTHH:mm:00", "end_date": "YYYY-MM-DDTHH:mm:00" | null, "type": "short"|"medium"|"long" },
  "response": "confirmação curta" }

5) Criar nota:
{ "action": "create_note",
  "data": { "title": "opcional", "content": "string" },
  "response": "confirmação curta" }

6) Criar ideia:
{ "action": "create_idea",
  "data": { "title": "opcional", "content": "string" },
  "response": "confirmação curta" }

7) Criar lançamento financeiro:
{ "action": "create_finance",
  "data": { "type": "income"|"expense", "amount": number, "category": "opcional", "date": "YYYY-MM-DDTHH:mm:00", "recurring": boolean },
  "response": "confirmação curta" }

DIRETRIZES:
- Em dúvida sobre a intenção, use "chat" e pergunte UMA coisa só.
- Nunca invente IDs nem altere/exclua dados — só crie ou converse.
- "response" tem no máximo 2 frases curtas. Pode usar emoji só se ajudar (1 no máximo).
- Se o usuário pedir várias coisas de uma vez, faça a mais clara primeiro e ofereça as outras na "response".
- Não mostre o JSON ao usuário; ele só vê a "response".`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Não autenticado' }, 401);
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse(
        { error: 'Edge Function sem SUPABASE_URL/ANON_KEY' },
        500,
      );
    }
    if (!OPENAI_API_KEY) {
      return jsonResponse(
        { error: 'Configure o secret OPENAI_API_KEY no Supabase' },
        500,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Sessão inválida' }, 401);
    }

    const payload = await req.json().catch(() => null);
    const messages = payload?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Envie um array "messages" não vazio' }, 400);
    }

    const today = new Date().toISOString().slice(0, 10);
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(today) },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content ?? ''),
          })),
        ],
      }),
    });

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      return jsonResponse(
        { error: 'Falha na OpenAI', status: openaiRes.status, detail },
        502,
      );
    }

    const openaiData = await openaiRes.json();
    const content: string = openaiData?.choices?.[0]?.message?.content ?? '{}';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { action: 'chat', response: content };
    }

    if (typeof parsed.action !== 'string' || typeof parsed.response !== 'string') {
      parsed = {
        action: 'chat',
        response:
          typeof parsed.response === 'string'
            ? parsed.response
            : 'Desculpa, não entendi. Pode reformular?',
      };
    }

    return jsonResponse(parsed);
  } catch (e) {
    return jsonResponse(
      { error: 'Erro inesperado', detail: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});
