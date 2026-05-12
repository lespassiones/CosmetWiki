# CosmetWiki — Spécification visuelle pixel-perfect

> Document de référence pour l'intégration UI. Décrit **exactement** ce qui doit être à l'écran, dans quel ordre, à quelle taille, avec quelle couleur.
> Source : maquettes validées (mobile 6 écrans + desktop 6 fenêtres).
> **Aucune donnée mockée. Jamais.** Chaque valeur affichée vient d'une vraie source (DB Supabase, API analyse, profil utilisateur).

---

## 0. Préambule

### 0.1 Source de vérité
Les maquettes validées constituent la **source de vérité visuelle**. Toute divergence d'implémentation doit être traitée comme un bug.

### 0.2 Modification par rapport aux maquettes desktop
- **Sur les maquettes** : la navigation desktop est **horizontale en haut** (Accueil · Routine · Historique).
- **Décision actée** : la navigation desktop devient une **SIDEBAR verticale fixe à gauche**, avec exactement les mêmes entrées que la nav bar mobile (Accueil · Routine · Analyser un produit · Historique · Profil).
- La sidebar a une largeur fixe de **240px** et reste visible en permanence sur tout viewport > 1024px.
- Le contenu de la page se cale à droite de la sidebar (`padding-left: 240px`).

### 0.3 Règle absolue : zéro donnée mockée

Aucun produit, score, ingrédient, statistique ou texte de synthèse **ne peut être hardcodé**. Toute donnée à l'écran provient :

