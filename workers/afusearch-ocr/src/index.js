const MODEL = '@cf/moondream/moondream3.1-9B-A2B';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_REQUEST_BYTES = 4 * 1024 * 1024 + 1024;
const OCR_QUESTION = [
  'Transcribe every piece of visible text in this image exactly as written.',
  'Preserve the original language, spelling, numbers, punctuation, line order, and meaningful line breaks.',
  'Do not summarize, translate, describe the image, or invent text.',
  'If no readable text is visible, return an empty string.',
].join(' ');

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

class RequestBodyTooLargeError extends Error {}

async function readLimitedBody(request) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function parseImageInput(input, declaredMime) {
  if (typeof input !== 'string' || input.length === 0) return { error: 'image_required' };
  let mime = typeof declaredMime === 'string' ? declaredMime.toLowerCase() : '';
  let base64 = input;
  const dataUri = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(input);
  if (dataUri) {
    mime = dataUri[1].toLowerCase();
    base64 = dataUri[2];
  } else if (/^data:/i.test(input)) {
    return { error: 'unsupported_image_format' };
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
    return { error: 'unsupported_image_format' };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 === 1) {
    return { error: 'invalid_image_data' };
  }
  const estimatedBytes = Math.floor((base64.length * 3) / 4) -
    (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (estimatedBytes <= 0) return { error: 'invalid_image_data' };
  if (estimatedBytes > MAX_IMAGE_BYTES) return { error: 'image_too_large' };
  let prefix;
  try {
    prefix = atob(base64.slice(0, 64));
  } catch {
    return { error: 'invalid_image_data' };
  }
  const bytes = Uint8Array.from(prefix, (char) => char.charCodeAt(0));
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d &&
    bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isGif = bytes.length >= 6 && /^GIF8[79]a$/.test(String.fromCharCode(...bytes.slice(0, 6)));
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const signatureMatches = (mime === 'image/png' && isPng) ||
    (mime === 'image/jpeg' && isJpeg) || (mime === 'image/gif' && isGif) ||
    (mime === 'image/webp' && isWebp);
  if (!signatureMatches) return { error: 'image_signature_mismatch' };
  return { mime, image: 'data:' + mime + ';base64,' + base64 };
}

async function verifyUser(request, env) {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return false;
  if (typeof env.SUPABASE_URL !== 'string' || !/^https:\/\//i.test(env.SUPABASE_URL)) return false;
  if (typeof env.SUPABASE_PUBLISHABLE_KEY !== 'string' || !env.SUPABASE_PUBLISHABLE_KEY) return false;
  try {
    const response = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const user = await response.json().catch(() => null);
    return typeof user?.id === 'string' && user.id.length > 0;
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'afusearch-ocr' });
    }
    if (url.pathname !== '/ocr') return json({ error: 'not_found' }, 404);
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    if (!await verifyUser(request, env)) return json({ error: 'unauthorized' }, 401);
    if (!env.AI || typeof env.AI.run !== 'function') return json({ error: 'ocr_service_unavailable' }, 503);
    const contentType = request.headers.get('content-type') || '';
    if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
      return json({ error: 'content_type_must_be_json' }, 415);
    }
    let payload;
    try {
      payload = JSON.parse(await readLimitedBody(request));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return json({ error: 'request_too_large', maxBytes: MAX_REQUEST_BYTES }, 413);
      }
      return json({ error: 'invalid_json' }, 400);
    }
    const imageInput = parseImageInput(payload?.image, payload?.mimeType);
    if (imageInput.error) {
      const status = imageInput.error === 'image_too_large' ? 413 :
        imageInput.error === 'image_required' ? 400 : 415;
      return json({ error: imageInput.error, maxImageBytes: MAX_IMAGE_BYTES }, status);
    }
    try {
      const result = await env.AI.run(MODEL, {
        task: 'query',
        image: imageInput.image,
        question: OCR_QUESTION,
        reasoning: false,
        temperature: 0,
        max_tokens: 2048,
        stream: false,
      });
      if (typeof result?.answer !== 'string') return json({ error: 'ocr_temporarily_unavailable' }, 503);
      const text = result.answer.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim().slice(0, 5000);
      return json({ ok: true, text, hasText: text.length > 0 });
    } catch {
      return json({ error: 'ocr_temporarily_unavailable' }, 503);
    }
  },
};

export { parseImageInput, MAX_IMAGE_BYTES, MAX_REQUEST_BYTES, verifyUser };
