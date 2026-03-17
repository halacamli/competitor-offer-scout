const PRICE_REGEX =
  /(-\d+%|\b\d+%\b|\b\d+\s?kr\b|\b\d+\s?kr\/mån\b|\b\d+\s?månader gratis\b|\bfree\s?\d+\b)/i

export function extractPricePattern(text) {
  const t = (text || '').trim()
  if (!t) return null
  const m = t.match(PRICE_REGEX)
  return m?.[0] ?? null
}

