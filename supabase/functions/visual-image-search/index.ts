// AfuSearch visual-image-search combines perceptual hashing, OCR, and the public AfuChat search index.


import { createClient } from "npm:@supabase/supabase-js@2";
import jpeg from "npm:jpeg-js@0.4.4";
import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OCR_SERVICE_URL = "https://afusearch-ocr.afuchatgroup.workers.dev/ocr";
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_INDEX_PER_WARMUP = 6;
const MAX_WARMUP_DEPTH = 20;
const INDEX_BATCH_SIZE = 2;
const MAX_CANDIDATE_POSTS = 200;
const MAX_SCAN_PAGES = 50;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_DISTANCE = 10;
let indexWarmupPromise: Promise<void> | null = null;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function decodeBase64(value: string): Uint8Array {
  // Reject oversized input before atob allocates a decoded string.
  if (value.length > Math.ceil(MAX_INPUT_BYTES / 3) * 4) {
    throw new Error("Image is too large. Choose an image under 8 MB.");
  }
  const raw = atob(value);
  if (raw.length > MAX_INPUT_BYTES) throw new Error("Image is too large. Choose an image under 8 MB.");
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function decodePixels(bytes: Uint8Array, mimeType = ""): { data: Uint8Array; width: number; height: number } {
  const type = mimeType.toLowerCase();
  if (type.includes("png") || (bytes[0] === 0x89 && bytes[1] === 0x50)) {
    const decoded = PNG.sync.read(Buffer.from(bytes));
    return { data: decoded.data, width: decoded.width, height: decoded.height };
  }
  if (type.includes("jpeg") || type.includes("jpg") || (bytes[0] === 0xff && bytes[1] === 0xd8)) {
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return { data: decoded.data, width: decoded.width, height: decoded.height };
  }
  throw new Error("This image format is not supported yet. Choose a JPEG or PNG image.");
}

// 64-bit difference hash: sample a 9×8 grayscale grid and compare adjacent pixels.
function differenceHash(bytes: Uint8Array, mimeType = ""): string {
  const image = decodePixels(bytes, mimeType);
  if (!image.width || !image.height || image.width * image.height > 40_000_000) {
    throw new Error("Image dimensions are not supported.");
  }
  const gray = (x: number, y: number) => {
    const sx = Math.min(image.width - 1, Math.floor((x + 0.5) * image.width / 9));
    const sy = Math.min(image.height - 1, Math.floor((y + 0.5) * image.height / 8));
    const offset = (sy * image.width + sx) * 4;
    return 0.299 * image.data[offset] + 0.587 * image.data[offset + 1] + 0.114 * image.data[offset + 2];
  };
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      hash = (hash << 1n) | (gray(x, y) > gray(x + 1, y) ? 1n : 0n);
    }
  }
  return hash.toString(16).padStart(16, "0");
}


function allowedImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      host === "afuchat.com" ||
      host.endsWith(".afuchat.com") ||
      host.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!allowedImageUrl(url)) return null;
  try {
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const rawContentType = response.headers.get("content-type") ?? "";
    const mimeType = rawContentType.split(";")[0].trim().toLowerCase();
    if (mimeType !== "image/jpeg" && mimeType !== "image/png") return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_IMAGE_BYTES) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    if (!totalBytes) return null;
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

async function extractImageText(bytes: Uint8Array, mimeType: string, authorization: string): Promise<string | null> {
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_IMAGE_BYTES) return null;
  if (mimeType !== "image/jpeg" && mimeType !== "image/png") return null;
  try {
    // Keep the Worker contract explicit: send the original compressed image as
    // a base64 data URI, not compressed bytes masquerading as RGBA pixels.
    const image = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
    const response = await fetch(OCR_SERVICE_URL, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ image }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) {
      console.error("[visual-image-search] OCR service returned", response.status);
      return null;
    }
    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload.text !== "string") return null;
    return payload.text.split("").filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    }).join("").trim().slice(0, 5000);
  } catch (error) {
    console.error("[visual-image-search] OCR request failed", error instanceof Error ? error.message : error);
    return null;
  }
}

async function countPendingOcr(admin: ReturnType<typeof createClient>): Promise<number> {
  const retryBefore = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("visual_image_index")
    .select("image_url", { count: "exact", head: true })
    .or(`ocr_processed_at.is.null,and(ocr_text.eq.,ocr_processed_at.lt.${retryBefore})`);
  if (error) throw new Error(`Pending OCR count failed: ${error.message}`);
  return count ?? 0;
}

