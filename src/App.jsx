import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import ResultsArea from './components/ResultsArea'
import { useApify } from './hooks/useApify'
import { useSupabaseOffers } from './hooks/useSupabase'
import { classifyOfferType } from './utils/offerClassifier'
import { detectLanguage } from './utils/languageDetector'
import { extractPricePattern } from './utils/priceExtractor'

function normalizeUrl(raw) {
  const t = (raw || '').trim()
  if (!t) return ''
  if (!/^https?:\/\//i.test(t)) return `https://${t}`
  return t
}

export default function App() {
  const [yourBrand, setYourBrand] = useState('')
  const [yourWebsite, setYourWebsite] = useState('')
  const [competitors, setCompetitors] = useState([
    { brand: '', url: '' },
    { brand: '', url: '' },
  ])
  const [keywords, setKeywords] = useState([
    'rea',
    'sale',
    'rabatt',
    '%',
    'gratis',
    'kampanj',
    'erbjudande',
    'medlem',
    'spara',
    'upp till',
  ])

  const { isConfigured: apifyConfigured, statusByUrl, setStatusByUrl, analyzeTargets } = useApify()
  const {
    isConfigured: supabaseConfigured,
    offers,
    setOffers,
    loading: supabaseLoading,
    refresh,
    saveOffers,
  } = useSupabaseOffers()

  const [analyzing, setAnalyzing] = useState(false)

  const targets = useMemo(() => {
    const list = []
    if (yourBrand.trim() && yourWebsite.trim())
      list.push({ brand: yourBrand.trim(), url: normalizeUrl(yourWebsite) })

    for (const c of competitors) {
      if (c.brand?.trim() && c.url?.trim()) list.push({ brand: c.brand.trim(), url: normalizeUrl(c.url) })
    }
    return list
  }, [yourBrand, yourWebsite, competitors])

  const loadingCards = useMemo(() => {
    return targets
      .filter((t) => statusByUrl?.[t.url]?.status === 'loading')
      .map((t) => ({ url: t.url, label: `${t.brand} — ${t.url}` }))
  }, [targets, statusByUrl])

  const canAnalyze = apifyConfigured && supabaseConfigured && targets.length > 0 && !analyzing

  const analyzeAndSave = async () => {
    if (!canAnalyze) return
    setAnalyzing(true)
    setStatusByUrl({})

    try {
      const today = new Date().toISOString().slice(0, 10)
      const results = await analyzeTargets(targets, keywords)

      const rows = []
      for (const r of results) {
        const brand = r?.target?.brand || 'Unknown'
        const url = r?.target?.url || ''
        const items = Array.isArray(r?.items) ? r.items : []

        for (const it of items) {
          const foundText = (it?.text || '').trim()
          if (!foundText) continue
          const mk =
            it?.matchedKeyword ??
            it?.matched_keyword ??
            (keywords || []).find((kw) =>
              foundText.toLowerCase().includes(String(kw || '').toLowerCase()),
            ) ??
            null
          rows.push({
            brand,
            url,
            found_text: foundText,
            matched_keyword: mk,
            offer_type: classifyOfferType(foundText),
            language: detectLanguage(foundText),
            element: it?.tag || null,
            price_pattern: extractPricePattern(foundText),
            scraped_at: today,
          })
        }
      }

      // quick de-dupe within this run
      const seen = new Set()
      const deduped = rows.filter((r) => {
        const key = `${r.brand}|${r.url}|${r.found_text}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setOffers(deduped)
      await saveOffers(deduped)
      await refresh()
    } finally {
      setAnalyzing(false)
    }
  }

  const reanalyze = async () => {
    await analyzeAndSave()
  }

  return (
    <div className="min-h-screen bg-appBg">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <Sidebar
          yourBrand={yourBrand}
          setYourBrand={setYourBrand}
          yourWebsite={yourWebsite}
          setYourWebsite={setYourWebsite}
          competitors={competitors}
          setCompetitors={setCompetitors}
          keywords={keywords}
          setKeywords={setKeywords}
          onAnalyze={analyzeAndSave}
          analyzeDisabled={!canAnalyze}
          loadingCards={loadingCards}
          apifyConfigured={apifyConfigured}
          supabaseConfigured={supabaseConfigured}
        />

        <div className="min-w-0 flex-1">
          <ResultsArea
            offers={offers}
            onReanalyze={reanalyze}
            reanalyzeDisabled={!canAnalyze || supabaseLoading}
            primaryBrand={yourBrand.trim()}
          />
        </div>
      </div>
    </div>
  )
}
