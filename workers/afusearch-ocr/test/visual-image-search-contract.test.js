import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Supabase visual search sends the documented OCR JSON contract', async () => {
  const sourceUrl = new URL('../../../supabase/functions/visual-image-search/index.ts', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  assert.match(source, /OCR_SERVICE_URL = "https:\/\/afusearch-ocr\.afuchatgroup\.workers\.dev\/ocr"/);
  assert.match(source, /headers: \{ authorization, "content-type": "application\/json" \}/);
  assert.match(source, /body: JSON\.stringify\(\{ image \}\)/);
  assert.match(source, /extractImageText\(fetched\.bytes, fetched\.mimeType, authorization\)/);
  assert.match(source, /extractImageText\(imageBytes, mimeType, authorization\)/);
  assert.doesNotMatch(source, /"content-type": "application\/octet-stream"/);
});

test('visual search backfill is bounded for Workers AI Free allocation', async () => {
  const sourceUrl = new URL('../../../supabase/functions/visual-image-search/index.ts', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  assert.match(source, /const MAX_INDEX_PER_WARMUP = 2;/);
  assert.match(source, /const MAX_WARMUP_DEPTH = 1;/);
  assert.match(source, /processPendingOcr\(admin, authorization, 2\)/);
});
