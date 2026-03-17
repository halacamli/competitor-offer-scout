import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseOffers() {
  const isConfigured = useMemo(() => Boolean(supabase), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [offers, setOffers] = useState([])

  const refresh = useCallback(async () => {
    if (!supabase) {
      setOffers([])
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('offers')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(500)

      if (supaError) throw supaError
      setOffers(Array.isArray(data) ? data : [])
      return data ?? []
    } catch (e) {
      setError(e)
      setOffers([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const saveOffers = useCallback(async (rows) => {
    if (!supabase) return { ok: false, error: new Error('Supabase not configured') }
    if (!rows?.length) return { ok: true }

    const { error: supaError } = await supabase.from('offers').insert(rows)
    if (supaError) return { ok: false, error: supaError }
    return { ok: true }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { isConfigured, offers, setOffers, loading, error, refresh, saveOffers }
}

