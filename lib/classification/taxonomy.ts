/**
 * Taxonomy: 12 French top-level categories + ~60 subcategories.
 *
 * Structure mirrors INCI Beauty's hierarchy. Products are classified at the
 * subcategory level; the top-level category is derived from it.
 *
 * Classification priority:
 *   1. OBF category mapping (obfToSubcategory)
 *   2. Name-based rules (nameRules), applied on brand+name lowercased
 *   3. INCI-based heuristics (for products with no match above)
 */

export type TopCategory =
  | "Soin du visage"
  | "Soin du corps"
  | "Hygiène du corps"
  | "Coiffure"
  | "Maquillage"
  | "Protection solaire"
  | "Parfum"
  | "Hygiène dentaire"
  | "Soin bébé"
  | "Rasage & épilation"
  | "Manucure & pédicure"
  | "Bien-être";

export type Subcategory =
  // Soin du visage
  | "Crème & soin hydratant visage"
  | "Sérum visage"
  | "Nettoyant visage"
  | "Masque visage"
  | "Contour des yeux"
  | "Tonique & eau micellaire"
  | "Exfoliant visage"
  | "Démaquillant"
  | "Soin anti-âge visage"
  // Soin du corps
  | "Lait & crème corps"
  | "Huile corps"
  | "Gommage corps"
  | "Après-soleil"
  | "Crème mains"
  | "Soin pieds"
  | "Baume corps"
  | "Soin amincissant"
  // Hygiène du corps
  | "Gel douche & savon"
  | "Déodorant & anti-transpirant"
  | "Hygiène intime"
  | "Gel hydroalcoolique"
  | "Lingette"
  // Coiffure
  | "Shampooing"
  | "Après-shampooing & masque capillaire"
  | "Soin capillaire"
  | "Coiffant"
  | "Coloration capillaire"
  | "Shampooing sec"
  // Maquillage
  | "Fond de teint & BB cream"
  | "Anticerne & correcteur"
  | "Blush, bronzer & illuminateur"
  | "Mascara"
  | "Fard à paupières"
  | "Eyeliner & crayon yeux"
  | "Rouge à lèvres & gloss"
  | "Baume à lèvres"
  | "Crayon lèvres"
  | "Primer & fixateur"
  | "Poudre de finition"
  | "Démaquillant & nettoyant"
  // Protection solaire
  | "Protection solaire"
  | "Autobronzant"
  // Parfum
  | "Eau de parfum & cologne"
  | "Brume parfumée"
  // Hygiène dentaire
  | "Dentifrice"
  | "Bain de bouche"
  | "Soin dentaire"
  // Soin bébé
  | "Soin bébé"
  // Rasage & épilation
  | "Rasage"
  | "Épilation"
  | "Soin après-rasage"
  // Manucure & pédicure
  | "Vernis à ongles"
  | "Soin des ongles"
  // Bien-être
  | "Huile essentielle"
  | "Soin bien-être";

export type Classification = {
  category: TopCategory;
  subcategory: Subcategory;
};

/** All subcategories with their parent category */
export const SUBCATEGORY_PARENT: Record<Subcategory, TopCategory> = {
  "Crème & soin hydratant visage": "Soin du visage",
  "Sérum visage": "Soin du visage",
  "Nettoyant visage": "Soin du visage",
  "Masque visage": "Soin du visage",
  "Contour des yeux": "Soin du visage",
  "Tonique & eau micellaire": "Soin du visage",
  "Exfoliant visage": "Soin du visage",
  "Démaquillant": "Soin du visage",
  "Soin anti-âge visage": "Soin du visage",
  "Lait & crème corps": "Soin du corps",
  "Huile corps": "Soin du corps",
  "Gommage corps": "Soin du corps",
  "Après-soleil": "Protection solaire",
  "Crème mains": "Soin du corps",
  "Soin pieds": "Soin du corps",
  "Baume corps": "Soin du corps",
  "Soin amincissant": "Soin du corps",
  "Gel douche & savon": "Hygiène du corps",
  "Déodorant & anti-transpirant": "Hygiène du corps",
  "Hygiène intime": "Hygiène du corps",
  "Gel hydroalcoolique": "Hygiène du corps",
  "Lingette": "Hygiène du corps",
  "Shampooing": "Coiffure",
  "Après-shampooing & masque capillaire": "Coiffure",
  "Soin capillaire": "Coiffure",
  "Coiffant": "Coiffure",
  "Coloration capillaire": "Coiffure",
  "Shampooing sec": "Coiffure",
  "Fond de teint & BB cream": "Maquillage",
  "Anticerne & correcteur": "Maquillage",
  "Blush, bronzer & illuminateur": "Maquillage",
  "Mascara": "Maquillage",
  "Fard à paupières": "Maquillage",
  "Eyeliner & crayon yeux": "Maquillage",
  "Rouge à lèvres & gloss": "Maquillage",
  "Baume à lèvres": "Maquillage",
  "Crayon lèvres": "Maquillage",
  "Primer & fixateur": "Maquillage",
  "Poudre de finition": "Maquillage",
  "Démaquillant & nettoyant": "Maquillage",
  "Protection solaire": "Protection solaire",
  "Autobronzant": "Protection solaire",
  "Eau de parfum & cologne": "Parfum",
  "Brume parfumée": "Parfum",
  "Dentifrice": "Hygiène dentaire",
  "Bain de bouche": "Hygiène dentaire",
  "Soin dentaire": "Hygiène dentaire",
  "Soin bébé": "Soin bébé",
  "Rasage": "Rasage & épilation",
  "Épilation": "Rasage & épilation",
  "Soin après-rasage": "Rasage & épilation",
  "Vernis à ongles": "Manucure & pédicure",
  "Soin des ongles": "Manucure & pédicure",
  "Huile essentielle": "Bien-être",
  "Soin bien-être": "Bien-être",
};

