import BrandSection from './BrandSection'
import StatsBar from './StatsBar'
import { useEffect, useState } from 'react'
import Toast from './Toast'

function EmptyState() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl bg-cardBg ring-1 ring-inset ring-white/10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 11.2a8 8 0 1 1-2.3-5.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M20 4v6h-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-4 text-center">
        <div className="text-lg font-semibold text-gray-100">No offers found yet.</div>
        <div className="mt-1 text-sm text-gray-400">Add competitors and click Analyze.</div>
      </div>
    </div>
  )
}

function groupByBrand(offers) {
  const grouped = (offers || []).reduce((acc, row) => {
    const brand = row?.brand || 'Unknown'
    if (!acc[brand]) acc[brand] = []
    acc[brand].push(row)
    return acc
  }, {})

  return grouped
}

export default function ResultsArea({ offers, onReanalyze, reanalyzeDisabled, primaryBrand }) {
  const hasOffers = (offers || []).length > 0
  const grouped = groupByBrand(offers)
  const entries = Object.entries(grouped).map(([brand, rows]) => ({
    brand,
    offers: rows,
    url: rows?.[0]?.url || '',
  }))

  const primary = (primaryBrand || '').trim()
  const primaryEntryIdx = primary ? entries.findIndex((e) => e.brand === primary) : -1
  const primaryEntry = primaryEntryIdx >= 0 ? entries[primaryEntryIdx] : null

  const rest = entries
    .filter((e) => e.brand !== primary)
    .sort((a, b) => b.offers.length - a.offers.length)

  const orderedGroups = primaryEntry ? [primaryEntry, ...rest] : rest
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 7000)
    return () => clearTimeout(t)
  }, [toast])

  const saveToSheets = async () => {
    const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL
    const sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID

    if (!scriptUrl) {
      setToast({ tone: 'error', message: 'Failed to save' })
      return
    }

    setSaving(true)
    try {
      const rowsToSave = (offers || []).map((r) => ({
        date: new Date().toISOString().split('T')[0],
        brand: r.brand,
        url: r.url,
        found_text: r.text || r.found_text || '',
        offer_type: r.offerType || r.offer_type || '',
        price_pattern: r.price || r.price_pattern || '',
        matched_keyword: r.matchedKeyword || r.matched_keyword || '',
      }))

      console.log('Sheets rows:', rowsToSave)

      // Apps Script CORS-friendly request: no-cors + text/plain
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ rows: rowsToSave }),
      })

      setToast({
        tone: 'success',
        message: `Saved ${rowsToSave.length} rows to Google Sheets ✓`,
        actionLabel: sheetId ? 'Open Sheet →' : null,
        actionHref: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null,
      })
    } catch (e) {
      console.error('Sheets save failed:', e)
      setToast({ tone: 'error', message: 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-w-0 flex-1 px-6 py-6">
      <StatsBar
        offers={offers}
        onReanalyze={onReanalyze}
        reanalyzeDisabled={reanalyzeDisabled}
        onSaveSheets={saveToSheets}
        saveSheetsDisabled={!hasOffers || saving}
        savingSheets={saving}
      />

      {!hasOffers ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {orderedGroups.map((g) => (
            <BrandSection key={g.brand} brand={g.brand} url={g.url} offers={g.offers} />
          ))}
        </div>
      )}

      {toast && (
        <Toast
          tone={toast.tone}
          message={toast.message}
          actionLabel={toast.actionLabel}
          actionHref={toast.actionHref}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  )
}

