'use client'

/**
 * AdvisorPageWrapper — Wraps AdvisorPanel avec CreditsGuard
 * Empêche l'accès si crédits = 0
 */

import { CreditsGuard } from '@/lib/credits/guard'
import { AdvisorPanel } from '@/components/advisor/AdvisorPanel'

export function AdvisorPageWrapper({ firstName }: { firstName: string }) {
  return (
    <CreditsGuard requiredCredits={1} fallbackUrl='/offre'>
      <AdvisorPanel firstName={firstName} />
    </CreditsGuard>
  )
}
