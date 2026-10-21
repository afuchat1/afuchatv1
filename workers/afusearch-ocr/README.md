# AfuSearch OCR Worker

This Worker is a narrowly scoped OCR inference endpoint for the Supabase `visual-image-search` Edge Function. It does not index queries, write to the database, or serve general API requests.

## Request contract

`POST /ocr` accepts JSON containing `image`, a base64 data URI such as `data:image/jpeg;base64,...`. The caller must send a valid Supabase user access token in `Authorization: Bearer <access-token>`. The Worker verifies it against the configured Supabase Auth endpoint before invoking Workers AI. JPEG, PNG, WebP, and GIF are accepted, with matching file signatures, up to 3 MiB decoded size. The response is `{ "ok": true, "text": "...", "hasText": true }`.

`GET /health` is a non-sensitive liveness check. Other routes are rejected. There is no test-secret authentication bypass, permissive CORS policy, image URL fetching, or database/indexing logic in this Worker.

## Bindings and configuration

- Workers AI binding named `AI`.
- `SUPABASE_URL` variable set to the project URL.
- `SUPABASE_PUBLISHABLE_KEY` variable set to the project's publishable key (not a service-role/secret key).
- `workers_dev` remains enabled because the Supabase Edge Function calls the existing `afusearch-ocr.afuchatgroup.workers.dev` endpoint.

Do not configure any `OCR_TEST_SECRET` or equivalent bypass. Never put a Supabase service-role key in this Worker or client code.

## Free-plan guardrails

- One model inference per authenticated OCR request; no retry loop.
- 3 MiB image cap and approximately 4 MiB JSON body cap.
- AI model errors return a generic 503 response without leaking image data or provider details.
- Workers AI has a daily Free allocation; inference may fail after the account's quota is exhausted. Monitor usage and do not treat quota errors as empty OCR results.
- Uses Workers AI rather than running Tesseract WASM inference inside the Free Worker CPU budget.

## Local checks

Run `npm run check` in this directory. Tests mock Supabase Auth and the Workers AI binding. They validate API contracts and failure handling but do **not** prove live model accuracy, real Cloudflare quota behavior, or end-to-end production integration. Before release, run a remote staging smoke test with representative screenshots, confirm the real model returns `answer` with `stream: false`, and verify that `visual_image_index.ocr_text` is populated and `find_visual_text_matches` returns expected matches. Deploy only after those checks pass.
