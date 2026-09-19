# SEO & deployment notes

Operational notes for the discoverability layer. Everything here is something
that has already bitten us once.

---

## 1. Always clear the Netlify build cache when content changed

**This is not optional housekeeping. It decides whether new articles get
indexed at all.**

Next.js caches `fetch()` responses in `.next/cache`, and Netlify restores that
directory between deploys. Every build-time Supabase read — `generateStaticParams()`
for `/blog/[slug]` and `/financial-iq/[slug]`, and `app/sitemap.ts` — goes
through that same patched `fetch`. On a warm cache the build is handed the
article list *as it was at some earlier deploy*.

Observed on 19 Sep 2026:

| Build                    | Financial IQ pages pre-rendered |
| ------------------------ | ------------------------------- |
| warm `.next/cache`       | 24                              |
| after `rm -rf .next`     | 26 (correct)                    |

The two missing articles were published on 8 and 15 September. They existed on
the live site only as client-rendered shells: a browser could read them, but
the AI retrieval crawlers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`)
do not execute JavaScript, so to them the pages were blank. They were also
absent from the sitemap.

**So: whenever a deploy is meant to publish new or edited content, trigger it
with "Clear cache and deploy site" in Netlify, not a plain deploy.** A deploy
that only changes styling does not need it.

### Why this is not fixed in code

It looks like a one-line fix — give the Supabase client a `cache: 'no-store'`
fetch. Both obvious places to put it are actively harmful under
`output: 'export'`, and both were tried and reverted:

- **In `lib/supabase/client.ts`** (the shared client): `app/sitemap.ts` is a
  statically generated route, and a `no-store` fetch inside one throws
  `Dynamic server usage`. The sitemap's own `try/catch` swallows it, so the
  build still succeeds — and ships a sitemap with **every blog URL missing**.
- **In `app/financial-iq/[slug]/page.tsx`** (its own client): a `no-store`
  fetch in `generateStaticParams()` marks the route dynamic, and Next then
  emits **no static pages for it at all**. The build still succeeds, still
  logs `pre-building 26 article pages`, and `out/financial-iq/` contains only
  the index.

Both files carry a comment saying so. Please do not re-add it.

---

## 2. Trailing slashes

`next.config.js` sets `trailingSlash: true`, so `/about/` is the URL that
returns 200 and `/about` 308-redirects to it.

Next applies this to `<link rel="canonical">` automatically. It does **not**
apply it to `app/sitemap.ts`, which is why that file builds every `<loc>`
through the `abs()` helper. Never concatenate a sitemap URL by hand — a
sitemap full of redirects turns the Search Console coverage report into a wall
of "Page with redirect".

---

## 3. robots.txt groups

A crawler obeys exactly one group — the most specific one matching its
user-agent — and ignores every other group, **including `*`**. That is why
`public/robots.txt` repeats the same `Disallow:` list inside each named group.
Adding a new private path means adding it to *every* group, not just the first.

---

## 4. noindex vs Disallow

`robots.txt` controls crawling, not indexing. A `Disallow`-ed URL can still be
listed in results as a bare link, because the crawler is forbidden from
fetching the page and therefore never sees the `noindex`.

So anything that must genuinely stay out of the index is **crawlable** and
carries `noindex`:

- `/login/` and `/register/` — allowed in `robots.txt`, `noindex, follow` via
  both a layout `metadata.robots` and an `X-Robots-Tag` header in
  `netlify.toml`.
- The gated consoles (`/admin/`, `/staff/`, `/dashboard/`, `/investor/`,
  `/agent/`, `/cms/`, `/auth/`) keep both the `Disallow` and the header. They
  are behind auth anyway; this is belt and braces.

Netlify header globs need both forms — `/login/*` alone does not reliably
match `/login/` itself.

---

## 5. IndexNow

Key file: `public/16be859375aa627df31aa4f390aaa336.txt`. This is **not** a
secret — the protocol requires it to be publicly readable, and that file *is*
the proof of domain ownership. If it is rotated, rename the file and change
`KEY` in `netlify/functions/indexnow.ts` together.

Ping after a content deploy:

```bash
npm run indexnow                                              # whole sitemap
npm run indexnow https://ghlindiaventures.com/blog/new-post/  # one page
```

Reaches Bing, Yandex, Naver, Seznam and Yep — and through Bing, that covers
DuckDuckGo, Microsoft Copilot and ChatGPT's search retrieval. **Google does
not participate in IndexNow** and is covered by the sitemap and Search Console
instead. Verify submissions in Bing Webmaster Tools → IndexNow.

Deliberately not wired in as an automatic Netlify build plugin: a plugin that
throws fails the deploy, and an indexing ping is not worth that risk.

---

## 6. Search Console / Bing verification

Set in the Netlify build environment, then redeploy (`NEXT_PUBLIC_*` values
inline at build time):

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_BING_SITE_VERIFICATION`

Leave them unset and no meta tag is emitted at all.

The DNS TXT **Domain property** is the better method — one property covers the
apex, `www` and both protocols — and it is what the Pages / Indexing report
should be read from. The meta tag is the fallback when DNS is not immediately
available.
