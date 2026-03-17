export function detectLanguage(text) {
  const t = (text || '').toLowerCase()
  if (!t) return 'en'

  // Swedish
  if (
    /\b(rea|rabatt|kampanj|erbjudande|spara|upp till|månader gratis|sista chansen|begränsat)\b/.test(
      t,
    )
  )
    return 'sv'

  // Norwegian
  if (/\b(tilbud|opptil|salg|spar|begrenset)\b/.test(t)) return 'no'

  // Danish
  if (/\b(tilbud|udsalg|spar|begrænset)\b/.test(t)) return 'da'

  // Finnish (very light heuristic)
  if (/\b(alennus|tarjous|säästä)\b/.test(t)) return 'fi'

  // German
  if (/\b(bis zu|angebot|rabatt|sparen)\b/.test(t)) return 'de'

  return 'en'
}

