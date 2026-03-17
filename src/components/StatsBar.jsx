function Stat({ label, value }) {
  return (
    <div className="flex min-w-[120px] flex-col rounded-xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-100">{value}</div>
    </div>
  )
}

export default function StatsBar({
  offers,
  onReanalyze,
  reanalyzeDisabled,
  onSaveSheets,
  saveSheetsDisabled,
  savingSheets,
}) {
  const counts = (offers || []).reduce(
    (acc, o) => {
      acc.total += 1
      acc[o.offer_type] = (acc[o.offer_type] || 0) + 1
      return acc
    },
    { total: 0, discount: 0, membership: 0, bundle: 0, urgency: 0, general: 0 },
  )

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-white/10 bg-appBg/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Stat label="Total offers" value={counts.total} />
          <Stat label="Discount" value={counts.discount} />
          <Stat label="Membership" value={counts.membership} />
          <Stat label="Bundle" value={counts.bundle} />
          <Stat label="Urgency" value={counts.urgency} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveSheets}
            disabled={saveSheetsDisabled}
            className="inline-flex items-center justify-center rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingSheets ? 'Saving…' : 'Save to Google Sheets'}
          </button>

          <button
            type="button"
            onClick={onReanalyze}
            disabled={reanalyzeDisabled}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh &amp; Re-analyze
          </button>
        </div>
      </div>
    </div>
  )
}