async function processPendingOcr(
  admin: ReturnType<typeof createClient>,
  authorization: string,
  limit = 30,
): Promise<number> {
  const retryBefore = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await admin
    .from("visual_image_index")
    .select("image_url,post_id,ocr_text")
    .or(`ocr_processed_at.is.null,and(ocr_text.eq.,ocr_processed_at.lt.${retryBefore})`)
    .limit(Math.min(Math.max(limit, 1), 60));
  if (error) throw new Error(`Pending OCR lookup failed: ${error.message}`);
  let processed = 0;
  const pending = rows ?? [];
  for (let offset = 0; offset < pending.length; offset += 3) {
    const batch = pending.slice(offset, offset + 3);
    const outcomes = await Promise.all(batch.map(async (row) => {
      const fetched = await fetchImageBytes(row.image_url);
      const text = fetched ? await extractImageText(fetched.bytes, fetched.mimeType, authorization) : null;
      if (text === null) {
        const { error: retryError } = await admin
          .from("visual_image_index")
          .update({ ocr_processed_at: new Date().toISOString() })
          .eq("image_url", row.image_url);
        if (retryError) console.error("[visual-image-search] OCR retry timestamp failed", retryError.message);
        return false;
      }
      const { error: updateError } = await admin
        .from("visual_image_index")
        .update({ ocr_text: text, ocr_processed_at: new Date().toISOString() })
        .eq("image_url", row.image_url);
      if (updateError) {
        console.error("[visual-image-search] OCR index write failed", updateError.message);
        return false;
      }
      return true;
    }));
    processed += outcomes.filter(Boolean).length;
  }
  return processed;
}

async function verifyUser(req: Request, admin: ReturnType<typeof createClient>): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  const { data, error } = await admin.auth.getUser(token);
  return !error && Boolean(data.user);
}

async function indexPublicImages(admin: ReturnType<typeof createClient>): Promise<number> {
  const pending = new Map<string, { post_id: string }>();

  for (let page = 0; page < MAX_SCAN_PAGES && pending.size < MAX_INDEX_PER_WARMUP; page++) {
    const from = page * MAX_CANDIDATE_POSTS;
    const { data: posts, error: postsError } = await admin
      .from("posts")
      .select("id,image_url,created_at,visibility,post_images(image_url,display_order)")
      .or("visibility.eq.public,visibility.is.null")
      .order("created_at", { ascending: false })
      .range(from, from + MAX_CANDIDATE_POSTS - 1);
    if (postsError) throw new Error(`Public image scan failed: ${postsError.message}`);
    if (!posts?.length) break;

    const pageOwners = new Map<string, { post_id: string }>();
    for (const post of posts) {
      const urls = [post.image_url, ...((post.post_images ?? []).map((item: { image_url?: string }) => item.image_url))];
      for (const url of urls) {
        if (allowedImageUrl(url) && !pageOwners.has(url)) pageOwners.set(url, { post_id: post.id });
      }
    }

    const pageUrls = [...pageOwners.keys()];
    for (let offset = 0; offset < pageUrls.length && pending.size < MAX_INDEX_PER_WARMUP; offset += INDEX_BATCH_SIZE) {
      // PostgREST encodes .in() values into the request URL. Keep each lookup
      // small so a large page of public image URLs cannot exceed URL limits.
      const urlBatch = pageUrls.slice(offset, offset + INDEX_BATCH_SIZE);
      const { data: existing, error: existingError } = await admin
        .from("visual_image_index")
        .select("image_url")
        .in("image_url", urlBatch);
      if (existingError) throw new Error(`Visual index lookup failed: ${existingError.message}`);

      const indexedUrls = new Set((existing ?? []).map((row) => row.image_url));
      for (const url of urlBatch) {
        const owner = pageOwners.get(url);
        if (owner && !indexedUrls.has(url) && !pending.has(url)) pending.set(url, owner);
        if (pending.size >= MAX_INDEX_PER_WARMUP) break;
      }
    }
    if (posts.length < MAX_CANDIDATE_POSTS) break;
  }

  let indexedCount = 0;
  const pendingRows = [...pending.entries()].slice(0, MAX_INDEX_PER_WARMUP);
  for (let offset = 0; offset < pendingRows.length; offset += INDEX_BATCH_SIZE) {
    const batch = pendingRows.slice(offset, offset + INDEX_BATCH_SIZE);
    const computed = await Promise.all(batch.map(async ([url, owner]) => {
      const fetched = await fetchImageBytes(url);
      if (!fetched) return null;
      try {
        return {
          image_url: url,
          post_id: owner.post_id,
          perceptual_hash: differenceHash(fetched.bytes, fetched.mimeType),
          ocr_text: "",
          ocr_processed_at: null,
        };
      } catch {
        return null;
      }
    }));
    const valid = computed.filter((row): row is { image_url: string; post_id: string; perceptual_hash: string; ocr_text: string; ocr_processed_at: string | null } => Boolean(row));
    if (!valid.length) continue;
    const { error: upsertError } = await admin
      .from("visual_image_index")
      .upsert(valid, { onConflict: "image_url" });
    if (upsertError) {
      console.error("[visual-image-search] index write failed", upsertError.message);
    } else {
      indexedCount += valid.length;
    }
  }

  return indexedCount;
}

