import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { parseImageInput, MAX_IMAGE_BYTES, MAX_REQUEST_BYTES } from '../src/index.js';

const USER_TOKEN = 'test-user-token';
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=';
const env = (run = async () => ({ answer: 'AfuChat visual search' })) => ({
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
  AI: { run },
});
const req = (path, options = {}) => new Request('https://worker.test' + path, options);
const authHeaders = { authorization: 'Bearer ' + USER_TOKEN, 'content-type': 'application/json' };
const dataUri = 'data:image/png;base64,' + pngBase64;

async function withFetch(handler, callback) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try { return await callback(); } finally { globalThis.fetch = original; }
}
const authFetch = async (url, options) => {
  assert.equal(url, 'https://project.supabase.co/auth/v1/user');
  assert.equal(options.headers.apikey, 'sb_publishable_test_key');
  assert.equal(options.headers.authorization, 'Bearer ' + USER_TOKEN);
  return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
};

test('health endpoint is public and does not call AI or auth', async () => {
  await withFetch(() => { throw new Error('must not fetch'); }, async () => {
    const response = await worker.fetch(req('/health'), env(() => { throw new Error('must not run'); }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: 'afusearch-ocr' });
  });
});

test('unknown route returns 404', async () => {
  assert.equal((await worker.fetch(req('/anything'), env())).status, 404);
});

test('OCR endpoint requires POST and a valid user bearer token', async () => {
  assert.equal((await worker.fetch(req('/ocr'), env())).status, 405);
  const response = await worker.fetch(req('/ocr', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  }), env());
  assert.equal(response.status, 401);
});

test('invalid user session is rejected without invoking AI', async () => {
  await withFetch(async () => new Response('{}', { status: 401 }), async () => {
    const response = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ image: dataUri }),
    }), env(() => { throw new Error('must not run'); }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'unauthorized' });
  });
});

test('auth service errors fail closed', async () => {
  await withFetch(async () => { throw new Error('network details'); }, async () => {
    const response = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: '{}',
    }), env());
    assert.equal(response.status, 401);
  });
});

test('rejects malformed JSON and oversized request bodies', async () => {
  await withFetch(authFetch, async () => {
    const malformed = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: '{',
    }), env());
    assert.equal(malformed.status, 400);
    const tooLarge = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: ' '.repeat(MAX_REQUEST_BYTES + 1),
    }), env());
    assert.equal(tooLarge.status, 413);
  });
});

test('rejects unsupported content types', async () => {
  await withFetch(authFetch, async () => {
    const response = await worker.fetch(req('/ocr', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + USER_TOKEN, 'content-type': 'text/plain' },
      body: 'x',
    }), env());
    assert.equal(response.status, 415);
  });
});

test('valid PNG is sent to the OCR model and text is returned', async () => {
  await withFetch(authFetch, async () => {
    let called = false;
    const response = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ image: dataUri }),
    }), env(async (model, input) => {
      called = true;
      assert.equal(model, '@cf/moondream/moondream3.1-9B-A2B');
      assert.equal(input.task, 'query');
      assert.equal(input.reasoning, false);
      assert.equal(input.temperature, 0);
      assert.equal(input.max_tokens, 2048);
      assert.equal(input.stream, false);
      assert.match(input.question, /Transcribe every piece of visible text/);
      assert.equal(input.image, dataUri);
      return { answer: ' AfuChat visual search ' };
    }));
    assert.equal(response.status, 200);
    assert.equal(called, true);
    assert.deepEqual(await response.json(), { ok: true, text: 'AfuChat visual search', hasText: true });
  });
});

test('returns empty text when no text is recognized', async () => {
  await withFetch(authFetch, async () => {
    const response = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ image: dataUri }),
    }), env(async () => ({ answer: '' })));
    assert.deepEqual(await response.json(), { ok: true, text: '', hasText: false });
  });
});

test('rejects missing, invalid, mismatched and oversized images', () => {
  assert.equal(parseImageInput('').error, 'image_required');
  assert.equal(parseImageInput('not-base64', 'image/png').error, 'invalid_image_data');
  assert.equal(parseImageInput('data:image/png;base64,' + btoa('not an image')).error, 'image_signature_mismatch');
  const oversized = 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES + 1) * 4 / 3));
  assert.equal(parseImageInput(oversized, 'image/png').error, 'image_too_large');
  assert.ok(MAX_REQUEST_BYTES > MAX_IMAGE_BYTES);
});

test('does not expose AI provider errors', async () => {
  await withFetch(authFetch, async () => {
    const response = await worker.fetch(req('/ocr', {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ image: dataUri }),
    }), env(async () => { throw new Error('sensitive provider details'); }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'ocr_temporarily_unavailable' });
  });
});

test('does not support the removed test-secret bypass', async () => {
  const response = await worker.fetch(req('/ocr', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ocr-test-secret': 'anything' },
    body: JSON.stringify({ text: 'FAKE' }),
  }), env());
  assert.equal(response.status, 401);
});
