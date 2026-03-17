import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'

let supabase
let client

const SITES = [
  { brand: 'Tele2', url: 'https://www.tele2.se' },
  { brand: 'Telia', url: 'https://www.telia.se' },
  { brand: 'Telenor', url: 'https://www.telenor.se' },
  { brand: 'Tre', url: 'https://www.tre.se' },
  { brand: 'Comviq', url: 'https://www.comviq.se' },
]

const PAGE_FUNCTION = String.raw`async function pageFunction({ page, request }) { const results = []; const elements = await page.$$eval('h1,h2,h3,h4,span,p,div,a', els => els.map(el => ({ tag: el.tagName.toLowerCase(), text: el.innerText?.trim() || '' }))); const patterns = [/rea/i,/sale/i,/rabatt/i,/kampanj/i,/erbjudande/i,/upp till/i,/opptil/i,/bis zu/i,/-\\d+%/,/\\d+%/,/spara/i,/fynd/i,/salg/i,/tilbud/i,/udsalg/i,/membre/i,/member/i,/klubb/i,/gratis/i,/free/i,/månader gratis/i,/kr\\/mån/i,/exclusive offer/i,/sista chansen/i,/last chance/i,/vid köp av/i,/limited/i]; const noise = [/cookie/i,/gdpr/i,/privacy/i,/logga in/i,/kundservice/i,/instagram/i,/facebook/i,/genom att/i,/villkor/i,/integritet/i]; return elements.filter(el => { if(el.text.length < 5 || el.text.length > 200) return false; if(noise.some(p=>p.test(el.text))) return false; return patterns.some(p=>p.test(el.text)); }).map(el=>({url:request.url,tag:el.tag,text:el.text})); }`

const PRICE_REGEX =
  /(-\d+%|\b\d+%\b|\b\d+\s?kr\b|\b\d+\s?kr\/mån\b|\b\d+\s?månader gratis\b|\bfree\s?\d+\b)/i

function extractPricePattern(text) {
  const t = (text || '').trim()
  if (!t) return null
  const m = t.match(PRICE_REGEX)
  return m?.[0] ?? null
}

function detectLanguage(text) {
  const t = (text || '').toLowerCase()
  if (!t) return 'en'

  if (
    /\b(rea|rabatt|kampanj|erbjudande|spara|upp till|månader gratis|sista chansen|begränsat)\b/.test(
      t,
    )
  )
    return 'sv'
  if (/\b(tilbud|opptil|salg|spar|begrenset)\b/.test(t)) return 'no'
  if (/\b(tilbud|udsalg|spar|begrænset)\b/.test(t)) return 'da'
  if (/\b(alennus|tarjous|säästä)\b/.test(t)) return 'fi'
  if (/\b(bis zu|angebot|rabatt|sparen)\b/.test(t)) return 'de'
  return 'en'
}

const DISCOUNT_PATTERNS = [
  /-\d+%/i,
  /\b\d+%\b/i,
  /\brea\b/i,
  /\bsale\b/i,
  /\brabatt\b/i,
  /\bkampanj\b/i,
  /\bupp till\b/i,
  /\bspara\b/i,
  /\bgratis\b/i,
  /\bfree\b/i,
  /\bmånader gratis\b/i,
  /\bkr\/mån\b/i,
]
const MEMBERSHIP_PATTERNS = [/\bmedlem\b/i, /\bmember\b/i, /\bklubb\b/i, /\bvip\b/i]
const BUNDLE_PATTERNS = [/\bvid köp av\b/i, /\bköp\s*2\b/i, /\bbuy\s*2\b/i, /\bpakket\b/i]
const URGENCY_PATTERNS = [
  /\bsista chansen\b/i,
  /\blast chance\b/i,
  /\blimited\b/i,
  /\bbegränsat\b/i,
]

function classifyOfferType(text) {
  const t = (text || '').trim()
  if (!t) return 'general'
  if (MEMBERSHIP_PATTERNS.some((p) => p.test(t))) return 'membership'
  if (BUNDLE_PATTERNS.some((p) => p.test(t))) return 'bundle'
  if (URGENCY_PATTERNS.some((p) => p.test(t))) return 'urgency'
  if (DISCOUNT_PATTERNS.some((p) => p.test(t))) return 'discount'
  return 'general'
}

function assertEnv() {
  const missing = []
  if (!process.env.VITE_APIFY_TOKEN) missing.push('VITE_APIFY_TOKEN')
  if (!process.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
  if (!process.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`)
}

async function scrapeSite({ brand, url }) {
  const input = {
    startUrls: [{ url }],
    pageFunction: PAGE_FUNCTION,
    maxRequestsPerCrawl: 1,
    navigationTimeoutSecs: 60,
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL'],
    },
  }

  const run = await client.actor('apify~playwright-scraper').call(input)
  const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 999999 })

  const today = new Date().toISOString().slice(0, 10)
  const rows = (items || [])
    .map((it) => {
      const foundText = (it?.text || '').trim()
      if (!foundText) return null
      return {
        brand,
        url,
        found_text: foundText,
        offer_type: classifyOfferType(foundText),
        language: detectLanguage(foundText),
        element: it?.tag || null,
        price_pattern: extractPricePattern(foundText),
        scraped_at: today,
      }
    })
    .filter(Boolean)

  // De-dupe within site run
  const seen = new Set()
  const deduped = rows.filter((r) => {
    const key = `${r.brand}|${r.url}|${r.found_text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { brand, url, offers: deduped }
}

async function main() {
  assertEnv()
  supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  client = new ApifyClient({ token: process.env.VITE_APIFY_TOKEN })
  console.log(`[daily] Starting scrape for ${SITES.length} sites`)

  const settled = await Promise.allSettled(SITES.map((s) => scrapeSite(s)))

  const allRows = []
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      console.log(`[daily] ${s.value.brand}: ${s.value.offers.length} offers`)
      allRows.push(...s.value.offers)
    } else {
      console.error('[daily] scrape error:', s.reason?.message || s.reason)
    }
  }

  if (!allRows.length) {
    console.log('[daily] No rows to insert')
    return
  }

  // Final de-dupe across all sites
  const seen = new Set()
  const deduped = allRows.filter((r) => {
    const key = `${r.brand}|${r.url}|${r.found_text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`[daily] Inserting ${deduped.length} rows into Supabase`)
  const { error } = await supabase.from('offers').insert(deduped)
  if (error) throw error
  console.log('[daily] Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

