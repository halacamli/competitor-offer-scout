const TYPE_STYLES = {
  discount: 'bg-[#EF4444]/15 text-[#EF4444] ring-1 ring-inset ring-[#EF4444]/30',
  membership: 'bg-[#3B82F6]/15 text-[#3B82F6] ring-1 ring-inset ring-[#3B82F6]/30',
  bundle: 'bg-[#8B5CF6]/15 text-[#8B5CF6] ring-1 ring-inset ring-[#8B5CF6]/30',
  urgency: 'bg-[#F97316]/15 text-[#F97316] ring-1 ring-inset ring-[#F97316]/30',
  general: 'bg-[#6B7280]/15 text-[#D1D5DB] ring-1 ring-inset ring-[#6B7280]/30',
}

export default function OfferBadge({ type }) {
  const t = type || 'general'
  const cls = TYPE_STYLES[t] || TYPE_STYLES.general

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {t}
    </span>
  )
}

