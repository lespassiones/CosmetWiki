/**
 * Capture PRÉCOCE de l'installabilité PWA — composant serveur qui injecte un
 * script inline dans le HTML initial, exécuté PENDANT le parsing (avant toute
 * hydratation React).
 *
 * Pourquoi : Chrome déclenche `beforeinstallprompt` très tôt au chargement de la
 * page, bien avant que les composants clients (InstallPWAButton / -Banner /
 * -MenuItem) ne montent. Si on n'attachait l'écouteur que dans leur `useEffect`,
 * l'événement serait déjà passé → perdu → le bouton retomberait TOUJOURS sur les
 * instructions manuelles au lieu de déclencher l'installation native (le bug
 * observé sur Android).
 *
 * Contrat exposé sur `window` (lu par components/InstallPWAButton.tsx) :
 *   window.__cwInstallPrompt  → l'événement BeforeInstallPromptEvent, ou null
 *   window.__cwInstalled      → true une fois `appinstalled` reçu
 *   event 'cw:install-change' → émis à chaque changement d'état
 */
const CAPTURE_SCRIPT = `
(function () {
  if (window.__cwInstallCaptureReady) return;
  window.__cwInstallCaptureReady = true;
  if (typeof window.__cwInstallPrompt === "undefined") window.__cwInstallPrompt = null;
  if (typeof window.__cwInstalled === "undefined") window.__cwInstalled = false;
  function emit() {
    try { window.dispatchEvent(new Event("cw:install-change")); } catch (e) {}
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    // Empêche la mini-infobar Chrome par défaut : on déclenche le prompt nous-mêmes
    // depuis le bouton « Installer l'app ».
    e.preventDefault();
    window.__cwInstallPrompt = e;
    emit();
  });
  window.addEventListener("appinstalled", function () {
    window.__cwInstallPrompt = null;
    window.__cwInstalled = true;
    emit();
  });
})();
`;

export function PWAInstallCapture() {
  return <script dangerouslySetInnerHTML={{ __html: CAPTURE_SCRIPT }} />;
}
