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

export function classifyOfferType(text) {
  const t = (text || '').trim()
  if (!t) return 'general'

  if (MEMBERSHIP_PATTERNS.some((p) => p.test(t))) return 'membership'
  if (BUNDLE_PATTERNS.some((p) => p.test(t))) return 'bundle'
  if (URGENCY_PATTERNS.some((p) => p.test(t))) return 'urgency'
  if (DISCOUNT_PATTERNS.some((p) => p.test(t))) return 'discount'
  return 'general'
}

