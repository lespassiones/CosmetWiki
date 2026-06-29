/**
 * Types pour le système de crédits
 * Synchronisé avec CosmeCheck mobile
 */

export type RenewalPeriod = 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Credits {
  ok: boolean
  used?: number
  limit?: number
  remaining?: number
  renewal_period?: RenewalPeriod
  renewal_interval_days?: number
  error?: string
}

export interface CreditConfig {
  remaining: number
  limit: number
  used: number
  renewalPeriod: RenewalPeriod | null
  renewalIntervalDays: number | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}
