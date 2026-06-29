'use client'

/**
 * ComparePageWrapper — Wraps la page de comparaison avec CreditsGuard
 * Empêche l'accès si crédits = 0
 */

import { CreditsGuard } from '@/lib/credits/guard'
import { ReactNode } from 'react'

export function ComparePageWrapper({ children }: { children: ReactNode }) {
  return (
    <CreditsGuard requiredCredits={1} fallbackUrl='/offre'>
      {children}
    </CreditsGuard>
  )
}