/**
 * Maps OBF category slugs → subcategory.
 * Values are intentionally typed so TS catches missing entries.
 */
export const OBF_TO_SUBCATEGORY: Record<string, Subcategory> = {
  // ─── SOIN DU VISAGE ────────────────────────────────────────────────────
  "moisturizers": "Crème & soin hydratant visage",
  "moisturizer": "Crème & soin hydratant visage",
  "moisturiser": "Crème & soin hydratant visage",
  "moisturisers": "Crème & soin hydratant visage",
  "moisturizing-cream": "Crème & soin hydratant visage",
  "moisturizing-lotion": "Crème & soin hydratant visage",
  "moisturers": "Crème & soin hydratant visage",
  "face-creams": "Crème & soin hydratant visage",
  "face-cream": "Crème & soin hydratant visage",
  "facial-creams": "Crème & soin hydratant visage",
  "day-creams": "Crème & soin hydratant visage",
  "night-creams": "Crème & soin hydratant visage",
  "day-and-night-creams": "Crème & soin hydratant visage",
  "anti-wrinkles-creams": "Soin anti-âge visage",
  "anti-aging-face-care-products": "Soin anti-âge visage",
  "retinoids": "Soin anti-âge visage",
  "face-lotions": "Crème & soin hydratant visage",
  "face-moisturiser": "Crème & soin hydratant visage",
  "hydrate-face-cream": "Crème & soin hydratant visage",
  "skin-care-cream": "Crème & soin hydratant visage",
  "face-body-cream": "Crème & soin hydratant visage",
  "moisturising-skin-tint": "Fond de teint & BB cream",
  "face-serums": "Sérum visage",
  "face-serum": "Sérum visage",
  "serums": "Sérum visage",
  "serum": "Sérum visage",
  "men-serum": "Sérum visage",
  "oil-based-serum": "Sérum visage",
  "facial-serum": "Sérum visage",
  "direct-acids": "Sérum visage",
  "face-cleansers": "Nettoyant visage",
  "face-cleanser": "Nettoyant visage",
  "facial-cleanser": "Nettoyant visage",
  "face-wash": "Nettoyant visage",
  "face-wash-facial-cleanser": "Nettoyant visage",
  "face-wash-gel": "Nettoyant visage",
  "face-cleansing-gel": "Nettoyant visage",
  "facial-wash": "Nettoyant visage",
  "facewash": "Nettoyant visage",
  "cleansing-milks": "Nettoyant visage",
  "cleansing-gels": "Nettoyant visage",
  "cleansing-balm": "Nettoyant visage",
  "cleansing-oil": "Nettoyant visage",
  "cleansing-waters": "Tonique & eau micellaire",
  "face-soaps": "Nettoyant visage",
  "cleaner": "Nettoyant visage",
  "cleansers": "Nettoyant visage",
  "cleansing": "Nettoyant visage",
  "cream-cleanser": "Nettoyant visage",
  "face-care": "Nettoyant visage",
  "face-masks": "Masque visage",
  "face-mask": "Masque visage",
  "masques-visage": "Masque visage",
  "facial-mask-3-pure-clays-seaweed": "Masque visage",
  "nose-strips": "Masque visage",
  "pore-strips": "Masque visage",
  "pimple-patches": "Masque visage",
  "eye-creams": "Contour des yeux",
  "eye-cream": "Contour des yeux",
  "peptide-eye-patches": "Contour des yeux",
  "face-toners": "Tonique & eau micellaire",
  "face-toner": "Tonique & eau micellaire",
  "toner": "Tonique & eau micellaire",
  "tonic": "Tonique & eau micellaire",
  "facial-toner": "Tonique & eau micellaire",
  "micellar-waters": "Tonique & eau micellaire",
  "micellar-water": "Tonique & eau micellaire",
  "rose-water": "Tonique & eau micellaire",
  "face-mist": "Tonique & eau micellaire",
  "clarity-tonic": "Tonique & eau micellaire",
  "face-scrubs": "Exfoliant visage",
  "face-scrub": "Exfoliant visage",
  "makeup-removers": "Démaquillant",
  "make-up-remover": "Démaquillant",
  "eye-makeup-remover": "Démaquillant",
  "cleansing-wipes": "Démaquillant",
  "masks": "Masque visage",  // may also be hair, but face is more common in OBF

  // ─── SOIN DU CORPS ────────────────────────────────────────────────────
  "body-lotions": "Lait & crème corps",
  "body-lotion": "Lait & crème corps",
  "body-milks": "Lait & crème corps",
  "body-milk": "Lait & crème corps",
  "body-creams": "Lait & crème corps",
  "body-cream": "Lait & crème corps",
  "lotions": "Lait & crème corps",
  "lotion": "Lait & crème corps",
  "lotion-moisturizer": "Lait & crème corps",
  "hydrating-lotion": "Lait & crème corps",
  "in-shower-body-lotion": "Lait & crème corps",
  "body-gels": "Lait & crème corps",
  "body-serum": "Lait & crème corps",
  "laits-pour-le-corps": "Lait & crème corps",
  "soins-du-corps": "Lait & crème corps",
  "body-care": "Lait & crème corps",
  "hand-and-body-lotion": "Lait & crème corps",
  "hand-body-lotion": "Lait & crème corps",
  "body-oils": "Huile corps",
  "body-oil": "Huile corps",
  "vegetable-oils": "Huile corps",
  "hair-oils": "Soin capillaire",
  "hair-oil": "Soin capillaire",
  "body-scrubs": "Gommage corps",
  "body-peeling": "Gommage corps",
  "scrub-foam": "Gommage corps",
  "after-sun-care": "Après-soleil",
  "apres-solaires": "Après-soleil",
  "aftersun": "Après-soleil",
  "hand-creams": "Crème mains",
  "hand-cream": "Crème mains",
  "hand-creme": "Crème mains",
  "foot-creams": "Soin pieds",
  "foot-cream": "Soin pieds",
  "foot-care": "Soin pieds",
  "foot-repair": "Soin pieds",
  "foot-scrub": "Soin pieds",
  "cremes-pour-les-pieds": "Soin pieds",
  "foot-lotion": "Soin pieds",
  "balms": "Baume corps",
  "body-balm": "Baume corps",
  "body-butters": "Baume corps",
  "body-butter": "Baume corps",
  "shea-butter": "Baume corps",
  "cocoa-butter": "Baume corps",
  "petroleum-jelly": "Baume corps",
  "petroleum-jellies": "Baume corps",
  "petrolatum": "Baume corps",
  "slimming-body-care": "Soin amincissant",
  "anti-cellulite": "Soin amincissant",
  "strech-marks-cream": "Soin amincissant",

  // ─── HYGIÈNE DU CORPS ─────────────────────────────────────────────────
  "shower-gels": "Gel douche & savon",
  "shower-gel": "Gel douche & savon",
  "shower-cream": "Gel douche & savon",
  "shower-milk": "Gel douche & savon",
  "gel": "Gel douche & savon",
  "soaps": "Gel douche & savon",
  "soap": "Gel douche & savon",
  "bar-soap": "Gel douche & savon",
  "bar-soup": "Gel douche & savon",
  "bath-soap": "Gel douche & savon",
  "liquid-soap": "Gel douche & savon",
  "showers-and-baths": "Gel douche & savon",
  "bath-products": "Gel douche & savon",
  "bath-and-body": "Gel douche & savon",
  "bath-and-body-works": "Gel douche & savon",
  "bubble-baths": "Gel douche & savon",
  "bubble-bath": "Gel douche & savon",
  "bath-foam": "Gel douche & savon",
  "bath-emulsion-for-children": "Soin bébé",
  "bath-cream": "Gel douche & savon",
  "bath-additive": "Gel douche & savon",
  "bath-soak": "Gel douche & savon",
  "bath-salts": "Gel douche & savon",
  "body-wash": "Gel douche & savon",
  "bodywash": "Gel douche & savon",
  "plant-based-body-wash": "Gel douche & savon",
  "foaming-shower-gel": "Gel douche & savon",
  "gels-douche": "Gel douche & savon",
  "douches-et-bains": "Gel douche & savon",
  "extra-gentle-shower-cream": "Gel douche & savon",
  "dermatological-soaps": "Gel douche & savon",
  "seifen": "Gel douche & savon",
  "savons": "Gel douche & savon",
  "savon": "Gel douche & savon",
  "savon-pour-les-mains": "Gel douche & savon",
  "savon-liquide": "Gel douche & savon",
  "hand-wash": "Gel douche & savon",
  "hand-soap": "Gel douche & savon",
  "liquid-handwash": "Gel douche & savon",
  "hand-soap-sanitizers": "Gel douche & savon",
  "hand-soaps": "Gel douche & savon",
  "hand-wash-liquid-soaps": "Gel douche & savon",
  "liquid-hand-soap": "Gel douche & savon",
  "glycerine-soap": "Gel douche & savon",
  "deodorant-soap": "Gel douche & savon",
  "syndet-bar": "Gel douche & savon",
  "deodorants": "Déodorant & anti-transpirant",
  "deodorant": "Déodorant & anti-transpirant",
  "antiperspirants": "Déodorant & anti-transpirant",
  "antiperspirant": "Déodorant & anti-transpirant",
  "anti-perspirants": "Déodorant & anti-transpirant",
  "roll-on-deodorants": "Déodorant & anti-transpirant",
  "deodorant-anti-perspirant": "Déodorant & anti-transpirant",
  "deodorants-anti-transpirants": "Déodorant & anti-transpirant",
  "deodorant-antiperspirant": "Déodorant & anti-transpirant",
  "underarm-deodorant": "Déodorant & anti-transpirant",
  "deodrant": "Déodorant & anti-transpirant",
  "deoderant": "Déodorant & anti-transpirant",
  "drodorizing-talc": "Déodorant & anti-transpirant",
  "intimate-hygiene": "Hygiène intime",
  "personal-lubricants": "Hygiène intime",
  "lubricating-gels": "Hygiène intime",
  "perineum-care": "Hygiène intime",
  "perineum-foam": "Hygiène intime",
  "personal-lubricant": "Hygiène intime",
  "lube": "Hygiène intime",
  "lubricant": "Hygiène intime",
  "personal-hygiene": "Gel douche & savon",
  "hygiene": "Gel douche & savon",
  "hydro-alcoholic-gels": "Gel hydroalcoolique",
  "hand-sanitizer": "Gel hydroalcoolique",
  "hand-sanitizers": "Gel hydroalcoolique",
  "hand-sanitizer-sanitizers": "Gel hydroalcoolique",
  "sanitizer": "Gel hydroalcoolique",
  "hand-soap-infused-with-essential-oil": "Gel douche & savon",
  "wipes": "Lingette",
  "wet-wipes": "Lingette",
  "moist-wipes": "Lingette",
  "flushable-wipes": "Lingette",
  "toilet-wipes": "Lingette",
  "germ-protection-wipes": "Lingette",
  "body-powders": "Déodorant & anti-transpirant",
  "talcum-powder": "Déodorant & anti-transpirant",
  "talcom-powder": "Déodorant & anti-transpirant",
  "talco": "Déodorant & anti-transpirant",

  // ─── COIFFURE ─────────────────────────────────────────────────────────
  "shampoos": "Shampooing",
  "shampoo": "Shampooing",
  "shampoings": "Shampooing",
  "shampooing": "Shampooing",
  "revitalizing-shampoo": "Shampooing",
  "shampoo-anti-dandruff": "Shampooing",
  "shampoo-all-hair-types": "Shampooing",
  "shampoo-for-dandruff": "Shampooing",
  "shampoings-pour-cheveux-secs": "Shampooing",
  "shampoo-5in1": "Shampooing",
  "baby-shampoo": "Soin bébé",
  "dry-shampoos": "Shampooing sec",
  "dry-shampoo": "Shampooing sec",
  "conditioners": "Après-shampooing & masque capillaire",
  "conditioner": "Après-shampooing & masque capillaire",
  "hair-conditioners": "Après-shampooing & masque capillaire",
  "hair-conditioner": "Après-shampooing & masque capillaire",
  "hair-conditioners-for-damaged-hair": "Après-shampooing & masque capillaire",
  "hair-conditioners-for-dry-hair": "Après-shampooing & masque capillaire",
  "hair-conditioners-for-regular-hair": "Après-shampooing & masque capillaire",
  "hair-conditioners-for-colored-hair": "Après-shampooing & masque capillaire",
  "leave-in-conditioner": "Après-shampooing & masque capillaire",
  "hair-masks": "Après-shampooing & masque capillaire",
  "hair-mask": "Après-shampooing & masque capillaire",
  "masque-capillaire-reparateur-sans-rincage": "Après-shampooing & masque capillaire",
  "hair-care": "Soin capillaire",
  "hair-treatment": "Soin capillaire",
  "hair-serum": "Soin capillaire",
  "hair-night-creme": "Soin capillaire",
  "leave-in-collagen-serum-treatment": "Soin capillaire",
  "keratin": "Soin capillaire",
  "hair-repair": "Soin capillaire",
  "scalp-lotion": "Soin capillaire",
  "hair-perfume": "Brume parfumée",
  "hair-en-hair-care": "Soin capillaire",
  "hair-and-body-care": "Soin capillaire",
  "hair": "Soin capillaire",
  "cheveux": "Soin capillaire",
  "cheveux-normaux": "Soin capillaire",
  "hair-styling": "Coiffant",
  "hair-gel": "Coiffant",
  "hair-sprays": "Coiffant",
  "hair-spray": "Coiffant",
  "hair-mousse": "Coiffant",
  "hair-creams": "Coiffant",
  "hair-curl-cream": "Coiffant",
  "hair-straightening": "Coiffant",
  "hair-fibre": "Coiffant",
  "moustache-wax": "Coiffant",
  "spray-wax": "Coiffant",
  "shaping-lotions": "Coiffant",
  "styling": "Coiffant",
  "hair-styling-product": "Coiffant",
  "hair-styling-oil": "Coiffant",
  "hairstyling-foam": "Coiffant",
  "hair-gloss": "Coiffant",
  "hair-color": "Coloration capillaire",
  "hair-dyes": "Coloration capillaire",
  "hair-dye": "Coloration capillaire",
  "colorations-capillaires": "Coloration capillaire",
  "colour-developer": "Coloration capillaire",
  "developer": "Coloration capillaire",
  "lightener": "Coloration capillaire",
  "bleaching-gels": "Coloration capillaire",

  // ─── MAQUILLAGE ───────────────────────────────────────────────────────
  "foundations": "Fond de teint & BB cream",
  "cosmetic-foundations": "Fond de teint & BB cream",
  "bb-cc-creams-face-makeup": "Fond de teint & BB cream",
  "face-makeup": "Fond de teint & BB cream",
  "maquillage-pour-le-teint": "Fond de teint & BB cream",
  "concealers": "Anticerne & correcteur",
  "blushes": "Blush, bronzer & illuminateur",
  "bronzers": "Blush, bronzer & illuminateur",
  "highlighters": "Blush, bronzer & illuminateur",
  "powder-bronzer": "Blush, bronzer & illuminateur",
  "mascaras": "Mascara",
  "lash-growth": "Mascara",
  "eyeshadows": "Fard à paupières",
  "eyeshadow-stick": "Fard à paupières",
  "eyeliners": "Eyeliner & crayon yeux",
  "liquid-eyeliner": "Eyeliner & crayon yeux",
  "eyebrows": "Eyeliner & crayon yeux",
  "lipsticks": "Rouge à lèvres & gloss",
  "lip-glosses": "Rouge à lèvres & gloss",
  "lip-gloss": "Rouge à lèvres & gloss",
  "lipgloss": "Rouge à lèvres & gloss",
  "lip-makeup": "Rouge à lèvres & gloss",
  "pink-lipstick": "Rouge à lèvres & gloss",
  "voluming-gloss": "Rouge à lèvres & gloss",
  "lip-balms": "Baume à lèvres",
  "lip-balm": "Baume à lèvres",
  "moisturizing-lip-balm": "Baume à lèvres",
  "lippenpflege": "Baume à lèvres",
  "lip-stickers": "Baume à lèvres",
  "lip-liners": "Crayon lèvres",
  "lip-pencils": "Crayon lèvres",
  "makeup-primers": "Primer & fixateur",
  "makeup-primers-face-primers": "Primer & fixateur",
  "primer": "Primer & fixateur",
  "makeup-fixers": "Primer & fixateur",
  "setting-spray": "Primer & fixateur",
  "powders": "Poudre de finition",
  "loose-powder": "Poudre de finition",
  "makeup": "Fond de teint & BB cream",
  "sprays": "Brume parfumée",  // generic - mostly body mists / perfume sprays

  // ─── PROTECTION SOLAIRE ───────────────────────────────────────────────
  "sunscreens": "Protection solaire",
  "sunscreen": "Protection solaire",
  "facial-sunscreens": "Protection solaire",
  "in-sun-protections": "Protection solaire",
  "sun-screen": "Protection solaire",
  "sunscreen-cream": "Protection solaire",
  "sunscreen-spf-30": "Protection solaire",
  "sunscreen-gel": "Protection solaire",
  "spf-50": "Protection solaire",
  "spf": "Protection solaire",
  "sun-stick": "Protection solaire",
  "sun-lotion": "Protection solaire",
  "sun-block": "Protection solaire",
  "suncare": "Protection solaire",
  "self-tanners": "Autobronzant",
  "self-tanner": "Autobronzant",
  "tan-preparers": "Autobronzant",

  // ─── PARFUM ───────────────────────────────────────────────────────────
  "perfumes": "Eau de parfum & cologne",
  "perfume": "Eau de parfum & cologne",
  "fragrance": "Eau de parfum & cologne",
  "cologne": "Eau de parfum & cologne",
  "parfum": "Eau de parfum & cologne",
  "body-mist": "Brume parfumée",
  "purifying-and-soothing-spray": "Brume parfumée",

  // ─── HYGIÈNE DENTAIRE ─────────────────────────────────────────────────
  "toothpastes": "Dentifrice",
  "toothpaste": "Dentifrice",
  "toothpast": "Dentifrice",
  "dentifrice": "Dentifrice",
  "tooth-paste": "Dentifrice",
  "whitening-toothpastes": "Dentifrice",
  "zahncreme": "Dentifrice",
  "zahnpasta": "Dentifrice",
  "evo-purple-toothpaste": "Dentifrice",
  "mouthwashes": "Bain de bouche",
  "mouthwash": "Bain de bouche",
  "bains-de-bouche": "Bain de bouche",
  "mouth-wash": "Bain de bouche",
  "mondwater": "Bain de bouche",
  "dental-care": "Soin dentaire",
  "dental": "Soin dentaire",
  "dental-floss": "Soin dentaire",
  "breath-mouth-spray": "Bain de bouche",
  "breath-strips": "Bain de bouche",

  // ─── SOIN BÉBÉ ────────────────────────────────────────────────────────
  "baby-care": "Soin bébé",
  "baby-wipes": "Soin bébé",
  "baby-lotion": "Soin bébé",
  "baby-body-wash": "Soin bébé",
  "baby-wash": "Soin bébé",
  "baby-oil": "Soin bébé",
  "baby-cream": "Soin bébé",
  "baby-soap": "Soin bébé",
  "baby-powder": "Soin bébé",
  "baby-bath-product": "Soin bébé",
  "nappy-cream": "Soin bébé",
  "baby-ointment": "Soin bébé",
  "baby-repair-cream": "Soin bébé",
  "baby-moisturiser": "Soin bébé",
  "cradle-cap-cream": "Soin bébé",
  "kids-wash": "Soin bébé",
  "baby-products": "Soin bébé",

  // ─── RASAGE & ÉPILATION ───────────────────────────────────────────────
  "shaving": "Rasage",
  "shaving-cream": "Rasage",
  "shaving-gel": "Rasage",
  "rasage": "Rasage",
  "razor-blades": "Rasage",
  "razors": "Rasage",
  "after-shave": "Soin après-rasage",
  "beard-care-products-beard-condition-bartshampoos-beardshampoos": "Rasage",
  "beard-oil": "Rasage",
  "beard-balm": "Rasage",
  "beard-and-mo-balm": "Rasage",
  "hair-removal-products": "Épilation",
  "hair-removal": "Épilation",
  "depilatory-wax": "Épilation",
  "lotion-post-epilation": "Épilation",

  // ─── MANUCURE & PÉDICURE ─────────────────────────────────────────────
  "nail-polishes": "Vernis à ongles",
  "nail-polish": "Vernis à ongles",
  "nail-polish-remover": "Soin des ongles",
  "nail-polish-removers": "Soin des ongles",
  "nail-care": "Soin des ongles",
  "nail-oil": "Soin des ongles",
  "nail-products": "Soin des ongles",

  // ─── BIEN-ÊTRE ────────────────────────────────────────────────────────
  "essential-oil": "Huile essentielle",
};

