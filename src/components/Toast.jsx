export default function Toast({ tone, message, actionLabel, actionHref, onClose }) {
  const base =
    'fixed bottom-6 right-6 z-50 max-w-[520px] rounded-2xl px-4 py-3 text-sm ring-1 ring-inset shadow-lg'
  const toneCls =
    tone === 'success'
      ? 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/20 shadow-emerald-500/10'
      : 'bg-red-500/15 text-red-100 ring-red-400/20 shadow-red-500/10'

  return (
    <div className={`${base} ${toneCls}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{message}</div>
          {actionHref && actionLabel && (
            <div className="mt-1">
              <a
                href={actionHref}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                {actionLabel}
              </a>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-white/80 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
          aria-label="Close toast"
        >
          ×
        </button>
      </div>
    </div>
  )
}

