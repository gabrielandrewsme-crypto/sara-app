// Supabase Edge Function: sara-transcribe
// - Validates the caller's JWT against Supabase
// - Decodes a base64 audio payload
// - Forwards it to OpenAI Whisper (multipart/form-data)
// - Returns the transcribed text
// The OpenAI key lives ONLY here, as a Supabase secret.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { decodeBase64 } from 'jsr:@std/encoding/base64';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const MODEL = Deno.env.get('SARA_TRANSCRIBE_MODEL') ?? 'whisper-1';

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

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB safety cap

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
    const audioBase64: string | undefined = payload?.audioBase64;
    const mimeType: string = payload?.mimeType ?? 'audio/m4a';
    const filename: string = payload?.filename ?? 'audio.m4a';
    const language: string | undefined = payload?.language ?? 'pt';

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return jsonResponse({ error: 'Envie audioBase64 (string)' }, 400);
    }

    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(audioBase64);
    } catch {
      return jsonResponse({ error: 'audioBase64 inválido' }, 400);
    }

    if (bytes.byteLength === 0) {
      return jsonResponse({ error: 'Áudio vazio' }, 400);
    }
    if (bytes.byteLength > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: 'Áudio muito grande (>20MB)' }, 413);
    }

    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mimeType }), filename);
    form.append('model', MODEL);
    if (language) form.append('language', language);

    const openaiRes = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: form,
      },
    );

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      return jsonResponse(
        { error: 'Falha na OpenAI', status: openaiRes.status, detail },
        502,
      );
    }

    const data = await openaiRes.json();
    const text =
      typeof data?.text === 'string' ? data.text.trim() : '';

    return jsonResponse({ text });
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
