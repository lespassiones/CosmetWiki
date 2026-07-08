'use client'

/**
 * useCredits — Hook pour récupérer les crédits de l'utilisateur
 * Polling automatique toutes les 60s pour détecter les changements admin
 * Synchronisé avec CosmeCheck mobile
 */

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Credits, CreditConfig, RenewalPeriod } from './types'

// 60s : le débit de crédit est déjà reflété au moment de l'action ; ce polling
// ne sert qu'à capter les changements admin (rares). 10s multipliait par 6 le
// trafic de fond sur cosme_check_get_credits pour rien.
const POLLING_INTERVAL = 60000 // 60 secondes

export function useCredits(): CreditConfig {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredits = useCallback(async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error: rpcError } = await supabase.rpc('cosme_check_get_credits')

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      setCredits((data as Credits) || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de récupérer les crédits')
      console.error('Failed to fetch credits:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch initial + setup polling
  useEffect(() => {
    void fetchCredits()

    const interval = setInterval(() => {
      void fetchCredits()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchCredits])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchCredits()
  }, [fetchCredits])

  return {
    remaining: credits?.remaining ?? 0,
    limit: credits?.limit ?? 0,
    used: credits?.used ?? 0,
    renewalPeriod: (credits?.renewal_period as RenewalPeriod) || null,
    renewalIntervalDays: credits?.renewal_interval_days || null,
    isLoading,
    error,
    refresh,
  }
}
