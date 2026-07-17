# Programme Bêta - Architecture & procédure de test

Ce document décrit le système d'emails du programme bêta (Cosme Check) et
**comment le tester en minutes** au lieu d'attendre des jours.

Dernière mise à jour : 2026-07-14.

---

## 1. Vue d'ensemble

Le programme bêta s'appuie sur deux applications + Supabase + Brevo :

- **App principale** (`CosmetWiki`, www.cosme-check.com) : le funnel public
  d'inscription, l'endpoint d'invitation, le cron de relances, et TOUS les
  envois Brevo (c'est la seule app qui détient `BREVO_API_KEY`).
- **App admin** (`CosmeCheckAdmin`, projet Vercel distinct à
  `D:\MesApps\deploy\CosmeCheckAdmin`) : le back-office. Sa page « Bêta test »
  liste les inscrits et contient le bouton **« Envoyer les invitations »**.
  L'admin n'envoie pas d'email lui-même : le bouton appelle l'endpoint de
  l'app principale.
- **Supabase** : tables `cosme_check.beta_testers` et `cosme_check.beta_feedback`.
- **Brevo** : 4 templates transactionnels + la liste « Cosme Check - Bêta testeurs ».

### Le parcours complet

1. **Recrutement** : on partage le lien public **https://www.cosme-check.com/beta**.
   Les gens s'inscrivent (`app/beta/actions.ts` → `joinBeta`) → une ligne est
   créée dans `beta_testers` (`invited_at` reste vide). Aucun email ici.
2. **Invitation** : dans l'admin, bouton « Envoyer les invitations (N) » →
   POST `/api/beta/invite` (app principale) avec le header
   `x-beta-invite-secret`. Pour chaque inscrit non encore invité : ajout à
   Brevo + envoi du **template 1 « Accès »**, puis `invited_at` est renseigné.
3. **Relances / demandes de retour** : le cron `/api/beta/cron` (voir §3)
   envoie les templates 2 et 3 selon des délais.
4. **Merci** : quand le testeur remplit le formulaire `/beta/retour` jusqu'au
   bout (`saveBetaFeedback` avec `final: true`), le **template 4 « Merci »**
   part immédiatement, `status = feedback_recu`, et toutes les relances
   s'arrêtent.

---

## 2. Les 4 templates Brevo et les variables d'env

Le CONTENU des emails vit dans Brevo (modifiable sans redéploiement). Le code
n'envoie que par `templateId`.

| # | Rôle | Env (app principale) | Défaut |
|---|------|----------------------|--------|
| 1 | Accès / invitation | `BREVO_TPL_BETA_ACCESS` | 1 |
| 2 | Relance « pas encore testé » | `BREVO_TPL_BETA_RELANCE` | 2 |
| 3 | Demande de retour | `BREVO_TPL_BETA_FEEDBACK` | 3 |
| 4 | Merci | `BREVO_TPL_BETA_MERCI` | 4 |

**Variables d'env - app principale (CosmetWiki) :**
`BREVO_API_KEY`, `BREVO_BETA_LIST_ID`, `BREVO_TPL_BETA_ACCESS`,
`BREVO_TPL_BETA_RELANCE`, `BREVO_TPL_BETA_FEEDBACK`, `BREVO_TPL_BETA_MERCI`,
`BREVO_SENDER_EMAIL` (optionnel, défaut `contact@cosme-check.com`),
`CRON_SECRET` (auth du cron), `BETA_INVITE_SECRET` (auth de l'invite),
`BETA_RELANCE_UNIT` (voir §4).

**Variables d'env - app admin (CosmeCheckAdmin) :**
`BETA_MAIN_APP_URL` (= `https://www.cosme-check.com`),
`BETA_INVITE_SECRET` (**doit être identique** à celui de l'app principale),
+ les clés Supabase. L'admin n'a aucune clé Brevo.

---

## 3. Le cron et son unité de temps

`app/api/beta/cron/route.ts` (app principale). Appelé par Vercel **une fois
par jour à 8h** (`vercel.json` : `"schedule": "0 8 * * *"`), avec
`Authorization: Bearer ${CRON_SECRET}`.

À chaque passage, pour chaque testeur consentant, non `feedback_recu`, invité :

**Parcours A - testeur SANS compte** (`account_created_at` vide) :
- Relance 1 : `no_test_relances == 0` et invité depuis > **2** unités.
- Relance 2 : `no_test_relances == 1` et dernière relance depuis > **3** unités.
- Max 2 relances.

**Parcours B - testeur AVEC compte** (dès qu'un compte existe, la RPC
`cosme_check_beta_sync_states` renseigne `account_created_at` et les relances
s'arrêtent) :
- Demande 1 : `feedback_asks == 0` et compte depuis > **2** unités.
- Demande 2 : `feedback_asks == 1` et dernière demande depuis > **3** unités.
- Demande 3 : `feedback_asks == 2` et dernière demande depuis > **5** unités.
- Max 3 demandes.

Plafond : 100 envois par passage (quota Brevo gratuit = 300/jour).

### L'unité : jours (prod) ou minutes (test)

```
BETA_RELANCE_UNIT === "minutes" ? 60 * 1000 : 24 * 60 * 60 * 1000
```

- **Prod normale** : variable absente → les délais 2/3/5 comptent en **JOURS**.
- **Test** : `BETA_RELANCE_UNIT=minutes` sur Vercel → délais en **MINUTES**.

---

## 4. Tester le parcours en minutes (procédure)

Problème : même en mode minutes, le cron Vercel ne passe qu'à 8h. Il faut donc
un **cron local** qui appelle l'endpoint chaque minute pour dérouler le
parcours en quelques minutes.

### Prérequis

1. `BETA_RELANCE_UNIT=minutes` défini sur **Vercel** (prod), puis redéployer.
   (Ou tester contre un `next dev` local avec la variable dans `.env.local`.)
2. Aucun **vrai** testeur dans `beta_testers` (sinon ils seraient relancés en
   minutes). Vérifier avec la requête du §6.

### Étape A - repartir de zéro sur un testeur de test

Email de test : `notification@testciviquefrance.fr` (inbox de test connue).

```sql
-- Remet le testeur en état "inscrit, non invité, sans compte".
update cosme_check.beta_testers
set status='inscrit', invited_at=null, account_created_at=null, clicked_at=null,
    no_test_relances=0, no_test_last_at=null, feedback_asks=0,
    feedback_ask_last_at=null, thanked_at=null, updated_at=now()
where email='notification@testciviquefrance.fr';
```

Pour tester les **relances** (parcours A), il ne faut PAS de compte auth pour
cet email (sinon la sync le rattache et bascule en parcours B). Supprimer le
compte auth de test via l'API admin Supabase :

```bash
# id récupéré via : select id from auth.users where email='...';
curl -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

### Étape B - lancer le cron local (une seule boucle à la fois)

Script `beta-cron-loop.sh` (30 passages, 1/min). Il appelle le cron PROD.
Note : le middleware bloque l'user-agent `curl` sur `/api/`, d'où le `-A`.

```bash
SECRET=$(grep -E '^CRON_SECRET=' .env | cut -d= -f2- | tr -d '"'"'"'\r')
for i in $(seq 1 30); do
  curl -s -X GET 'https://www.cosme-check.com/api/beta/cron' \
    -A "Mozilla/5.0 (beta-cron-local)" -H "Authorization: Bearer $SECRET"
  echo ""; sleep 60
done
```

Le cron renvoie à chaque passage un JSON :
`{"ok":true,"sync":{...},"sent_relance_no_test":N,"sent_feedback_ask":N,"failed":N}`.

### Étape C - dérouler le parcours

1. Admin → page Bêta test → **« Envoyer les invitations »** → template 1.
2. Attendre : relance à ~2 min, 2e relance à ~5 min (template 2).
3. Créer un compte avec l'email de test (via le bouton de l'email d'accès,
   qui passe par `/beta/go?token=…` et crédite 50 crédits bêta).
4. Attendre : demandes de retour à ~2 / ~5 / ~10 min (template 3).
5. Remplir le formulaire `/beta/retour?token=…` → template 4 « Merci ».

---

## 5. Pièges rencontrés (à éviter)

- **`TaskStop` ne tue pas toujours la boucle bash sous Windows** (le `sleep`
  survit). Vérifier que le log ne grossit plus AVANT d'en relancer une, sinon
  deux boucles pinguent le cron en parallèle. Sans conséquence sur les envois
  (protégés par compteurs + seuils) mais ça brouille le journal.
- **La RPC de sync rattache un compte auth existant** même après avoir mis
  `account_created_at` à null : pour tester les relances, supprimer d'abord le
  compte auth (§4-A).
- **User-agent** : `curl` est bloqué par le middleware sur `/api/` → toujours
  passer un `-A "Mozilla/..."`.

---

## 6. Requêtes de vérification

```sql
-- État d'un testeur
select email, status, invited_at, account_created_at, no_test_relances,
       feedback_asks, thanked_at
from cosme_check.beta_testers
where email='notification@testciviquefrance.fr';

-- Y a-t-il de VRAIS testeurs (hors emails de test) ?
select count(*) from cosme_check.beta_testers
where email not like '%testciviquefrance%';
```

---

## 7. Checklist AVANT le vrai lancement grand public

- [ ] **Retirer `BETA_RELANCE_UNIT` de Vercel** (prod) → les délais repassent
      en jours. Sans ça, les vrais testeurs seraient relancés en minutes.
- [ ] Vérifier les 4 templates Brevo (contenu, liens `{{contact.BETA_GO}}` /
      `{{contact.BETA_URL}}`, expéditeur).
- [ ] Confirmer `BETA_INVITE_SECRET` identique entre l'app principale et l'admin.
- [ ] Vérifier le quota Brevo (300 emails/jour en gratuit) vs le nombre d'invités.
- [ ] Nettoyer les entrées de test de `beta_testers` si besoin.
- [ ] Partager le lien de recrutement : https://www.cosme-check.com/beta
