// Le banc du site (`scripts/verifier.mjs`) contre le build local, en une commande.
//
//   npm run build && npm run seo:banc
//
// Porte de MemoryPilot tel quel. `npm run verifier` attend un site deja lance
// sur http://127.0.0.1:3210 et echoue sur « fetch failed » sinon. Le robot ne peut pas tenir un serveur en
// arriere-plan entre deux commandes, donc ce lanceur s'en charge : il demarre
// `next start` sur 3210, attend qu'il reponde, lance le banc, et arrete le
// serveur quoi qu'il arrive (succes, echec, interruption). Le code de sortie
// est celui du banc.
import { spawn } from 'node:child_process';

const PORT = 3210;
const BASE = `http://127.0.0.1:${PORT}`;

const serveur = spawn('npx', ['next', 'start', '-p', String(PORT)], { shell: true, stdio: 'ignore', windowsHide: true });

function arreter() {
  if (serveur.exitCode !== null) return;
  // `shell: true` lance un cmd.exe : sur Windows, seul taskkill /T arrete l'arbre entier.
  if (process.platform === 'win32') spawn('taskkill', ['/PID', String(serveur.pid), '/T', '/F'], { stdio: 'ignore' });
  else serveur.kill('SIGTERM');
}
process.on('SIGINT', () => { arreter(); process.exit(130); });

let pret = false;
for (let i = 0; i < 60 && !pret; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  // Un User-Agent de navigateur : le middleware refuse une requete qui n'en a pas.
  pret = await fetch(BASE + '/robots.txt', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.ok, () => false);
}
if (!pret) {
  console.error(`Le site ne repond pas sur ${BASE} apres 60 s. Le build a-t-il ete fait (npm run build) ?`);
  arreter();
  process.exit(1);
}

const banc = spawn(process.execPath, ['scripts/verifier.mjs'], { stdio: 'inherit', env: { ...process.env, BASE_VERIF: BASE } });
banc.on('exit', (code) => {
  arreter();
  process.exitCode = code ?? 1;
});
