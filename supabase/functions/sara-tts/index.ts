// Supabase Edge Function: sara-tts
// - Validates the caller's JWT against Supabase
// - Calls OpenAI TTS (text-to-speech)
// - Returns the synthesized audio as base64 mp3
// The OpenAI key lives ONLY here, as a Supabase secret.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding/base64';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const MODEL = Deno.env.get('SARA_TTS_MODEL') ?? 'tts-1';

const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const DEFAULT_VOICE = 'nova';
const MAX_TEXT_LEN = 4000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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
    if (!authHeader) return jsonResponse({ error: 'Não autenticado' }, 401);
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
    const text: string | undefined = payload?.text;
    let voice: string = payload?.voice ?? DEFAULT_VOICE;
    if (!VALID_VOICES.includes(voice)) voice = DEFAULT_VOICE;

    if (!text || typeof text !== 'string') {
      return jsonResponse({ error: 'Envie text (string)' }, 400);
    }
    if (text.length > MAX_TEXT_LEN) {
      return jsonResponse(
        { error: `Texto muito longo (max ${MAX_TEXT_LEN} chars)` },
        400,
      );
    }

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        voice,
        input: text,
        response_format: 'mp3',
      }),
    });

    if (!ttsRes.ok) {
      const detail = await ttsRes.text();
      return jsonResponse(
        { error: 'Falha na OpenAI', status: ttsRes.status, detail },
        502,
      );
    }

    const arrayBuffer = await ttsRes.arrayBuffer();
    const audioBase64 = encodeBase64(new Uint8Array(arrayBuffer));

    return jsonResponse({
      audioBase64,
      mimeType: 'audio/mpeg',
      voice,
    });
  } catch (e) {
    return jsonResponse(
      {
        error: 'Erro inesperado',
        detail: e instanceof Error ? e.message : String(e),
      },
      500,
    );
  }
});
