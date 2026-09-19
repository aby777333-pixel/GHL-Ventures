#!/usr/bin/env node
/* ================================================================
   INDEXNOW PING

   Tells Bing, Yandex, Naver, Seznam and Yep that the site changed. Run it
   after a deploy that published new or updated content — there is no value in
   running it on a deploy that only changed styling.

     node scripts/indexnow-ping.mjs                     # whole sitemap
     node scripts/indexnow-ping.mjs <url> [<url> ...]   # specific pages

   If INDEXNOW_TRIGGER_SECRET is set in the Netlify environment, export the
   same value locally before running.

   Google does not participate in IndexNow. Google picks the site up from the
   sitemap and Search Console — see the header of netlify/functions/indexnow.ts.

   Deliberately NOT wired into the Netlify build as an automatic onSuccess
   plugin: a build plugin that throws fails the deploy, and an indexing ping
   is not worth that risk. This stays a manual, explicit step.
   ================================================================ */

const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://ghlindiaventures.com/api/indexnow'
const SECRET = process.env.INDEXNOW_TRIGGER_SECRET || ''

const urlList = process.argv.slice(2).filter(Boolean)

const headers = { 'Content-Type': 'application/json' }
if (SECRET) headers.Authorization = `Bearer ${SECRET}`

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(urlList.length ? { urlList } : {}),
  })
  const body = await res.text()

  if (!res.ok) {
    console.error(`IndexNow ping failed — HTTP ${res.status}`)
    console.error(body)
    process.exit(1)
  }

  console.log(`IndexNow ping accepted (HTTP ${res.status})`)
  console.log(body)
  console.log('\nVerify in Bing Webmaster Tools → IndexNow. Expect indexing within minutes to hours.')
} catch (err) {
  console.error(`IndexNow ping failed: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
}
