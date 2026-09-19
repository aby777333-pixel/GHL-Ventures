/* ================================================================
   INDEXNOW — Netlify Serverless Function

   Pushes changed URLs to the IndexNow protocol, which fans a single
   submission out to Bing, Yandex, Naver, Seznam and Yep. Typical effect is
   indexing in minutes to hours.

   Google does NOT participate in IndexNow — it announced a test in 2021 and
   still has not adopted it. Google is covered by the sitemap and Search
   Console, not by this endpoint. Anything marketing "instant indexing" on the
   back of IndexNow is describing Bing's world only. That is still worth
   having: Bing's index feeds Yahoo, DuckDuckGo, Microsoft Copilot and
   ChatGPT's search retrieval layer.

   ─── Usage ───────────────────────────────────────────────────────────────
   Submit the whole sitemap (the normal post-deploy case):
     POST /api/indexnow          {}                  — or GET /api/indexnow
   Submit specific URLs (e.g. one article just published in the CMS):
     POST /api/indexnow          { "urlList": ["https://ghlindiaventures.com/blog/x/"] }

   ─── Safety ──────────────────────────────────────────────────────────────
   Every URL is filtered against HOST before submission, so this endpoint can
   never be used to submit somebody else's site. If INDEXNOW_TRIGGER_SECRET is
   set in the Netlify environment, an `Authorization: Bearer <secret>` header
   is required as well; if it is not set, the host filter alone is the guard.

   The KEY below is not a secret. The protocol requires it to be publicly
   readable at https://<host>/<key>.txt — that file IS the proof of domain
   ownership. It lives at public/16be859375aa627df31aa4f390aaa336.txt.
   If you rotate the key, rename that file and change KEY here together.
   ================================================================ */

const HOST = 'ghlindiaventures.com'
const KEY = '16be859375aa627df31aa4f390aaa336'
const SITE_URL = `https://${HOST}`
const MAX_URLS = 10000 // protocol limit per request

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/* Only our own canonical https URLs. Anything else is dropped rather than
   rejected, so one stale entry cannot fail an otherwise good submission. */
function ownUrlsOnly(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  const out: string[] = []
  for (const u of urls) {
    if (typeof u !== 'string') continue
    try {
      const parsed = new URL(u.trim())
      if (parsed.protocol === 'https:' && parsed.hostname === HOST) out.push(parsed.toString())
    } catch { /* not a URL — drop it */ }
  }
  return Array.from(new Set(out)).slice(0, MAX_URLS)
}

/* Read the live sitemap rather than keeping a second list of URLs here. The
   sitemap is already the single source of truth for what should be indexed,
   so the two can never drift apart. */
async function urlsFromSitemap(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { 'User-Agent': 'GHL-IndexNow/1.0' },
  })
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`)
  const xml = await res.text()
  const locs = xml.match(/<loc>\s*([^<]+?)\s*<\/loc>/g) ?? []
  return ownUrlsOnly(locs.map((l) => l.replace(/<\/?loc>/g, '').trim()))
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (request.method !== 'POST' && request.method !== 'GET') {
    return json({ error: 'method not allowed' }, 405)
  }

  const secret = process.env.INDEXNOW_TRIGGER_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'unauthorized' }, 401)
  }

  try {
    let urlList: string[] = []

    if (request.method === 'POST') {
      // An empty or unparseable body means "submit everything", which is the
      // normal post-deploy call.
      const body = await request.json().catch(() => ({} as Record<string, unknown>))
      urlList = ownUrlsOnly((body as { urlList?: unknown }).urlList)
    }
    if (urlList.length === 0) urlList = await urlsFromSitemap()

    if (urlList.length === 0) {
      return json({ submitted: 0, note: 'no eligible URLs — nothing sent' })
    }

    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `${SITE_URL}/${KEY}.txt`,
        urlList,
      }),
    })

    /* 200 accepted · 202 accepted, key validation pending · 400 bad request
       403 key not found at keyLocation · 422 URLs do not match host
       429 too many requests */
    return json({
      submitted: urlList.length,
      indexNowStatus: res.status,
      accepted: res.status === 200 || res.status === 202,
      sample: urlList.slice(0, 5),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error'
    return json({ error: message }, 500)
  }
}
