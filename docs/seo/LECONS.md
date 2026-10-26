# Leçons

Ce qui s'est vérifié **au moins deux fois**. Une hypothèse n'a rien à faire ici : elle reste dans `EXPERIENCES.md`.

## Point de départ (19/10/2026), appris ailleurs, à confirmer chez nous

Ces règles viennent de Vaultaire (Starter Story, octobre 2026 : 40 700 téléchargements en trois mois, presque tout depuis Google, un article par jour) et des robots jumeaux de RevealChat et de MemoryPilot. Elles ne sont pas encore prouvées ici ; on les applique jusqu'à preuve du contraire.

- **Partir de ce que Google montre déjà.** Une requête où le site apparaît sans être cliqué est le meilleur sujet du jour : la demande est prouvée et Google nous trouve déjà pertinents. Au 19/10/2026 : « meilleure crème hydratante visage » (231 affichages, position 68) et « analyse ingrédients cosmétiques » (position 67).
- **Un seul article par jour, mais excellent.** Google favorise un flux régulier de pages de qualité, pas les rafales.
- **Le maillage interne fait le classement.** Une nouvelle page liée depuis les pages qui ont déjà du trafic est explorée et classée en 3 à 4 jours. Chez nous, les fiches ingrédients (`/i/<slug>`) ont de la traîne sur Bing : les relier depuis les articles, et inversement.
- **Placer l'appel là où les lecteurs s'arrêtent de lire**, pas seulement en bas.
- **Mesurer le volume avant d'écrire.** Le premier article du robot RevealChat visait 10 à 100 recherches par mois : une suggestion Google prouve une demande, pas sa taille.
- **Un titre sage ne se clique pas.** Le premier passage RevealChat a perdu un point sur un titre trop prudent : écrire cinq titres et garder le plus fort.
- **Le tutoiement glisse vers un genre.** Le premier passage MemoryPilot a laissé « tu es paresseux » dans sa première phrase : relire chaque « tu es ».

## Appris ici (vérifié au moins deux fois)

- **Les phrases longues se cherchent avec une copie du découpage de `seo:verifier`, jamais à l'œil.** Le 23/10 et le 26/10, un script de vingt lignes (blocs aplatis, balisage retiré, découpe sur `.!?`) a trouvé en une seconde la phrase fautive, que la relecture n'avait pas vue (deux fois une phrase qui portait une référence d'étude entre parenthèses). Le script vit dans le bloc-notes de session ; le recréer depuis `lisibilite()` de `scripts/seo/verifier.mjs`.
