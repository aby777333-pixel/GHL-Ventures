#!/usr/bin/env node
/* ================================================================
   SEO VERIFICATION

   Checks the live site for every item in the indexing layer. Run it after a
   deploy to confirm the changes actually landed, and again any time something
   looks wrong in Search Console.

     node scripts/verify-seo.mjs                                  # ghlindiaventures.com
     node scripts/verify-seo.mjs https://ghl-india-ventures-2025.netlify.app

   Exits non-zero if anything fails, so it can gate a deploy script.

   NOTE: ghlindiaventures.com is served by nginx + a Next.js server on a
   DigitalOcean droplet, NOT by Netlify — Netlify is a mirror. The two hosts
   deploy separately, so a green run against one says nothing about the other.
   Header checks (X-Robots-Tag, www 301) come from netlify.toml and only apply
   on the Netlify host until the equivalent rules exist in the droplet's nginx
   config.
   ================================================================ */

const BASE = (process.argv[2] || 'https://ghlindiaventures.com').replace(/\/+$/, '')
const IS_NETLIFY = BASE.includes('netlify.app')

let pass = 0
let fail = 0
const failures = []

function ok(name, detail = '') {
  pass++
  console.log(`  \x1b[32mPASS\x1b[0m  ${name}${detail ? ` — ${detail}` : ''}`)
}
function bad(name, detail = '') {
  fail++
  failures.push(name)
  console.log(`  \x1b[31mFAIL\x1b[0m  ${name}${detail ? ` — ${detail}` : ''}`)
}
function skip(name, why) {
  console.log(`  \x1b[90mSKIP\x1b[0m  ${name} — ${why}`)
}

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', ...opts })
  return res
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}

// ── 1. Static discovery files ───────────────────────────────────────────
section('Discovery files')
for (const [path, label] of [
  ['/robots.txt', 'robots.txt'],
  ['/llms.txt', 'llms.txt'],
  ['/sitemap.xml', 'sitemap.xml'],
  ['/blog/rss.xml', 'RSS feed'],
  ['/16be859375aa627df31aa4f390aaa336.txt', 'IndexNow key file'],
]) {
  try {
    const res = await get(path)
    res.status === 200 ? ok(label) : bad(label, `HTTP ${res.status}`)
  } catch (e) {
    bad(label, e.message)
  }
}

try {
  const res = await get('/feed.xml')
  if (res.status === 200) ok('/feed.xml alias')
  else if (IS_NETLIFY) bad('/feed.xml alias', `HTTP ${res.status}`)
  else skip('/feed.xml alias', 'netlify.toml rewrite; needs an nginx rule on the droplet')
} catch (e) { bad('/feed.xml alias', e.message) }

// ── 2. robots.txt content ───────────────────────────────────────────────
section('robots.txt directives')
try {
  const txt = await (await get('/robots.txt')).text()
  for (const agent of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot']) {
    txt.includes(agent) ? ok(`${agent} has a group`) : bad(`${agent} has a group`)
  }
  // /login must be crawlable so the noindex is actually seen
  const loginIsBlocked = /^Disallow:\s*\/login\b/m.test(txt)
  loginIsBlocked
    ? bad('/login is crawlable', 'still Disallow-ed; the noindex will never be read')
    : ok('/login is crawlable')
  txt.includes('Sitemap: ') ? ok('sitemap declared') : bad('sitemap declared')
} catch (e) { bad('robots.txt content', e.message) }

// ── 3. Sitemap hygiene ──────────────────────────────────────────────────
section('Sitemap hygiene')
let locs = []
try {
  const xml = await (await get('/sitemap.xml')).text()
  locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
  ok('sitemap parses', `${locs.length} URLs`)

  const noSlash = locs.filter((u) => !u.endsWith('/'))
  noSlash.length === 0
    ? ok('every URL ends in a trailing slash')
    : bad('every URL ends in a trailing slash', `${noSlash.length} do not, e.g. ${noSlash[0]}`)

  const wrongHost = locs.filter((u) => !u.startsWith('https://ghlindiaventures.com/'))
  wrongHost.length === 0
    ? ok('every URL is on the canonical host')
    : bad('every URL is on the canonical host', `e.g. ${wrongHost[0]}`)

  const stamps = new Set([...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]))
  stamps.size > 1
    ? ok('lastmod carries real dates', `${stamps.size} distinct values`)
    : bad('lastmod carries real dates', 'every URL has the same stamp — engines will ignore it')
} catch (e) { bad('sitemap', e.message) }