| Donnée | Source |
|---|---|
| Nom utilisateur | `profiles.first_name` (Supabase) |
| Dernière analyse | `analyses` table filtrée par `user_id`, ordonnée par `created_at desc`, `limit 1` |
| Routine | `routine_items` jointure `analyses` |
| Astuce du jour | Table `daily_tips` ou rotation déterministe sur tableau de tips en `lib/tips.ts` |
| Catégories populaires | Liste figée (6 items, c'est de la navigation, pas de la data) |
| Ingrédients tendance | Vue Supabase `v_trending_ingredients` (top consultés sur 7 jours) |
| Produits similaires | RPC Supabase `find_similar_products(analysis_id, limit)` |
| Score gauge / synthèse / spectre | Réponse de `/api/analyser` exécutée sur la vraie liste INCI |

→ En l'absence de donnée, on affiche un **état vide explicite** (jamais un placeholder fake).

---

## 1. Design tokens (valeurs exactes)

### 1.1 Couleurs

```
--bg-app           #FAFAFA   /* fond global hors cartes */
--bg-card          #FFFFFF   /* fond des cartes */
--bg-card-soft     #FFF1F2   /* astuce du jour, encarts info doux */
--bg-overlay       rgba(17,17,17,0.45)  /* dim derrière bottom sheet */

--text-primary     #111111
--text-secondary   #6B7280
--text-muted       #9CA3AF

--border           #E5E7EB
--border-soft      #F0F0F0

--accent-coral     #F43F5E   /* "Wiki", underline hero, "Voir plus", liens */
--accent-coral-50  #FFE4E6   /* fond CTA dashed "Ajouter un produit" */

--rate-vert        #10B981
--rate-jaune       #F59E0B
--rate-orange      #FB923C
--rate-rouge       #EF4444
--rate-empty       #E5E7EB   /* case vide du spectre */

--cta-primary-bg   #111111   /* bouton noir "Analyser un produit", pills actives */
--cta-primary-fg   #FFFFFF

--danger-text      #E11D48   /* lien "Se déconnecter" */
```

### 1.2 Typographie

- **Famille** : `Inter`, fallback `-apple-system, "Segoe UI", "Helvetica Neue", sans-serif`.
- **Logo** : "Cosmet" en `font-weight: 700` couleur `--text-primary`, "Wiki" en `font-weight: 700` couleur `--accent-coral`, précédé d'une icône bécher noire (Lucide `FlaskConical` ou équivalent).

| Style | Taille | Weight | Couleur | Usage |
|---|---|---|---|---|
| `display-hero` | 32px / 40px line-height | 700 | primary | "Bonjour Brian 👋" mobile |
| `display-hero-desktop` | 48px / 56px | 700 | primary | Idem desktop |
| `h1` | 24px / 32px | 700 | primary | Titres de page ("Ma routine quotidienne") |
| `h2` | 18px / 24px | 600 | primary | Titres de sections ("Catégories populaires") |
| `body-lg` | 16px / 24px | 400 | primary | Textes principaux |
| `body` | 14px / 20px | 400 | primary | Liste, contenus |
| `body-secondary` | 14px / 20px | 400 | secondary | Sous-titres, sous-libellés |
| `caption` | 12px / 16px | 500 | secondary | Labels de colonnes, légendes |
| `nav-label` | 10px / 12px | 500 | secondary / primary si actif | Libellés nav bar |
| `link-accent` | 14px / 20px | 500 | coral | "Voir plus →", "Voir le détail →" |

### 1.3 Espacement

- Espacement unitaire **4px**. Toutes les valeurs en sont multiples (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- **Card padding** : `20px` mobile, `24px` desktop.
- **Section spacing (vertical)** : `24px` mobile, `32px` desktop.
- **Container max-width desktop** : `1280px`, centré.
- **Sidebar width desktop** : `240px` fixe.

### 1.4 Rayons (border-radius)

```
--radius-card      16px    /* cartes principales */
--radius-pill      999px   /* pills, chips, boutons arrondis */
--radius-button    12px    /* boutons rectangulaires */
--radius-sheet-top 24px    /* bottom sheet coin haut */
--radius-input     12px    /* champs de saisie */
```

### 1.5 Ombres

```
--shadow-card       0 1px 2px rgba(17,17,17,0.04), 0 1px 1px rgba(17,17,17,0.03)
--shadow-elevated   0 4px 12px rgba(17,17,17,0.08)
--shadow-nav-top    0 -4px 12px rgba(17,17,17,0.04)   /* nav bar mobile */
--shadow-fab        0 6px 16px rgba(17,17,17,0.18)    /* bouton scan central */
```

### 1.6 Breakpoints

```
sm    640px
md    768px
lg    1024px   ← bascule mobile/desktop. >1024px = sidebar visible
xl    1280px
2xl   1536px
```

---

## 2. Mobile — système global

### 2.1 Layout
- Viewport target : `375px × 812px` (iPhone 14 Pro). Doit fonctionner de 360px à 430px de largeur.
- Container : pleine largeur, `padding-x: 20px` standard.
- Body : `background: --bg-app`.

### 2.2 Bottom nav (sticky, présente sur toutes les pages sauf flow OCR caméra)
- Hauteur : **64px** (hors safe area iOS).
- Background : `--bg-card` (#FFFFFF), `box-shadow: --shadow-nav-top`.
- **5 emplacements équidistants** :
  1. 🏠 **Accueil** (icône house, label "Accueil")
  2. 📚 **Routine** (icône layers stack)
  3. ● **Scan central** : cercle noir, diamètre **56px**, surélevé de **12px** au-dessus de la nav, icône caméra blanche 24×24, `box-shadow: --shadow-fab`. **Pas de label**.
  4. 🕒 **Historique** (icône clock)
  5. 👤 **Profil** (icône user)
- Icônes 24×24px. Label `nav-label`.
- **État inactif** : icône `--text-secondary`, label `--text-secondary`.
- **État actif** : icône `--text-primary` (rempli), label `--text-primary` en `font-weight: 600`.
- Tap sur le bouton central → ouvre **Bottom Sheet Scan** (cf. §2.4).

### 2.3 Header de page
- Sur pages "secondaires" (résultat analyse, ingrédient) : flèche back **← Nouvelle analyse** ou **← Retour** en `--text-secondary`, puis logo centré ou laissé tel quel selon la page.
- Sur **Home** : logo en haut à gauche (bécher + Cosmet + Wiki), icône burger menu à droite (cercle blanc 36×36 avec icône `Menu` Lucide).
- Sur **Routine** : titre h1 + burger menu.

---

## 3. Mobile — écran par écran

### 3.1 ACCUEIL (Home)

**Hiérarchie verticale (de haut en bas, pas de padding entre)**

1. **Header** (cf. §2.3) — `padding-top: 12px`.
2. **Greeting** : "Bonjour {firstName} 👋" en `display-hero`.
   - Source : `profiles.first_name`. Si invité : "Bonjour 👋".
3. **Tagline** : "Décrypte tes cosmétiques en 3 secondes." en `body-lg`. **"en 3 secondes."** souligné par un trait ondulé corail (SVG inline, épaisseur 2px, couleur `--accent-coral`).
4. **Carte "Dernière analyse"** (`--bg-card`, `--radius-card`, padding 20px) :
   - Layout horizontal : à gauche **vignette produit 60×80px** (image carrée à coins doux, `border-radius: 8px`), à droite contenu.
   - Sur titre interne : "Dernière analyse" en `caption` `--text-secondary`.
   - Nom produit en `h2` (ex : "La Roche-Posay Effaclar Duo+").
   - Pill score : fond couleur de la note (vert pâle si bon, orange pâle si moyen), texte ex. "13.2/20 · Acceptable" en `body` `font-weight: 600` couleur de la note.
   - En bas à droite : lien `link-accent` "Voir →".
   - **Source** : dernière ligne de `analyses` pour l'user. Si aucune analyse : carte "Lance ta première analyse" avec CTA noir "Analyser maintenant" qui ouvre la Scan Sheet.
5. **Carte "Ta routine"** (même style) :
   - Layout horizontal : à gauche **gauge circulaire 64×64px** avec score, à droite "{N} produits dans ta routine" + lien "Voir →".
   - **Source** : agrégation de `routine_items` join `analyses`. Si vide : carte "Crée ta routine pour suivre ton exposition cumulée." + CTA.
6. **Carte "Astuce du jour"** (`--bg-card-soft`, padding 16px) :
   - Icône ampoule 💡 (couleur `--accent-coral` ou émoji).
   - Texte `body` en italique léger ou normal.
   - **Source** : rotation déterministe sur tableau de 7+ tips (`lib/tips.ts`) basée sur `dayOfYear % tips.length`. Pas d'aléatoire (sinon recalcul à chaque render).
7. **Section "Catégories populaires"** :
   - Titre h2 + grille **2 colonnes × 3 lignes** de chip-cards.
   - Chaque chip : background `--bg-card`, `--radius-card`, padding 12px, layout horizontal `icon + label`.
   - Items : 🧴 Crème visage · 🧼 Shampooing · ☀️ Solaire · 💄 Maquillage · 🧴 Corps · 👶 Bébé.
   - **Tap** → page recherche produits filtrée par catégorie.
8. **Section "Ingrédients tendance cette semaine"** :
   - Titre h2.
   - Liste de 4–5 lignes, chacune : pastille couleur (8×8px) + nom INCI bold + traduction FR en `body-secondary` + chevron `→` droite.
   - **Source** : RPC `cosmetwiki_trending_ingredients(days := 7, limit := 5)`.
9. **Légende** (juste avant la nav) : ligne horizontale centrée avec les 4 pastilles "● Vert ● Jaune ● Orange ● Rouge" en `caption`.
10. **Espace bas** : `padding-bottom: 96px` pour ne pas être recouvert par la nav.

### 3.2 BOTTOM SHEET SCAN

- Déclenché par tap sur le bouton scan central.
- Animation : slide-up 220ms ease-out + fade-in overlay 180ms.
- **Overlay** plein écran `--bg-overlay`. Tap dessus → ferme.
- Sheet :
  - Background `--bg-card`.
  - Coin haut `--radius-sheet-top`.
  - Hauteur ~**56%** du viewport (auto-ajustée au contenu).
  - **Drag handle** : barre 40×4px `--text-muted`, centrée, marge top 8px.
  - Titre "Comment veux-tu analyser ?" h2 centré, marge top 12px, bottom 20px.
  - **Grille 2×2** de 4 tuiles, gap 12px, padding-x 20px :

| Position | Icône (Lucide) | Titre | Sous-titre |
|---|---|---|---|
| top-left | `Barcode` | **Code-barres** | "Scan rapide en magasin" |
| top-right | `ClipboardList` | **Coller la composition** | "Liste INCI texte" |
| bottom-left | `Camera` + pill NEW corail | **Photo de la composition** | "OCR automatique" |
| bottom-right | `Search` | **Rechercher un produit** | "Par nom ou marque" |

  - Tuile : `--bg-card`, `border: 1px solid --border`, `--radius-card`, padding 20px, contenu centré vertical.
  - Icône 32×32 noir, titre `body-lg` bold, sous-titre `caption` `--text-secondary`.
  - Pill NEW : background `--accent-coral`, texte blanc 10px, padding 2px 8px, positionné top-right de la tuile.
- Lien "Annuler" centré bas, `body` `--text-secondary`, padding 16px.

### 3.3 RÉSULTAT D'ANALYSE — collapsed (mobile par défaut)

**Hiérarchie verticale**

1. Header : back arrow + "Nouvelle analyse" en `--text-secondary` + logo bécher centré + burger droite.
2. **Action chips** ligne horizontale : "↓ Télécharger en PDF" et "↗ Partager".
   - Style : `--bg-card`, border `--border`, `--radius-pill`, padding 8px 16px, `body` `--text-primary`.
3. **KPI grid 2×2** (cartes blanches, padding 16px, gap 12px) :
   - Top-left : "Ingrédients identifiés" `caption` puis grand nombre `display-hero` 32px puis "sur {N} ingrédients" `body-secondary`.
   - Top-right : "● Vert" `caption` (avec pastille verte) puis grand nombre puis "{xx} %" aligné droite `body-secondary`.
   - Bottom-left : "● Rouge" idem.
   - Bottom-right : "● Jaune" idem.
   - Source : `result.counts` de `/api/analyser`.
4. **Carte "Note globale"** :
   - Pleine largeur. Layout horizontal.
   - À gauche : "Note globale" `caption`, grande note `display-hero` (ex. "18.3 /20", "/20" en `body-secondary`), pill "Très bien" en vert pâle.
   - À droite : **gauge circulaire 88×88px** avec score au centre.
   - Source : `result.score`, `result.scoreLabel`.
5. **Carte "Spectre"** :
   - Titre `body-lg` bold "Spectre top 5".
   - 5 carrés colorés 32×32px, gap 8px, chacun étiqueté en dessous 1·2·3·4·5 en `caption`.
   - Sous-titre "Top 10".
   - 10 carrés plus petits 16×16px, gap 4px.
   - Texte d'aide en bas `caption` `--text-secondary` : "Touche un carré pour voir l'ingrédient".
   - Source : `result.spectrum.top5` et `result.spectrum.top10` calculés par l'API.
6. **Carte "Observations"** :
   - Titre h2 "Observations".
   - Liste de **5 items max** (couper si plus, voir détail). Chacun : icône check verte + texte "{Label} {statut}".
   - "absents" en vert, "présent" en couleur de la note.
   - Lien bas `link-accent` "Voir le détail des observations →".
   - Source : `result.observations`.
7. **Carte "Synthèse"** :
   - Titre h2.
   - **2 à 3 lignes visibles**, texte tronqué avec ellipsis `…`.
   - Lien bas `link-accent` "Voir la synthèse complète →".
   - Source : `result.synthesis` (string Markdown généré par GPT).
8. **Carte "Ingrédients"** :
   - Titre h2.
   - **Filter pills horizontales scrollables** : "Tous {N}" (active fond noir, texte blanc) · "Vert {n}" · "Jaune {n}" · "Orange {n}" · "Rouge {n}".
     - Pills inactives : `--bg-card`, border `--border`, texte primary. Le count est en couleur de la note.
   - **Search field** "Rechercher un ingrédient" avec icône loupe.
   - **5 premiers ingrédients** seulement, chacun :
     - Numéro de position (`caption` `--text-muted`)
     - Nom INCI bold (`body`)
     - Traduction FR `body-secondary`
     - Pastille couleur + libellé note (`● Vert`, `● Jaune`…)
     - Chevron `→`
   - Lien bas centré `link-accent` "Voir les {N} ingrédients →".
   - Source : `result.items`.
9. Padding bottom 96px (espace pour nav).

### 3.4 RÉSULTAT D'ANALYSE — expanded (après tap "Voir plus")

Identique à 3.3 **sauf** :

- **Synthèse** : paragraphe complet visible + bullet list avec INCI en gras `**AQUA**`, `**CANANGA ODORATA FLOWER WATER**`, etc. Lien bas devient `link-accent` "Voir moins ↑".
- **Ingrédients** : **TOUS** les `N` ingrédients visibles. Chaque ligne contient en plus, à droite avant le chevron, un **badge gris** `--border-soft` rounded pill avec texte `caption` `--text-secondary` indiquant :
  - "avant parfum"
  - "après parfum"
  - "avant conservateur"
  - "après conservateur"
  - (rien si l'ingrédient EST le parfum/conservateur, ou si aucun n'est présent dans la formule)
- Lien bas "Replier ↑".

### 3.5 DÉTAIL D'INGRÉDIENT

1. Header : "← Retour".
2. Nom INCI en `h1` centré ou aligné gauche selon la maquette (sur la maquette : aligné gauche grand bold "CANANGA ODORATA FLOWER WATER").
3. Sous-titre `body-secondary` : traduction FR (ex. "Eau florale d'ylang-ylang").
4. **Carte couleur de tolérance** :
   - Si Jaune : `background: #FEF3C7` (jaune très pâle), border-left `4px solid --rate-jaune`.
   - Pill "● Jaune — Pénalité légère" + paragraphe d'explication (`body`).
5. **Card "Fonction principale"** : titre `caption`, valeur `body`.
6. **Card "Tags"** : titre `caption` + chips horizontales (chaque tag = pill `--bg-card`, border `--border`, padding 4px 12px, `body`).
7. **Card "Numéro CAS"** : valeur + lien `link-accent` "↗ Source INCI Beauty".
8. **Card "Position dans la formule"** : texte "Position {n} sur {N} · {threshold_label}" (ex. "Position 3 sur 13 · avant le 1er conservateur").
9. Padding bottom 96px.
10. Sticky bottom nav.

### 3.6 ROUTINE (avec produits)

1. Header : "Ma routine quotidienne" h1 + burger.
2. **Carte "Exposition cumulée"** :
   - Pleine largeur.
   - À gauche : gauge **80×80px** avec score (ex. "14.2 /20") + sous-titre couleur correspondant à la sévérité (ex. "Modérée" en orange).
   - À droite : texte "Basé sur {N} produits utilisés au quotidien" `body-secondary`.
3. **Deux chips d'alerte** horizontaux (wrap si nécessaire) :
   - "⚠️ Allergènes parfumants dans 3 produits" (background jaune pâle, texte jaune foncé).
   - "⚠️ Conservateurs cumulés : 5" idem.
4. Lien `link-accent` "Voir le détail →".
5. Section "Mes produits" h2.
6. Liste de cartes-produits, chacune :
   - Image 48×48 carrée à coins doux.
   - Nom produit `body` bold + marque `body-secondary`.
   - Pill score à droite (couleur de la note + texte ex. "13.2/20").
   - Selector "Quotidien ▾" en dessous (Lucide `ChevronDown`).
   - Trash icon `Trash2` discret à l'extrême droite, ouverture confirm dialog.
   - Source : `routine_items` join `analyses` ordonné par `added_at`.
7. **CTA "+ Ajouter un produit à ma routine"** :
   - Carte dashed border `2px dashed --accent-coral`, background `--accent-coral-50`, padding 20px, texte centré `body` `--accent-coral` bold.
   - Tap → ouvre Scan Sheet.
8. Padding bottom 96px.
9. Sticky bottom nav avec "Routine" actif.

---

## 4. Desktop — système global

### 4.1 Layout en deux zones

```
┌───────────┬──────────────────────────────────────────────┐
│           │                                              │
│  SIDEBAR  │              CONTENU PAGE                    │
│  (240px)  │  (max-width 1280px, padding 32px, centré)    │
│           │                                              │
└───────────┴──────────────────────────────────────────────┘
```

### 4.2 Sidebar — spécification précise

- **Largeur fixe 240px**, hauteur 100vh, `position: fixed; left: 0; top: 0`.
- `background: --bg-card`, `border-right: 1px solid --border`.
- Padding intérieur : 20px.
- **Contenu vertical (de haut en bas)** :

1. **Logo** (40px height) : bécher + "Cosmet" (noir) + "Wiki" (corail). Padding-bottom 32px.
2. **Bouton CTA "Analyser un produit"** (pleine largeur sidebar) :
   - Background `--cta-primary-bg`, texte blanc, icône caméra à gauche, label "Analyser un produit", `--radius-button`, padding 12px 16px.
   - Click → ouvre **dropdown** (cf. §4.4) ou bottom sheet équivalent.
   - Marge-bottom 24px.
3. **Liens de navigation** (liste verticale) :
   - Chaque item : icône 20×20 + label 14px, padding 10px 12px, `--radius-button`, gap 12px.
   - Items dans l'ordre : **Accueil · Routine · Historique · Profil**.
   - État inactif : icône + label `--text-secondary`, hover background `--border-soft`.
   - État actif : icône + label `--text-primary` bold, background `--border-soft` permanent.
4. **Espacement flex grow** pour pousser le bas vers… le bas.
5. **Bloc utilisateur** (collé au bas) :
   - Avatar circulaire 32×32 (initiales) + nom `body` bold + email `caption` `--text-secondary`.
   - Notification bell en haut à droite de ce bloc.

### 4.3 Header de page desktop
- **Pas de header horizontal global** (remplacé par la sidebar).
- Chaque page commence par son **titre h1** + éventuelles actions à droite (boutons "Télécharger en PDF", "Partager", etc.).

### 4.4 Dropdown "Analyser un produit"

- Déclenché par click sur le CTA noir dans la sidebar.
- Position : flotte juste à droite du CTA (out of sidebar), `box-shadow: --shadow-elevated`, `--radius-card`, background `--bg-card`, width 360px.
- **4 lignes** (pas 2×2 ici, parce qu'on est en desktop) :

| Icône | Titre | Sous-titre |
|---|---|---|
| Barcode | Code-barres (use webcam) | Scan via webcam |
| ClipboardList | Coller la composition | Liste INCI texte |
| Camera + pill NEW | Photo de la composition | OCR · Upload une image |
| Search | Rechercher un produit | Par nom ou marque |

- Chaque ligne : padding 12px 16px, hover background `--border-soft`, icône gauche 24×24, texte vertical (titre body bold + sous-titre caption secondary).

---

## 5. Desktop — page par page

### 5.1 ACCUEIL

**Layout** : pleine largeur du contenu, sections empilées verticalement avec spacing 32px.

1. **Greeting** : "Bonjour {firstName} 👋" en `display-hero-desktop` (48px).
2. **Tagline** : "Décrypte tes cosmétiques en 3 secondes." en `body-lg` 18px, "en 3 secondes." souligné corail.
3. **Grille 2 colonnes égales** :
   - **Colonne gauche** : Carte "Reprendre la dernière analyse"
     - Layout horizontal : vignette produit 80×100px à gauche.
     - Centre : titre "Reprendre la dernière analyse" `caption` puis nom produit `h2`.
     - Droite : "Score global" `caption`, grande note `display-hero` (ex. "18.3 /20"), pill "Très bien" + **gauge circulaire 64×64** en bas droite.
     - Pied de carte : lien `link-accent` "Voir l'analyse complète →".
   - **Colonne droite** : Carte "Ta routine"
     - Grand gauge **120×120px** centré dans le haut de la carte.
     - Texte "Ta routine" `caption` en haut gauche.
     - Sous-titre "{N} produits actifs" centré sous la gauge.
     - Lien "Voir →" en bas droite.
4. **Carte "Astuce du jour"** (pleine largeur, fond `--bg-card-soft`) :
   - Icône ampoule + titre `body-lg` bold + texte `body` sur 2 lignes.
5. **Grille 2 colonnes** :
   - **Colonne gauche (60%)** : Section "Catégories populaires" (titre h2 + liste verticale 6 items, chacun chip pleine largeur avec icône + label + chevron droit).
   - **Colonne droite (40%)** : section "Ingrédients tendance cette semaine"
     - Titre h2.
     - Tableau 4 colonnes : `INCI` · `Français` · `Évaluation` · `Fonction principale`.
     - Header de tableau `caption` en MAJUSCULES `--text-secondary`, lignes séparées par `border-bottom: 1px solid --border-soft`.
     - 5 lignes minimum. Chevron droit en fin de chaque ligne.
6. **Footer horizontal** :
   - Légende `● Vert ● Jaune ● Orange ● Rouge` à gauche.
   - Liens "À propos · Méthodologie · Sources INCI" à droite, séparés par `·`.

### 5.2 RÉSULTAT D'ANALYSE (desktop)

**Aucun collapse** sur desktop : tout est visible d'emblée.

1. **Breadcrumb** "Accueil > Nouvelle analyse" en `body-secondary`.
2. **Header de page** : nom produit `h1` à gauche + actions à droite ("↓ Télécharger en PDF", "↗ Partager") en pills `--bg-card`.
3. **Layout 3 colonnes** (CSS Grid 1.2fr 1.6fr 1.6fr, gap 24px) :

   - **Colonne 1 (gauche, 30%)** :
     - **Gauge circulaire grande 160×160px** avec score au centre.
     - Pill "Très bien" en dessous, centrée.
     - **Carte "Spectre top 5"** : 5 carrés 32×32 colorés + chiffres 1-5.
     - **Carte "Spectre top 10"** : 10 carrés plus petits.
     - **Bloc KPI 4 cellules** (grille 4 colonnes ou 2×2) : Vert · Jaune · Orange · Rouge avec le compte de chacun en gros.

   - **Colonne 2 (centre, 35%)** :
     - **Carte "Observations"** :
       - Titre h2.
       - Liste verticale **complète** (pas de "voir plus"). Chaque item : check + texte.
     - **Carte "Synthèse"** :
       - Titre h2.
       - Paragraphe complet + bullet list complète avec INCI en gras.

   - **Colonne 3 (droite, 35%)** :
     - **Carte "Ingrédients"** :
       - Titre h2.
       - Filter pills "Tous · Vert · Jaune · Orange · Rouge".
       - Search field.
       - **Tableau** avec colonnes : `Pos.` · `INCI` · `Fonction` · `Éval.` · `Parfum` · (chevron).
       - Header en `caption` MAJUSCULES `--text-secondary`.
       - Lignes : 13 (toutes), séparées par `border-bottom: 1px solid --border-soft`.
       - Colonne "Parfum" : badge `caption` "avant parfum" / "après parfum" / "—" si non applicable.
       - Colonne "Éval." : pastille couleur seule (pas de texte, pour gagner de la place).

4. **Section "Produits similaires analysés récemment"** :
   - Titre h2.
   - **Carrousel horizontal** de 3 cartes-produits (ou grille 3 colonnes si pas de scroll).
   - Chaque carte : vignette + nom + sous-titre catégorie + grand score à droite + pill couleur.
   - Source : RPC `find_similar_products(analysis_id := X, limit := 3)` qui se base sur la catégorisation IA + le profil de tags.

### 5.3 ROUTINE DASHBOARD (desktop)

1. **Header** : "Ma routine quotidienne" h1 + à droite hint `caption` "Astuce : sélectionne 2 analyses pour les comparer côte à côte." (couleur secondary).
2. **Ligne de 3 KPI cards** (grille 3 colonnes égales, gap 16px) :
   - **Exposition cumulée** : layout horizontal avec gauge 80×80 + grand chiffre "14.2 /20" + petit delta `12.9 /20` montrant l'amélioration potentielle avec un trait coral.
   - **Produits actifs** : grand chiffre "4" + petits emojis produits empilés à droite.
   - **Catégories pénalisantes** : grand chiffre "5" + icône warning ⚠️ à droite (background jaune pâle).
3. **Grille 2 colonnes (60/40)** :
   - **Gauche** : Carte "Exposition cumulée par catégorie d'ingrédients (par tag)"
     - **Bar chart horizontal**. Catégories en rangées (Allergènes parfumants, Conservateurs, Sulfates, Silicones, Alcools, Huiles minérales, PEG/PPG, Autres).
     - Chaque barre : couleur de la sévérité de la catégorie (allergènes en orange, sulfates en rouge, etc.). Largeur proportionnelle au compte d'occurrences cumulées.
     - Axe X libellé "Nombre d'occurrences cumulées" en `caption`.
     - Sous-titre `caption` `--text-secondary` : "Plus la barre est longue et rouge, plus la catégorie est présente dans ta routine."
   - **Droite** : Carte "Mes produits"
     - Titre h2 + liste verticale de 4 produits.
     - Chaque ligne : vignette + nom + marque + pill score (ex. "13.2/20" sur fond couleur) + selector "Quotidien ▾" / "Hebdo ▾" + trash icon.
4. **Carte "Simulation"** (pleine largeur) :
   - Titre `caption` "Simulation".
   - Question `body` : "Que se passe-t-il si je retire les 2 produits les plus pénalisants ?"
   - À droite : "Nouvelle exposition : **16.8/20**" + flèche verte ↑ "+2.6".
   - **Bouton "Simuler"** corail à droite (background `--accent-coral`, texte blanc, padding 10px 20px, `--radius-button`).
   - Source : appel à un endpoint `/api/routine/simulate` qui retourne le delta réel après retrait des 2 produits aux scores les plus bas.

### 5.4 HISTORIQUE (desktop)

1. Header "Mon historique" h1.
2. **Toolbar** :
   - Recherche pleine largeur à gauche `Rechercher un produit ou une marque…` (input `--radius-input`, `--border`).
   - Filter chips à droite : "Tous" (actif noir) · "Cette semaine" · "Ce mois" · "Renommés".
   - Bouton noir extrême droite : "Comparer les sélections ({N})" (disabled si N < 2, actif si exactement 2).
3. **Layout 2 colonnes** :
   - **Sidebar gauche (260px)** : "Profile mini-card"
     - Avatar BB grand, nom, email.
     - Menu vertical : "Mon compte" (actif), "Préférences d'analyse", "Notifications", "Confidentialité", "Aide", "Se déconnecter" (couleur `--danger-text`).
   - **Right (rest)** : **Tableau**
     - Colonnes : ☐ · Score (pill couleur) · Nom (avec pencil icon au hover) · Date · Alertes (icônes warning/check) · ⋯ (menu).
     - 8 lignes visibles, plus pagination ou scroll infini.
     - Source : `analyses` filtrée par `user_id`, ordonnée par `created_at desc`.
4. **Sous le tableau** : section "Mon compte"
   - Form avec inputs Prénom / Email (read-only) / Mot de passe + bouton "Modifier".
5. **À droite** : Card "Mon abonnement"
   - Pill noir "Accès complet · Gratuit pour le moment".
   - Texte d'explication : "Toutes les fonctionnalités sont disponibles gratuitement pendant la phase de lancement."
   - Petite illustration bécher décorative à droite.

> Note d'implémentation : la maquette mélange Historique et Profil dans la même fenêtre desktop. On peut les conserver dans une seule route `/account` ou les séparer en `/history` et `/profile`. **Décision** : séparer en deux routes mais permettre l'affichage côte à côte sur viewport large.

---

## 6. Composants UI partagés — pixel-perfect

### 6.1 Gauge circulaire

- SVG `viewBox: "0 0 100 100"`.
- Fond : cercle blanc/transparent, ring gris `--border` épaisseur 8.
- Foreground : arc coloré, épaisseur 8, `stroke-linecap: round`.
- **Couleur** : selon la note
  - score ≥ 16 → `--rate-vert`
  - 12 ≤ score < 16 → `--rate-jaune`
  - 8 ≤ score < 12 → `--rate-orange`
  - score < 8 → `--rate-rouge`
- **Pas d'animation hors entrée** : `transition: stroke-dashoffset 800ms ease-out` au premier rendu uniquement.
- Texte au centre : `font-weight: 700`, taille adaptée à la taille de la gauge (24px pour 80×80, 32px pour 120×120, 48px pour 160×160).
- Suffixe "/20" en `body-secondary` plus petit collé au score.

### 6.2 Spectrum (top 5 / top 10)

- Container flex horizontal.
- Carré : `width: 32px; height: 32px; --radius: 6px;` (top 5), `width: 16px; height: 16px;` (top 10).
- Gap 8px (top 5), 4px (top 10).
- Couleur de fond selon la note de l'ingrédient à cette position.
- Position vide : `background: --rate-empty`.
- Au tap (mobile) ou hover (desktop), tooltip avec nom INCI + scroll vers la ligne correspondante de la liste.

### 6.3 Filter pills

- Conteneur scrollable horizontal sur mobile, fixe sur desktop.
- Pill inactive : `background: --bg-card`, `border: 1px solid --border`, padding 8px 14px, `body`, `--radius-pill`, gap 6px (entre nom et count).
- Pill active : `background: --cta-primary-bg`, `color: --cta-primary-fg`.
- Count à côté du label, **couleur de la note** (vert, jaune, etc.) — fonctionne sur pill inactive comme active.

### 6.4 Card produit (utilisée dans Routine, Produits similaires, Historique)

- `background: --bg-card`, `--radius-card`, `border: 1px solid --border`, padding 16px.
- Layout : flex horizontal align-items center, gap 12px.
- Vignette : `48×48` mobile, `60×60` desktop, `--radius: 8px`, object-fit: cover.
- Bloc texte : flex column, nom bold, marque secondary.
- Pill score à droite : padding 6px 10px, `--radius-pill`, background couleur pâle de la note, texte couleur foncée de la note, `body` bold.

### 6.5 Bouton CTA primaire

- `background: --cta-primary-bg` (#111111), `color: white`, `--radius-button`, padding 12px 20px, `body` bold.
- Hover : luminosité +8% via `filter: brightness(1.08)`.
- Disabled : opacity 0.4.

### 6.6 Lien `link-accent`

- `color: --accent-coral`, `font-weight: 500`, `font-size: 14px`.
- Pas de `text-decoration`.
- Hover : underline apparaît.
- Toujours suivi d'une flèche `→` (ou `↑` pour replier).

### 6.7 Toast / Snackbar (notifications)
- Bottom center mobile (au-dessus de la nav), top right desktop.
- Background `--text-primary` (noir), texte blanc, `--radius-card`, padding 12px 16px, ombre `--shadow-elevated`.
- Disparaît après 4 secondes.

---

## 7. États non-nominaux (à NE PAS oublier)

### 7.1 Loading

- **Skeleton screens** sur les cartes (background animé `--border-soft` → `--bg-card`).
- Jamais de spinner plein écran sauf sur le bouton submit d'un formulaire.

### 7.2 Empty states

Chaque carte avec données dynamiques doit gérer son état vide :

| Carte | État vide |
|---|---|
| Dernière analyse | "Lance ta première analyse" + CTA noir "Analyser maintenant" |
| Ta routine | "Crée ta routine pour suivre ton exposition cumulée" + CTA |
| Ingrédients tendance | "Pas encore de tendance — reviens demain" |
| Historique | "Aucune analyse pour l'instant. Lance-toi !" + CTA |
| Routine produits | Carte CTA dashed coral "+ Ajouter un produit" seule |

### 7.3 Erreurs API

- Bandeau rouge clair en haut de la zone concernée avec icône `AlertCircle` + message + bouton "Réessayer".
- Ne JAMAIS afficher d'erreur technique brute. Toujours un message utilisateur ("On n'a pas pu charger ta routine.").

### 7.4 Mode invité (sans compte)

- Bannière douce en bas de la home : "Crée un compte pour sauvegarder tes analyses" + bouton coral "S'inscrire".
- L'historique et la routine sont **masqués** ou affichent un état vide CTA "Connecte-toi pour accéder".

---

## 8. Données réelles — règles strictes

### 8.1 Toutes les analyses montrées dans la spec correspondent à des produits **réels**

Les noms cités (La Roche-Posay Effaclar Duo+, Bioderma Sébium Gel Moussant, Avène Cleanance SPF 50+, CeraVe Crème Hydratante…) sont des produits qui **existent** et dont la composition INCI est publique. Pour les exemples internes (storybook, tests visuels), on stocke les compositions réelles en `data/fixtures/products.json` à partir de leur fiche INCI Beauty ou Open Beauty Facts.

### 8.2 Interdictions

- ❌ Pas de `Lorem ipsum`.
- ❌ Pas de score arbitraire ("18.3/20" doit être le score retourné par l'API sur la vraie composition).
- ❌ Pas de "Produit A / Produit B" comme noms.
- ❌ Pas de synthèse IA hardcodée — toujours appeler `/api/analyser` (avec cache si la liste a déjà été analysée).
- ❌ Pas d'ingrédients tendance figés — toujours requête sur la vraie table.
- ❌ Pas de gauges remplies "à 50 %" pour le décor.

### 8.3 Tests UI

- Les tests Playwright/Storybook **peuvent** utiliser des fixtures, mais ces fixtures sont des **vraies analyses** stockées en JSON (résultat d'un vrai appel API capturé une fois pour toutes).
- Les fixtures sont régénérables via un script `scripts/refresh-fixtures.ts` qui rappelle l'API sur les listes INCI réelles.

### 8.4 État initial d'un nouveau compte

Quand un utilisateur crée un compte, sa home affiche :
- Greeting avec son prénom réel.
- Carte "Dernière analyse" en **état vide** (cf. §7.2).
- Carte "Ta routine" en **état vide**.
- Astuce du jour + Catégories populaires + Ingrédients tendance restent visibles (ce sont des données globales, pas user-specific).

→ Pas de fake "dernière analyse Effaclar" pour un user qui vient de s'inscrire. Jamais.

---

## 9. Animations et transitions

- **Page transitions** : fade-in 180ms, pas de slide.
- **Bottom sheet (mobile)** : slide-up 220ms ease-out.
- **Dropdown sidebar (desktop)** : scale + fade 160ms.
- **Gauge** : animation au premier mount uniquement, 800ms ease-out.
- **Collapse "Voir plus"** : height auto avec `transition: max-height 240ms ease-out` + opacity.
- **Hover desktop** : 120ms ease.
- **Toast** : slide-in 180ms, slide-out 180ms.

Toutes les animations respectent `prefers-reduced-motion`.

---

## 10. Accessibilité (rappels pour l'implémentation)

- Contraste minimum AA partout (le corail #F43F5E sur blanc passe AA ; les pastilles de note doivent toujours être doublées d'un libellé texte).
- `aria-label` sur le bouton scan central : "Ouvrir le menu d'analyse".
- `role="dialog"` + `aria-modal="true"` sur la bottom sheet + focus trap + Esc pour fermer.
- Tous les inputs ont un `<label>` lié.
- Tableaux sémantiques (`<table>`, `<thead>`, `<tbody>`) pour Ingrédients et Historique desktop.
- Navigation clavier complète testée sur Historique (cocher des lignes, ouvrir le menu ⋯).

---

## Annexe — Mapping pages → routes

| Page | Route | Auth requise |
|---|---|---|
| Accueil | `/` | non |
| Scan sheet | overlay sur toute page | non |
| Résultat analyse | `/analyse/[id]` ou `/analyse?session=...` | non (sauvegarde si auth) |
| Détail ingrédient | `/ingredient/[slug]` | non |
| Routine | `/routine` | oui |
| Historique | `/history` | oui |
| Profil | `/profile` | oui |
| Compare | `/compare?ids=a,b` | oui |
| Sign up | `/auth/sign-up` | non (redirige si déjà co) |
| Sign in | `/auth/sign-in` | non (redirige si déjà co) |
| OCR camera | `/scan/photo` | non |

---

## Annexe — Checklist d'intégration

- [ ] Sidebar desktop 240px implémentée, sticky, avec sélection d'item actif.
- [ ] Bottom nav mobile 64px avec FAB scan central surélevé.
- [ ] Bottom sheet scan avec 4 tuiles 2×2 + animation slide-up.
- [ ] Dropdown desktop "Analyser un produit" 360px largeur, 4 lignes.
- [ ] Pattern "Voir plus" sur Synthèse + Ingrédients **uniquement** sous breakpoint `lg`.
- [ ] Gauge circulaire réutilisable, taille param (64/80/88/120/160).
- [ ] Spectre top 5/10 cliquable avec scroll smooth + flash.
- [ ] Badges "avant/après parfum/conservateur" dans la liste d'ingrédients en mode expanded mobile et toujours visible en desktop.
- [ ] Card "Astuce du jour" avec rotation déterministe sur 7 jours.
- [ ] CTA "+ Ajouter un produit" en dashed coral.
- [ ] Tous les empty states implémentés (cf. §7.2).
- [ ] Aucune valeur en dur dans le JSX (sauf labels d'interface). **Vérifié par revue de code.**
