# Programme Bêta - mode d'emploi & ce qu'il reste à faire

Architecture (validée avec Brian) : on **collecte** les emails sur `/beta`, puis
on **lance une phase** manuellement depuis le back-office (bouton), ce qui envoie
l'email d'accès à tous les inscrits en attente. Plusieurs vagues possibles.

## Parcours
1. `/beta` (public, non indexé, lien diffusé manuellement - QR pharmacie, réseaux…) :
   nom + prénom + email + case RGPD. **Aucun email envoyé à ce stade.**
2. Back-office **CosmeCheckAdmin → Bêta test** : bouton **« Envoyer les invitations (N) »**
   → appelle le main app `POST /api/beta/invite` → envoie l'email d'accès + le lien
   du formulaire de retour (personnalisé, token) à tous les `invited_at IS NULL`,
   puis les marque invités (idempotent, jamais 2×).
3. Le testeur crée son compte, teste, et remplit `/beta/retour?token=…`
   (déjà en ligne) → `status = feedback_recu`.

## ✅ Lot 1 - FAIT (capture + lancement manuel + invitation + formulaire)
- Main app : page `/beta` (nom+prénom+source+consentement), `POST /api/beta/invite`
  (sécurisé par `BETA_INVITE_SECRET`), email d'invitation enrichi (Brevo transac),
  formulaire `/beta/retour`.
- Admin : page **Bêta test** (stats + bouton d'envoi + derniers inscrits).
- DB : `beta_testers` (+ `last_name`, `invited_at`, `source`), `beta_feedback`.
- Brevo : liste **« Cosme Check - Bêta testeurs » (id 6)**, attributs `PRENOM`,
  `BETA_FEEDBACK`, `BETA_URL`.

### Ce que tu dois faire pour activer le Lot 1
1. **Vercel - projet main app (CosmetWiki)** : Environment Variables (Production+Preview) puis redeploy :
   `BREVO_API_KEY`, `BREVO_LIST_ALL_ID=4`, `BREVO_LIST_NEWSLETTER_ID=5`,
   `BREVO_BETA_LIST_ID=6`, `BREVO_SENDER_EMAIL=contact@cosme-check.com`,
   **`BETA_INVITE_SECRET=74f4fd02a299c31254ab9cfe3a9f36174e670ec67abc6bec`**
2. **Vercel - projet admin (CosmeCheckAdmin)** : Environment Variables puis redeploy :
   **`BETA_INVITE_SECRET`** (la MÊME valeur) + **`BETA_MAIN_APP_URL=https://www.cosme-check.com`**
3. C'est tout : le bouton d'envoi marche dès que les 2 apps sont déployées avec ces variables.

> Plan gratuit Brevo = **300 emails/jour**. Le bouton envoie par lots de 150 ;
> s'il reste des inscrits, reclique (le compteur « en attente » le montre).

## ⏳ Lot 2 - À CONSTRUIRE (tracking + relances segmentées via CRON)
Pas encore fait. Objectif : relancer automatiquement selon l'ÉTAT du testeur.
- **Tracking** : `/beta/go?token=` (clic), recoupage email → compte créé,
  activité (≥1 analyse/scan) → « a testé », `feedback_at`.
- **CRON (main app)** qui envoie, tous les jours, 2 relances (J+2, J+4) par étage :
  - A. inscrit **non cliqué** → « ton accès t'attend » ;
  - B. **cliqué sans compte** → « qu'est-ce qui te manque pour créer ton compte ? » ;
  - C. **compte + testé sans retour** → « voici le formulaire, dis-nous » ;
  - D. **retour reçu** → email de **remerciement**.
- Nécessitera `CRON_SECRET` (main app) + un `vercel.json`/cron config.

## Piloter au quotidien
`/beta-testeur` dans Claude Code : dashboard, export des retours, relance ciblée, clôture.

## Délivrabilité (recommandé)
Expéditeur `contact@cosme-check.com` = actif. Authentifier le domaine
`cosme-check.com` dans Brevo (SPF/DKIM) pour éviter les spams. Non bloquant.

## Démontage (fin de bêta)
Retirer la diffusion du lien `/beta`, export final, puis (sur demande) :
`drop table cosme_check.beta_feedback, cosme_check.beta_testers cascade;` + supprimer la liste Brevo 6.
