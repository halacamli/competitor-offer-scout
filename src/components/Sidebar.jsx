import { useMemo, useState } from 'react'
import LoadingState from './LoadingState'

function Label({ children }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</div>
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-100 ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  )
}

function KeywordTag({ text, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-200 ring-1 ring-inset ring-white/10">
      <span className="max-w-[180px] truncate">{text}</span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white"
        aria-label={`Remove keyword ${text}`}
      >
        ×
      </button>
    </span>
  )
}

function KeywordInput({ keywords, setKeywords }) {
  const [draft, setDraft] = useState('')
  const remaining = 10 - (keywords?.length || 0)

  const normalized = useMemo(
    () => (keywords || []).map((k) => String(k || '').trim()).filter(Boolean),
    [keywords],
  )

  const addFromString = (raw) => {
    const parts = String(raw || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    if (parts.length === 0) return

    setKeywords((prev) => {
      const next = (prev || []).map((k) => String(k || '').trim()).filter(Boolean)
      const lower = new Set(next.map((k) => k.toLowerCase()))
      for (const p of parts) {
        if (next.length >= 10) break
        if (lower.has(p.toLowerCase())) continue
        next.push(p)
        lower.add(p.toLowerCase())
      }
      return next
    })
  }

  const removeAt = (idx) => {
    setKeywords((prev) => (prev || []).filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {normalized.map((kw, idx) => (
          <KeywordTag key={`${kw}-${idx}`} text={kw} onRemove={() => removeAt(idx)} />
        ))}
      </div>

      <div className="mt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              if (remaining <= 0) return
              addFromString(draft)
              setDraft('')
            }
            if (e.key === 'Backspace' && !draft && normalized.length > 0) {
              removeAt(normalized.length - 1)
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              addFromString(draft)
              setDraft('')
            }
          }}
          disabled={remaining <= 0}
          placeholder="e.g. gratis, -50%, kampanj"
          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-100 ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-1 text-xs text-gray-500">{remaining} keyword slots left</div>
      </div>
    </div>
  )
}

export default function Sidebar({
  yourBrand,
  setYourBrand,
  yourWebsite,
  setYourWebsite,
  competitors,
  setCompetitors,
  keywords,
  setKeywords,
  onAnalyze,
  analyzeDisabled,
  loadingCards,
  apifyConfigured,
  supabaseConfigured,
}) {
  const canAdd = competitors.length < 4

  const updateCompetitor = (idx, patch) => {
    setCompetitors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const removeCompetitor = (idx) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx))
  }

  const addCompetitor = () => {
    if (!canAdd) return
    setCompetitors((prev) => [...prev, { brand: '', url: '' }])
  }

  return (
    <aside className="w-[320px] shrink-0 border-r border-white/10 bg-cardBg p-5">
      <div className="mb-6">
        <div className="text-xl font-semibold text-gray-100">Offer Scout</div>
        <div className="mt-1 text-sm text-gray-400">Competitor offer intelligence</div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Your Brand</Label>
          <div className="mt-2">
            <TextInput value={yourBrand} onChange={setYourBrand} placeholder="e.g. Tele2" />
          </div>
        </div>

        <div>
          <Label>Your Website</Label>
          <div className="mt-2">
            <TextInput
              value={yourWebsite}
              onChange={setYourWebsite}
              placeholder="e.g. https://www.tele2.se"
            />
          </div>
        </div>

        <div className="pt-3">
          <div className="h-px w-full bg-white/10" />
          <div className="mt-3">
            <Label>Competitors</Label>
          </div>
        </div>

        <div className="space-y-3">
          {competitors.map((c, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <TextInput
                value={c.brand}
                onChange={(v) => updateCompetitor(idx, { brand: v })}
                placeholder="Brand"
              />
              <TextInput
                value={c.url}
                onChange={(v) => updateCompetitor(idx, { url: v })}
                placeholder="URL"
              />
              <button
                type="button"
                onClick={() => removeCompetitor(idx)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
                aria-label="Remove competitor"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCompetitor}
          disabled={!canAdd}
          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-gray-100 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add competitor
        </button>

        <div className="pt-1">
          <Label>Keywords (optional)</Label>
          <div className="mt-2">
            <KeywordInput keywords={keywords} setKeywords={setKeywords} />
          </div>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzeDisabled}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Analyze &amp; Save
        </button>

        {(!apifyConfigured || !supabaseConfigured) && (
          <div className="rounded-xl bg-[#F97316]/10 px-3 py-2 text-xs text-[#FBBF24] ring-1 ring-inset ring-[#F97316]/20">
            {!apifyConfigured && <div>Missing `VITE_APIFY_TOKEN`.</div>}
            {!supabaseConfigured && <div>Missing Supabase env vars.</div>}
          </div>
        )}

        {loadingCards?.length > 0 && (
          <div className="pt-2">
            <Label>Fetching</Label>
            <div className="mt-2 space-y-2">
              {loadingCards.map((c) => (
                <LoadingState key={c.url} label={c.label} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

