'use client'

/**
 * CreditsPill — Affiche les crédits restants de l'utilisateur
 * Avec indicateur de couleur (rouge si vide, orange si faible)
 */

import { useCredits } from '@/lib/credits/hooks'
import { useRouter } from 'next/navigation'

export function CreditsPill() {
  const { remaining, limit, isLoading, error } = useCredits()
  const router = useRouter()

  if (error) {
    return (
      <div className="text-xs text-red-600">
        Erreur crédits
      </div>
    )
  }

  // Déterminer la couleur
  const ratio = limit > 0 ? remaining / limit : 0
  const bgColor = remaining === 0
    ? 'bg-red-100 text-red-700'
    : ratio < 0.2
      ? 'bg-orange-100 text-orange-700'
      : 'bg-emerald-100 text-emerald-700'

  return (
    <button
      onClick={() => router.push('/profile')}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${bgColor} hover:opacity-80`}
      disabled={isLoading}
    >
      <span>⭐</span>
      {isLoading ? (
        <span>...</span>
      ) : (
        <span>{remaining}</span>
      )}
    </button>
  )
}
