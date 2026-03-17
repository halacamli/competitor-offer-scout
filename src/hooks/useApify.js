import { useCallback, useMemo, useState } from 'react'

const pageFunction = `async function pageFunction({ page, request }) {
  await page.waitForTimeout(2000);
  
  var keywords = ['rea','sale','rabatt','kampanj','erbjudande',
    'upp till','opptil','spara','fynd','gratis','free',
    'salg','tilbud','udsalg','ale','alennus',
    'medlem','member','klubb','vip',
    'vid köp','köp 2','buy 2',
    'sista chansen','last chance','limited','begränsat',
    'månader gratis','kr/mån','exclusive offer',
    'mid-season','season sale','-25%','-30%','-40%','-50%','-60%'];

  var noise = ['cookie','gdpr','privacy','integritet',
    'logga in','kundservice','kontakt','om oss',
    'instagram','facebook','tiktok','twitter',
    'genom att bli','villkor','policy'];

  var elements = await page.$$eval(
    'h1, h2, h3, h4, p, span, div, a, li',
    function(els) {
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || '').trim()
        };
      });
    }
  );

  var seen = {};
  var results = [];

  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var text = el.text;
    if (!text || text.length < 5 || text.length > 200) continue;
    if (seen[text]) continue;
    
    var lower = text.toLowerCase();
    
    var isNoise = false;
    for (var n = 0; n < noise.length; n++) {
      if (lower.indexOf(noise[n]) !== -1) { isNoise = true; break; }
    }
    if (isNoise) continue;
    
    var hasOffer = false;
    for (var k = 0; k < keywords.length; k++) {
      if (lower.indexOf(keywords[k]) !== -1) { hasOffer = true; break; }
    }
    if (!hasOffer) continue;
    
    seen[text] = true;
    
    var priceMatch = text.match(/(-?\\d+\\s*%|\\d+\\s*kr\\/mån|\\d+\\s*kr|\\d+\\s*månader\\s*gratis)/i);
    
    results.push({
      url: request.url,
      tag: el.tag,
      text: text,
      price: priceMatch ? priceMatch[0] : ''
    });
  }

  return results;
}`;

function normalizeUrl(raw) {
  const t = (raw || '').trim()
  if (!t) return ''
  if (!/^https?:\/\//i.test(t)) return `https://${t}`
  return t
}

export function useApify() {
  const token = import.meta.env.VITE_APIFY_TOKEN
  const isConfigured = useMemo(() => Boolean(token), [token])
  const [statusByUrl, setStatusByUrl] = useState({})

  const scrapeUrl = useCallback(
    async (url, keywords) => {
      if (!token) throw new Error('Missing VITE_APIFY_TOKEN')
      const cleaned = normalizeUrl(url)
      if (!cleaned) return []

      const keywordsSafe = (keywords || [])
        .map((k) => String(k || '').trim())
        .filter(Boolean)
        .slice(0, 10)

      // Also build regex patterns for local fallback matching (as requested)
      const userPatterns = keywordsSafe.map(
        (kw) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      )

      const endpoint =
        'https://api.apify.com/v2/acts/apify~playwright-scraper/run-sync-get-dataset-items'

      const run_input = {
        startUrls: [{ url: cleaned }],
        pageFunction,
        maxRequestsPerCrawl: 1,
        navigationTimeoutSecs: 60,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        },
      }

      const res = await fetch(`${endpoint}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(run_input),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Apify error (${res.status}): ${txt || res.statusText}`)
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : []

      // User keywords are applied client-side (after Apify returns).
      if (keywordsSafe.length > 0) {
        return items
          .map((it) => {
            const text = String(it?.text || '')
            const idx = userPatterns.findIndex((p) => p.test(text))
            const matchedKeyword = idx >= 0 ? keywordsSafe[idx] : null
            return { ...it, matchedKeyword }
          })
          .filter((it) => Boolean(it.matchedKeyword))
      }

      return items
    },
    [token],
  )

  const analyzeTargets = useCallback(
    async (targets, keywords) => {
      const cleanedTargets = (targets || [])
        .map((t) => ({
          ...t,
          url: normalizeUrl(t.url),
        }))
        .filter((t) => t.brand?.trim() && t.url)

      // initialize statuses
      setStatusByUrl((prev) => {
        const next = { ...prev }
        for (const t of cleanedTargets) next[t.url] = { status: 'loading' }
        return next
      })

      const settled = await Promise.allSettled(
        cleanedTargets.map(async (t) => {
          try {
            const items = await scrapeUrl(t.url, keywords)
            setStatusByUrl((prev) => ({ ...prev, [t.url]: { status: 'success' } }))
            return { target: t, items }
          } catch (e) {
            setStatusByUrl((prev) => ({
              ...prev,
              [t.url]: { status: 'error', error: e?.message || String(e) },
            }))
            return { target: t, items: [], error: e }
          }
        }),
      )

      const results = []
      for (const s of settled) {
        if (s.status === 'fulfilled') results.push(s.value)
        else results.push({ target: null, items: [], error: s.reason })
      }
      return results
    },
    [scrapeUrl],
  )

  return { isConfigured, statusByUrl, setStatusByUrl, analyzeTargets }
}

