// Libere le verrou de Chrome partage par les robots de Cosme Check (6 h),
// RevealChat (7 h) et MemoryPilot (8 h).
//
//   npm run seo:liberer
//
// Derniere etape de la journee (docs/seo/ROBOT.md). La fenetre du robot reste
// ouverte apres son travail, donc robot.ps1 ne peut pas savoir seul quand
// Chrome est libre : c'est le robot qui le dit. S'il meurt avant, le verrou est
// tenu pour abandonne au bout de 150 minutes par les autres robots.
import fs from 'node:fs';

const VERROU = 'C:/Projet/.robot-chrome.lock';
const MOI = 'cosmecheck';

if (!fs.existsSync(VERROU)) {
  console.log('aucun verrou : Chrome est deja libre');
} else {
  const tenu = fs.readFileSync(VERROU, 'utf8').trim();
  if (tenu === MOI) {
    fs.unlinkSync(VERROU);
    console.log('verrou libere : Chrome est libre pour les autres robots');
  } else {
    console.log(`verrou tenu par « ${tenu} », pas par ${MOI} : je n'y touche pas`);
  }
}