function startIndexWarmup(
  admin: ReturnType<typeof createClient>,
  authorization: string,
  apiKey: string,
  depth = 0,
): boolean {
  if (indexWarmupPromise) return true;

  const warmupDepth = Math.max(0, Math.min(Math.trunc(depth), MAX_WARMUP_DEPTH));
  let shouldContinue = false;
  let task: Promise<void>;
  task = (async () => {
    const pendingBefore = await countPendingOcr(admin);
    // Drain existing OCR work first. Once it is empty, index the next small
    // public-image batch and OCR that batch, avoiding an ever-growing backlog.
    const indexedCount = pendingBefore === 0 ? await indexPublicImages(admin) : 0;
    const ocrCount = await processPendingOcr(admin, authorization, 6);
    const pendingAfter = await countPendingOcr(admin);
    shouldContinue = pendingBefore > 0 || pendingAfter > 0 || indexedCount >= MAX_INDEX_PER_WARMUP;
    console.log(`[visual-image-search] warmup depth=${warmupDepth}, indexed=${indexedCount}, OCR-processed=${ocrCount}, pending=${pendingAfter}`);
  })()
    .catch((error) => {
      console.error("[visual-image-search] background index warmup failed", error instanceof Error ? error.message : error);
    })
    .finally(async () => {
      if (indexWarmupPromise === task) indexWarmupPromise = null;
      if (!shouldContinue || warmupDepth >= MAX_WARMUP_DEPTH || !authorization || !apiKey) return;
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/visual-image-search`, {
          method: "POST",
          headers: {
            authorization,
            apikey: apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({ action: "warmup", warmupDepth: warmupDepth + 1 }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) console.error("[visual-image-search] OCR continuation failed", response.status);
      } catch (error) {
        console.error("[visual-image-search] OCR continuation request failed", error instanceof Error ? error.message : error);
      }
    });

  indexWarmupPromise = task;
  const edgeRuntime = (globalThis as typeof globalThis & {
    EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
  }).EdgeRuntime;
  if (typeof edgeRuntime?.waitUntil === "function") edgeRuntime.waitUntil(task);
  else void task;
  return true;
}

function isMissingVisualIndexSchema(error: unknown): boolean {
  const details = error as { code?: unknown; message?: unknown } | null;
  const code = String(details?.code ?? "");
  const message = String(details?.message ?? "");
  return ["42P01", "42883", "PGRST202", "PGRST205"].includes(code) ||
    /visual_image_index.*does not exist|find_visual_image_matches.*does not exist|could not find (the )?(table|function).*visual_image_index|could not find the function.*find_visual_image_matches/i.test(message);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Visual search is not configured." }, 503);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (!(await verifyUser(req, admin))) {
      console.warn("[visual-image-search] rejected request without a valid user session");
      return json({ error: "Please sign in to search images." }, 401);
    }

    const body = await req.json();
    if (body.action === "warmup") {
      startIndexWarmup(
        admin,
        req.headers.get("authorization") ?? "",
        req.headers.get("apikey") ?? "",
        Number.isFinite(body.warmupDepth) ? Number(body.warmupDepth) : 0,
      );
      return json({ indexing: true, message: "Visual search index warmup started." }, 202);
    }
    if (typeof body.imageBase64 !== "string" || !body.imageBase64) {
      return json({ error: "Choose an image to search." }, 400);
    }
    const imageBytes = decodeBase64(body.imageBase64);
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";
    const targetHash = differenceHash(imageBytes, mimeType);
    const sourceImageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const authorization = req.headers.get("authorization") ?? "";
    startIndexWarmup(admin, authorization, req.headers.get("apikey") ?? "", 0);
    const imageText = await extractImageText(imageBytes, mimeType, authorization);

    // Match the already-indexed corpus immediately; public image indexing is
    // scheduled separately so cold starts do not delay the user's search.
    // Index maintenance runs in a bounded background task; search results are returned independently.

    const [visualResult, ocrResult, contentResult] = await Promise.all([
      admin.rpc("find_visual_image_matches", {
        p_hash: targetHash,
        p_max_distance: MAX_DISTANCE,
        p_limit: 30,
      }),
      imageText ? admin.rpc("find_visual_text_matches", { p_query: imageText, p_limit: 20 }) : Promise.resolve({ data: [], error: null }),
      imageText ? admin.rpc("find_public_content_text_matches", { p_query: imageText, p_limit: 30 }) : Promise.resolve({ data: [], error: null }),
    ]);
    const matchedImages = visualResult.data;
    const matchError = visualResult.error;
    if (ocrResult.error) console.error("[visual-image-search] OCR text lookup failed", ocrResult.error.message);
    if (contentResult.error) console.error("[visual-image-search] public content text lookup failed", contentResult.error.message);
    if (matchError) {
      console.error("[visual-image-search] hash match query failed", matchError.message);
      const errorMessage = isMissingVisualIndexSchema(matchError)
        ? "Visual search index is not installed yet. Apply the visual image index migration."
        : "Visual search is temporarily unavailable. Please try again shortly.";
      return json({ error: errorMessage }, 503);
    }
    const candidates = (matchedImages ?? [])
      .filter((row: any) => row.image_url !== sourceImageUrl)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 30);
    const ocrCandidates = (ocrResult.data ?? [])
      .filter((row: any) => row.image_url !== sourceImageUrl)
      .sort((a: any, b: any) => Number(b.score) - Number(a.score))
      .slice(0, 20);
    const publicContent = (contentResult.data ?? [])
      .filter((row: any) => ["post", "video"].includes(row.source_type))
      .slice(0, 20);
    const postIds = [...new Set([
      ...candidates.map((row: any) => row.post_id),
      ...ocrCandidates.map((row: any) => row.post_id),
      ...publicContent.map((row: any) => row.source_id),
    ])];
    let postsById = new Map<string, any>();
    if (postIds.length) {
      const { data: matchedPosts, error: matchedError } = await admin
        .from("posts")
        .select("id,content,article_title,created_at,visibility,author_id")
        .in("id", postIds);
      if (matchedError) console.error("[visual-image-search] matched post lookup failed", matchedError.message);
      postsById = new Map((matchedPosts ?? [])
        .filter((post: any) => post.visibility === "public" || post.visibility == null)
        .map((post: any) => [post.id, post]));
    }

    const merged = new Map<string, any>();
    for (const row of candidates) {
      if (!postsById.has(row.post_id)) continue;
      const post = postsById.get(row.post_id);
      merged.set(row.post_id + "|" + row.image_url, {
        postId: row.post_id,
        imageUrl: row.image_url,
        content: String(post.content ?? post.article_title ?? "").slice(0, 220),
        createdAt: post.created_at,
        distance: row.distance,
        similarity: Math.round((64 - row.distance) / 64 * 100),
        matchType: "visual",
        score: (64 - row.distance) / 64,
      });
    }
    for (const row of ocrCandidates) {
      if (!postsById.has(row.post_id)) continue;
      const post = postsById.get(row.post_id);
      const key = row.post_id + "|" + row.image_url;
      const score = Math.max(0, Math.min(1, Number(row.score) || 0));
      const prior = merged.get(key);
      if (prior) {
        prior.score = Math.max(prior.score, score);
        prior.matchType = prior.matchType === "visual" ? "visual+text" : "text";
      } else {
        merged.set(key, {
          postId: row.post_id,
          imageUrl: row.image_url,
          content: String(post.content ?? post.article_title ?? row.ocr_text ?? "").slice(0, 220),
          createdAt: post.created_at,
          distance: 64 - Math.round(score * 64),
          similarity: Math.round(score * 100),
          matchType: "text",
          score,
        });
      }
    }
    for (const row of publicContent) {
      if (!postsById.has(row.source_id)) continue;
      const post = postsById.get(row.source_id);
      const key = row.source_id + "|content";
      if (merged.has(key)) continue;
      const score = Math.max(0, Math.min(1, Number(row.score) || 0));
      merged.set(key, {
        postId: row.source_id,
        imageUrl: null,
        content: String(row.title || row.body || post.content || post.article_title || "").slice(0, 220),
        createdAt: row.created_at || post.created_at,
        distance: 64 - Math.round(score * 64),
        similarity: Math.round(score * 100),
        matchType: "content-text",
        sourceType: row.source_type,
        score,
      });
    }
    const matches = [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return json({
      algorithm: "dhash+ocr+public-text",
      indexedThisRequest: 0,
      ocrTextAvailable: Boolean(imageText),
      matches,
      message: matches.length
        ? "Results combine visual similarity, text detected in images, and matching public AfuChat posts."
        : imageText
          ? "No close visual or text matches yet. OCR was read, but no matching public results were found."
          : "No close visual matches yet. Text extraction was unavailable for this image; try a smaller JPEG or PNG.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Visual search failed.";
    console.error("[visual-image-search] request failed", message);
    return json({ error: message }, 400);
  }
});