/**
 * HIGH-CONFIDENCE name overrides - run BEFORE OBF lookup.
 * Fixes known OBF mis-tagging (e.g., conditioner tagged as "shampoos",
 * intimate wash tagged as "face-cleansers", eyeliner tagged as "eye-creams").
 * Patterns are specific enough to rarely false-positive.
 */
export const NAME_OVERRIDES: Array<[RegExp, Subcategory]> = [
  // Conditioner/après-shampooing OBF sometimes tags as "shampoos"
  // Note: "conditioner" deliberately excluded - it appears in face products too ("Night Conditioner Cure visage")
  [/\b(apres.?shampoo?ing|after.?shamp|balsamo.capillaire|districant|districante)\b/i, "Après-shampooing & masque capillaire"],
  // Intimate wash OBF sometimes tags as "face-cleansers" or "soaps"
  [/\b(intime|intima|intimo|intimate|intimare|intima\w*)\b/i, "Hygiène intime"],
  // Eyeliner / eye pencil OBF sometimes tags as "eye-creams"
  [/\b(eyeliner|eye.?liner|liner.yeux|stylo.yeux|kajal|khol|kohl)\b/i, "Eyeliner & crayon yeux"],
  // Hair oils OBF sometimes tags as "body-oils"
  [/\b(oil.treatment|huile.capillaire|soin.cheveux|soin.capillaire|hair.oil|hair.treatment)\b/i, "Soin capillaire"],
  // Baby-line products that are actually makeup/face care (e.g. Bourjois Bébé)
  // If name contains a shade number or makeup cue alongside "bebe/baby" → skip to next rules
  // (Too hard to auto-fix — left for GPT pass)
];

