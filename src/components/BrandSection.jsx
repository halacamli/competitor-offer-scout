import OfferBadge from './OfferBadge'

function CountBadge({ count }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-200 ring-1 ring-inset ring-white/10">
      {count} offers found
    </span>
  )
}

export default function BrandSection({ brand, url, offers }) {
  const rows = offers || []

  return (
    <section className="mb-6 rounded-2xl bg-cardBg ring-1 ring-inset ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <div className="text-xl font-bold text-gray-100">{brand}</div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-gray-400 hover:text-gray-200"
            title={url}
          >
            {url}
          </a>
        </div>
        <CountBadge count={rows.length} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            <tr className="bg-white/5">
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Found Text</th>
              <th className="px-5 py-3">Offer Type</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Element</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, idx) => (
              <tr
                key={`${o.url}-${idx}-${o.found_text?.slice(0, 24)}`}
                className={`border-t border-white/5 transition hover:bg-white/[0.06] ${
                  idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                }`}
              >
                <td className="whitespace-nowrap px-5 py-3 align-top font-semibold text-gray-100">
                  {o.brand || brand}
                </td>
                <td className="max-w-[720px] px-5 py-3 align-top text-gray-100">
                  <div className="whitespace-pre-wrap">{o.found_text}</div>
                </td>
                <td className="px-5 py-3 align-top">
                  <OfferBadge type={o.offer_type} />
                </td>
                <td className="px-5 py-3 align-top text-gray-200">{o.price_pattern || '—'}</td>
                <td className="px-5 py-3 align-top font-mono text-xs text-gray-400">
                  {o.element || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