// ── 4. Every sitemap URL resolves 200 ───────────────────────────────────
section('Sitemap URLs resolve (no redirects, no 404s)')
if (locs.length === 0) {
  skip('URL sweep', 'no sitemap URLs to check')
} else {
  /* Sweep the sitemap's PATHS against BASE, not its absolute URLs. The <loc>
     values always name ghlindiaventures.com, so sweeping them verbatim while
     checking the Netlify mirror would silently test the droplet instead and
     report its state as the mirror's. */
  const results = []
  const queue = locs.map((u) => {
    try { return BASE + new URL(u).pathname } catch { return u }
  })
  async function worker() {
    while (queue.length) {
      const url = queue.shift()
      try {
        const res = await fetch(url, { redirect: 'manual', method: 'GET' })
        results.push({ url, status: res.status })
      } catch (e) {
        results.push({ url, status: `ERR ${e.message}` })
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))

  const notOk = results.filter((r) => r.status !== 200)
  notOk.length === 0
    ? ok(`all ${results.length} sitemap URLs return 200`)
    : bad(`all ${results.length} sitemap URLs return 200`, `${notOk.length} did not`)
  for (const r of notOk.slice(0, 10)) console.log(`          ${r.status}  ${r.url}`)
  if (notOk.length > 10) console.log(`          … and ${notOk.length - 10} more`)
}

// ── 5. Structured data ──────────────────────────────────────────────────
section('Structured data on the homepage')
try {
  const html = await (await get('/')).text()
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]) } catch { return null } })

  blocks.every(Boolean)
    ? ok('all JSON-LD blocks parse', `${blocks.length} blocks`)
    : bad('all JSON-LD blocks parse', 'at least one is malformed')

  const types = blocks.filter(Boolean).flatMap((b) => [].concat(b['@type'] || []))
  for (const t of ['Organization', 'WebSite', 'FAQPage']) {
    types.includes(t) ? ok(`${t} node present`) : bad(`${t} node present`)
  }

  const org = blocks.find((b) => b && [].concat(b['@type'] || []).includes('Organization'))
  org?.employee?.length ? ok('leadership as Person nodes', `${org.employee.length} people`) : bad('leadership as Person nodes')
  org?.identifier?.value === 'IN/AIF2/24-25/1517' ? ok('SEBI number as an identifier') : bad('SEBI number as an identifier')

  html.includes('application/rss+xml') ? ok('RSS advertised in <head>') : bad('RSS advertised in <head>')

  // The fake "Live News" ticker must stay gone.
  const tickerIsBack = /SENSEX rallies 450|>Live News</.test(html)
  tickerIsBack
    ? bad('hardcoded market ticker removed', 'the invented headlines are back')
    : ok('hardcoded market ticker removed')

  html.includes('Director - IT') ? ok('Abe Abrams — Director - IT') : bad('Abe Abrams — Director - IT')
} catch (e) { bad('homepage structured data', e.message) }

// ── 6. noindex on auth + console routes ─────────────────────────────────
section('noindex where it matters')
for (const path of ['/login/', '/register/']) {
  try {
    const res = await get(path)
    const header = res.headers.get('x-robots-tag') || ''
    const body = res.status === 200 ? await res.text() : ''
    const metaNoindex = /<meta name="robots" content="[^"]*noindex/i.test(body)

    if (header.includes('noindex')) ok(`${path} X-Robots-Tag`)
    else if (IS_NETLIFY) bad(`${path} X-Robots-Tag`, header ? `got "${header}"` : 'header absent')
    else skip(`${path} X-Robots-Tag`, 'netlify.toml header; needs an nginx rule on the droplet')

    metaNoindex ? ok(`${path} meta robots noindex`) : bad(`${path} meta robots noindex`)
  } catch (e) { bad(`${path} noindex`, e.message) }
}

// ── 7. Host canonicalisation ────────────────────────────────────────────
section('Host canonicalisation')
/* www.ghlindiaventures.com is a DNS alias of the apex, so it always lands on
   the droplet whichever BASE we are checking — the netlify.toml redirect can
   never fire for it. Reported, never failed, when checking the mirror. */
try {
  const res = await fetch('https://www.ghlindiaventures.com/about/', { redirect: 'manual' })
  if ([301, 308].includes(res.status)) {
    ok('www 301s to the apex', res.headers.get('location') || '')
  } else if (IS_NETLIFY) {
    skip('www 301s to the apex', `HTTP ${res.status} — www resolves to the droplet, so this needs an nginx server block there, not netlify.toml`)
  } else {
    bad('www 301s to the apex', `HTTP ${res.status} — both hosts serve 200, which splits every page into two crawlable URLs`)
  }
} catch (e) { bad('www canonicalisation', e.message) }

// ── Summary ─────────────────────────────────────────────────────────────
console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m  (${BASE})`)
if (fail) {
  console.log('\nFailed:')
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
}