/**
 * Name-based rules for products without a useful OBF category.
 * Each rule is [regex, subcategory]. Applied in order; first match wins.
 * Patterns are tested on `${brand} ${name}` lowercased & NFD-normalized.
 */
export const NAME_RULES: Array<[RegExp, Subcategory]> = [
  // --- Coloration capillaire (very specific signals, high priority) ---
  // Shade number patterns like "5/66", "7-0", "55/46" → almost always hair dye
  [/\b\d+[/\\-]\d+\b/, "Coloration capillaire"],
  [/\b(coloration|colorant|teinture|decolorant|decoloration|meches|koleston|inoa|casting|garnier.color|loreal.color|henne|henné)\b/i, "Coloration capillaire"],

  // --- Coiffure ---
  [/\b(shampoo?ing|shampoo|antipellicul|pellicul|pelliculaire|bain.volumisant|bain.capillaire)\b/i, "Shampooing"],
  [/\b(apres.?shampoo?ing|after.?shamp|conditionn|rinçage|rincage|demelant|districant|balsamo|revitalisant|revitalizing)\b/i, "Après-shampooing & masque capillaire"],
  [/\b(masque.capillaire|masque.cheveux|hair.mask|masque.keratine)\b/i, "Après-shampooing & masque capillaire"],
  [/\b(mousse.fixante|pate.modelante|pate.coiffante|cire.coiffante|gel.coiffant|mousse.coiffante|laque|fixatif|spray.fixant|wax.coiff|spuma|hairstyling|hairspray|hair.?spray|tecni.?art)\b/i, "Coiffant"],
  [/\b(serum.capillaire|huile.capillaire|soin.capillaire|traitement.capillaire|soin.cheveux|soin.chevelure|detergente.capell|fibre.capillaire|keratin|keratine|vinaigre.cheveux|soin.vinaigre)\b/i, "Soin capillaire"],
  [/\b(cheveux|capillaire|chevelure|cuir.chevelu)\b/i, "Soin capillaire"],

  // --- Maquillage ---
  [/\b(fond.de.teint|bb.?crem|cc.?crem|cushion.teint|base.de.teint)\b/i, "Fond de teint & BB cream"],
  [/\b(anticerne|anti-cerne|correcteur|concealer|anti.taches)\b/i, "Anticerne & correcteur"],
  [/\b(blush|fard.a.joues|rouge.joues|blusher)\b/i, "Blush, bronzer & illuminateur"],
  [/\b(bronzer|terre.de.soleil|poudre.bonne.mine|poudre.eclat|terracotta)\b/i, "Blush, bronzer & illuminateur"],
  [/\b(highlighter|illuminat|enlumineur)\b/i, "Blush, bronzer & illuminateur"],
  [/\b(mascara|volume.cils|allonge.cils|lashes)\b/i, "Mascara"],
  [/\b(fard.a.paupieres|ombre.a.paupieres|eyeshadow|palette.yeux)\b/i, "Fard à paupières"],
  [/\b(eyeliner|eye.liner|kajal|crayon.yeux|sourcil|sourcils|eyebrow|brow)\b/i, "Eyeliner & crayon yeux"],
  [/\b(rouge.a.levres|lipstick|lip.gloss|gloss.levres)\b/i, "Rouge à lèvres & gloss"],
  [/\b(baume.a.levres|lip.balm|chapstick|lippenpflege)\b/i, "Baume à lèvres"],
  [/\b(crayon.levres|contour.levres|lipliner|lip.liner)\b/i, "Crayon lèvres"],
  [/\b(primer|base.maquillage|fixateur.maquillage|setting.spray)\b/i, "Primer & fixateur"],
  [/\b(poudre.libre|poudre.compacte|poudre.fixante|loose.powder|baking)\b/i, "Poudre de finition"],
  [/\b(vernis.a.ongles|nail.?polish|nailpolish|semi.permanent|uv.gel.nail|geliq|gel.nail)\b/i, "Vernis à ongles"],
  [/\b(soin.ongles|huile.ongles|cuticules|nail.care|dissolvant|nail.remover)\b/i, "Soin des ongles"],

  // --- Soin du visage ---
  [/\b(serum.visage|serum.anti|serum.eclat|serum.hydrat|serum.vit|vitamin.c.serum|face.serum)\b/i, "Sérum visage"],
  [/\b(contour.yeux|contour.des.yeux|eye.cream|soin.yeux|yeux.contour|roll.on.yeux)\b/i, "Contour des yeux"],
  [/\b(eau.micellaire|micellaire|demaquillant|demaquillante|lotion.demaquillante|makeup.remover|make.up.remover)\b/i, "Démaquillant"],
  [/\b(nettoyant.visage|gel.nettoyant|mousse.nettoyante|gelee.nettoyante|savon.visage|nettoyant.doux|foaming.cleanser|cleansing.foam|foam.cleanser)\b/i, "Nettoyant visage"],
  [/\b(lotion.tonique|tonique.visage|toner|tonic|skin.tonic|clarity.tonic|boosting.essence|essence.visage|skin.essence)\b/i, "Tonique & eau micellaire"],
  [/\b(masque.visage|masque.soin|masque.argile|sheet.mask|sleeping.pack|sleeping.mask|night.pack)\b/i, "Masque visage"],
  [/\b(gommage.visage|exfoliant.visage|peeling.visage|peeling.doux|acid.exfoliant)\b/i, "Exfoliant visage"],
  [/\b(anti.rides|anti.age|antirides|lifting|lift.nuit|lift.jour|soin.jour.anti|soin.nuit.anti|soin.anti.age|regenerant|regenerante|points.noirs|blackhead)\b/i, "Soin anti-âge visage"],
  [/\b(creme.visage|soin.visage|hydratant.visage|gel.visage|fluide.visage|creme.jour|creme.nuit|soin.jour|soin.nuit)\b/i, "Crème & soin hydratant visage"],

  // --- Protection solaire ---
  [/\b(spf|fps|ecran.solaire|creme.solaire|protection.solaire|sun.protect|sunscreen|solaire)\b/i, "Protection solaire"],
  [/\b(autobronzant|auto.bronzant|self.tanning|self.tanner|bronzage.intensif)\b/i, "Autobronzant"],
  [/\b(apres.soleil|after.sun|soin.apres.bronzage)\b/i, "Après-soleil"],

  // --- Soin du corps ---
  [/\b(lait.corps|creme.corps|lotion.corps|soin.corps|gel.corps|body.lotion|body.milk|body.cream)\b/i, "Lait & crème corps"],
  [/\b(huile.corps|huile.seche|huile.de.massage|body.oil)\b/i, "Huile corps"],
  [/\b(gommage|exfoliant|scrub)\b/i, "Gommage corps"],
  [/\b(creme.mains|soin.mains|lotion.mains|hand.cream|hand.lotion)\b/i, "Crème mains"],
  [/\b(creme.pieds|soin.pieds|baume.pieds|lotion.pieds|foot.cream|foot.lotion)\b/i, "Soin pieds"],
  [/\b(baume.corps|beurre.corps|beurre.karite|beurre.cacao|body.butter|body.balm)\b/i, "Baume corps"],
  [/\b(minceur|amincissant|anti.cellulite|raffermis|slimming)\b/i, "Soin amincissant"],

  // --- Hygiène du corps ---
  [/\b(gel.douche|savon.douche|douche.creme|creme.lavante|pain.lavant|surgras|shower.gel|shower.cream|gel.doccia|bagnoschiuma)\b/i, "Gel douche & savon"],
  [/\b(deodorant|anti.transpirant|antitranspirant|desodorante)\b/i, "Déodorant & anti-transpirant"],
  [/\b(hygiène.intime|soin.intime|nettoyant.intime|gel.intime|detergente.intim)\b/i, "Hygiène intime"],
  [/\b(gel.hydro.alcoolique|gel.antibacterien|desinfectant.mains|hand.sanitizer)\b/i, "Gel hydroalcoolique"],
  [/\b(lingette|wipe)\b/i, "Lingette"],

  // --- Hygiène dentaire ---
  [/\b(dentifrice|pasta.dentes|zahnpasta|toothpaste)\b/i, "Dentifrice"],
  [/\b(bain.de.bouche|rince.bouche|mouthwash)\b/i, "Bain de bouche"],

  // --- Soin bébé (listed after makeup/face rules to avoid Bourjois-type misclass) ---
  [/\b(nourrisson|maternite|nappy|couche)\b/i, "Soin bébé"],

  // --- Rasage & épilation ---
  [/\b(gel.rasage|mousse.rasage|after.shave|apres.rasage|shaving)\b/i, "Rasage"],
  [/\b(epilation|cire.epilatoire|depilatoire|apres.epilation)\b/i, "Épilation"],

  // --- Parfum ---
  [/\b(eau.de.parfum|eau.de.toilette|eau.de.cologne|parfum|brume|body.mist)\b/i, "Eau de parfum & cologne"],

  // --- Bien-être ---
  [/\bhuiles? essentielles?\b/i, "Huile essentielle"],
  [/\b(elixir.aux.huiles|elixir.huile|nectar.huile)\b/i, "Huile essentielle"],
];

/**
 * INCI-based heuristics for last-resort classification.
 * Tests the first 200 chars of ingredients_text (lowercased).
 */
export const INCI_RULES: Array<[RegExp, Subcategory]> = [
  // Shampoos often start with sodium lauryl/laureth sulfate or ammonium lauryl
  [/\b(sodium lauryl sulfate|sodium laureth sulfate|ammonium lauryl sulfate|ammonium laureth sulfate|cocamidopropyl betaine)\b/i, "Shampooing"],
  // Toothpastes: hydrated silica, sorbitol, sodium fluoride
  [/\b(hydrated silica|sodium fluoride|sodium monofluorophosphate)\b/i, "Dentifrice"],
  // Sunscreens: UV filters
  [/\b(octocrylene|avobenzone|titanium dioxide|zinc oxide|ethylhexyl methoxycinnamate|tinosorb)\b/i, "Protection solaire"],
  // Deodorant: aluminium salts
  [/\b(aluminium chlorohydrate|aluminium zirconium|potassium alum)\b/i, "Déodorant & anti-transpirant"],
];
