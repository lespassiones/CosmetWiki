/**
 * CreditsGuard — Protège les actions qui demandent des crédits
 * Redirige vers /offre si crédits = 0
 * Retourne au previousPage si l'utilisateur revient en arrière
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from './hooks'

interface CreditsGuardProps {
  children: React.ReactNode
  requiredCredits?: number
  fallbackUrl?: string // Par défaut: /offre
}

export function CreditsGuard({
  children,
  requiredCredits = 1,
  fallbackUrl = '/offre',
}: CreditsGuardProps) {
  const router = useRouter()
  const { remaining, isLoading } = useCredits()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pendant le chargement, afficher le contenu (pas de blocage)
  if (isLoading || !mounted) {
    return <>{children}</>
  }

  // Si crédits insuffisants, rediriger vers paywall
  if (remaining < requiredCredits) {
    // Sauvegarder l'URL précédente dans sessionStorage pour revenir
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnAfterPaywall', window.location.pathname)
    }
    router.push(fallbackUrl)
    return null
  }

  return <>{children}</>
}

/**
 * Hook pour consommer des crédits dans une action
 * Vérifie les crédits avant l'action et affiche le paywall si nécessaire
 */
export function useCreditsAction(requiredCredits = 1) {
  const router = useRouter()
  const { remaining, refresh } = useCredits()

  const executeIfCreditsAvailable = async (
    action: () => Promise<void>
  ): Promise<boolean> => {
    // Rafraîchir les crédits pour s'assurer d'avoir la valeur à jour
    await refresh()

    if (remaining < requiredCredits) {
      // Sauvegarder l'URL précédente
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnAfterPaywall', window.location.pathname)
      }
      router.push('/offre')
      return false
    }

    // Exécuter l'action
    await action()
    return true
  }

  return { executeIfCreditsAvailable, remaining }
}
