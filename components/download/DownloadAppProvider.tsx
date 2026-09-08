"use client";

/**
 * Contexte de téléchargement : un seul point d'entrée pour « emmène cet
 * utilisateur vers l'app ».
 *
 * Il n'y a plus de connexion sur cosme-check.com. Tous les CTA du site
 * (en-tête, hero, valeurs, tarifs, articles) mènent au téléchargement, et le
 * comportement dépend de l'appareil :
 *
 *   iPhone / iPad  -> ouverture directe de la fiche App Store
 *   Android        -> ouverture directe de la fiche Google Play
 *   ordinateur     -> modale avec les deux badges + QR code à scanner
 *
 * Pourquoi un contexte plutôt qu'un état local par bouton : une seule modale
 * vit dans l'arbre, donc un seul piège de focus, un seul verrou de scroll et
 * un seul écouteur clavier, quel que soit le nombre de CTA sur la page.
 *
 * La détection vient de `lib/storeLink.detectPlatform`, partagée avec la route
 * serveur `/dl`. Les deux ne peuvent pas diverger.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { detectPlatform, storeUrlForPlatform, type Platform } from "@/lib/storeLink";

import { DownloadAppModal } from "./DownloadAppModal";

type OpenOptions = {
  /** Slug de campagne propagé au store, pour l'attribution. */
  campaign?: string;
  /**
   * Média côté Play. `web` par défaut : un clic sur un bouton du site n'est pas
   * un QR scanné, alors que `/dl` sans paramètre, lui, vient d'un QR imprimé.
   */
  medium?: string;
  /** Titre de la modale, si le contexte d'appel mérite un message dédié. */
  title?: string;
  /** Sous-titre de la modale. */
  subtitle?: string;
};

type DownloadContextValue = {
  /**
   * Emmène l'utilisateur vers l'app : redirection store sur mobile, modale sur
   * ordinateur. C'est la fonction que tous les CTA appellent.
   */
  goToApp: (options?: OpenOptions) => void;
  /** Force l'ouverture de la modale, même sur mobile. */
  openModal: (options?: OpenOptions) => void;
  closeModal: () => void;
  /**
   * Plateforme résolue, ou `null` avant le premier rendu client. Les composants
   * s'en servent uniquement pour ADAPTER un libellé, jamais pour décider d'un
   * rendu au premier passage : le serveur ne connaît pas le User-Agent du
   * visiteur ici, donc s'en servir au rendu initial provoquerait une
   * désynchronisation d'hydratation.
   */
  platform: Platform | null;
};

const DownloadContext = createContext<DownloadContextValue | null>(null);

const DEFAULT_TITLE = "Cosme Check, c'est dans l'app";
const DEFAULT_SUBTITLE =
  "Scanne, analyse et découvre si un produit est fait pour toi. Télécharge l'application gratuitement.";

export function DownloadAppProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<OpenOptions | null>(null);

  /**
   * Lu à la demande et non dans un `useEffect` de montage : on évite un rendu
   * supplémentaire de tout l'arbre au chargement de chaque page, alors que la
   * valeur ne sert qu'au moment du clic.
   */
  const readPlatform = useCallback((): Platform => {
    if (typeof navigator === "undefined") return "desktop";
    return detectPlatform(navigator.userAgent);
  }, []);

  const openModal = useCallback((options?: OpenOptions) => {
    setModal(options ?? {});
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const goToApp = useCallback(
    (options?: OpenOptions) => {
      const platform = readPlatform();
      const url = storeUrlForPlatform(
        platform,
        options?.campaign ?? "web",
        options?.medium ?? "web",
      );
      if (url) {
        // Même onglet : sur mobile c'est ce qui déclenche le passage à
        // l'application store native. Un `window.open` serait avalé par
        // certains navigateurs in-app (Instagram, Facebook).
        window.location.href = url;
        return;
      }
      openModal(options);
    },
    [openModal, readPlatform],
  );

  const value = useMemo<DownloadContextValue>(
    () => ({
      goToApp,
      openModal,
      closeModal,
      platform: null,
    }),
    [goToApp, openModal, closeModal],
  );

  return (
    <DownloadContext.Provider value={value}>
      {children}
      {modal ? (
        <DownloadAppModal
          title={modal.title ?? DEFAULT_TITLE}
          subtitle={modal.subtitle ?? DEFAULT_SUBTITLE}
          campaign={modal.campaign ?? "web"}
          onClose={closeModal}
        />
      ) : null}
    </DownloadContext.Provider>
  );
}

/**
 * Accès au contexte. Renvoie un repli inerte plutôt que de lever une erreur
 * quand le provider est absent : un CTA sans provider ne doit pas faire écran
 * blanc sur une page publique.
 */
export function useDownloadApp(): DownloadContextValue {
  const ctx = useContext(DownloadContext);
  if (ctx) return ctx;
  return {
    goToApp: () => {
      if (typeof window !== "undefined") window.location.href = "/dl?c=web&m=web";
    },
    openModal: () => {
      if (typeof window !== "undefined") window.location.href = "/dl?c=web&m=web";
    },
    closeModal: () => {},
    platform: null,
  };
}
