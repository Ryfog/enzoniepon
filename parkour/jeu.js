/* =========================================================
   LE GRAND OUVRAGE — moteur de jeu coopératif
   Chaque machine simule SON personnage et diffuse sa position.
   L'hôte fait autorité sur les bestioles, les plateformes mobiles
   et le passage au niveau suivant.
   ========================================================= */
const $ = s => document.querySelector(s);
const PREFIXE = 'pk-es-';
const PW = 26, PH = 34;

/* physique */
const G = 0.86, VMAX = 4.7, ACC = 0.85, FROT = 0.78;
const SAUT = -14.6, CHUTE = 19, REBOND = -21.5, RESSORT = -22.5;
const TAPIS = 1.5;

/* ============ ÉTAT GLOBAL ============ */
let peer = null, conn = null, hote = false, solo = false, moi = 0, autre = 1;
let codeSalon = '', boucleRetour = null, essais = 0, garde = null;
let noms = ['—', '—'];

let carte = [], larg = 0, fondFixe = null;
let mobiles = [], plaques = [], boutons = [], coeurs = [], bestioles = [];
let planches = [], reprises = [], arriveePos = null;
let porteOuverte = false, niv = 0, enJeu = false, fini = false;
let ramasses = 0, totalBoutons = 0, chutes = 0, debutTemps = 0;
const depart = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
const repris = [null, null];

const J = [
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0, basAv: 0 },
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0, basAv: 0 }
];

const cam = { x: 0, y: 0, s: 1 };

/* progression sauvegardée */
const CLE = 'ouvrage_progres';
let progres = {};
try { progres = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { progres = {}; }
const sauve = () => { try { localStorage.setItem(CLE, JSON.stringify(progres)); } catch (e) {} };

/* ============ RÉSEAU ============ */
const envoie = m => { if (conn && conn.open) conn.send(m); };

function brancher(c) {
  if (conn && conn !== c) { conn.remplacee = true; try { conn.close(); } catch (e) {} }
  conn = c;
  c.on('data', recois);
  c.on('close', () => { if (c.remplacee) return; toast('Connexion perdue — reconnexion…'); relance(); });
  c.on('error', () => { if (!c.remplacee) relance(); });
}

function recois(m) {
  if (m.t === 'P') {
    const p = J[autre];
    p.x = m.x; p.y = m.y; p.vx = m.vx; p.vy = m.vy; p.d = m.d;
    p.sol = m.s; p.mort = m.mo;
    if (!hote) {
      if (m.mp) mobiles.forEach((o, i) => { if (m.mp[i] !== undefined) o.x = m.mp[i]; });
      if (m.be) bestioles.forEach((e, i) => {
        if (!m.be[i]) return;
        e.x = m.be[i][0]; e.dir = m.be[i][1]; e.vif = !!m.be[i][2];
      });
      if (m.po !== undefined) porteOuverte = m.po;
    }
  }
  else if (m.t === 'HELLO') {
    noms[autre] = m.nom || 'L\'autre';
    envoie({ t: 'WELCOME', nom: noms[moi] });
    if (!enJeu) { ecran('s-wait'); majAttente(); }
    else envoie({ t: 'NIV', n: niv });
  }
  else if (m.t === 'WELCOME') {
    noms[autre] = m.nom || 'L\'autre';
    if (!enJeu) { ecran('s-wait'); majAttente(); }
  }
  else if (m.t === 'NIV') chargeNiveau(m.n);
  else if (m.t === 'NEXT' && hote) {
    const n = niv + 1 >= MONDES.length ? 0 : niv + 1;
    chargeNiveau(n); envoie({ t: 'NIV', n });
  }
  else if (m.t === 'PICK') {
    const tab = m.k === 'b' ? boutons : coeurs;
    if (tab[m.i] && !tab[m.i].pris) { tab[m.i].pris = true; if (m.k === 'b') ramasses++; majHud(); }
  }
  else if (m.t === 'STOMP') { if (bestioles[m.i]) bestioles[m.i].vif = false; }
  else if (m.t === 'WIN') gagne();
  else if (m.t === 'KA') { /* battement */ }
}

function relance() {
  if (hote || solo || !codeSalon || boucleRetour) return;
  essais = 0;
  boucleRetour = setInterval(() => {
    if (conn && conn.open) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnecté 💚'); return; }
    if (++essais > 25) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnexion impossible. Recharge la page.'); return; }
    try {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      const c = peer.connect(PREFIXE + codeSalon, { reliable: true });
      brancher(c);
      c.on('open', () => envoie({ t: 'HELLO', nom: noms[moi] }));
    } catch (e) {}
  }, 2500);
}
function surveille() {
  clearInterval(garde);
  garde = setInterval(() => { if (conn && conn.open) envoie({ t: 'KA' }); else relance(); }, 10000);
}

/* ============ MENU ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
const monNom = () => $('#pseudo').value.trim() || 'Joueur';
const erreur = t => { $('#err').textContent = t; };
const ecran = id => document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));

$('#b-joinmode').addEventListener('click', () => {
  $('#joinbox').hidden = !$('#joinbox').hidden;
  if (!$('#joinbox').hidden) $('#code').focus();
});
$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });

$('#b-create').addEventListener('click', () => {
  const code = codeAlea();
  hote = true; solo = false; moi = 0; autre = 1; codeSalon = code;
  noms[0] = monNom();
  erreur('Ouverture…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => { erreur(''); $('#code-big').textContent = code; ecran('s-wait'); majAttente(); });
  peer.on('connection', c => {
    brancher(c);
    c.on('open', () => { surveille(); if (enJeu) envoie({ t: 'NIV', n: niv }); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-create').click(); }
    else erreur('Impossible d\'ouvrir la partie.');
  });
});

$('#b-join').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres.'); return; }
  hote = false; solo = false; moi = 1; autre = 0; codeSalon = code;
  noms[1] = monNom();
  erreur('Connexion…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); surveille(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Partie introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Partie introuvable. Vérifie le code.'));
});

$('#b-solo').addEventListener('click', () => {
  solo = true; hote = true; moi = 0; autre = 1;
  noms = [monNom(), 'Perso 2'];
  chargeNiveau(0);
});
$('#b-copy').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-big').textContent.trim()).then(() => toast('Code copié')).catch(() => {});
});

function majAttente() {
  $('#nm1').textContent = noms[0];
  $('#nm2').textContent = noms[1];
  const pret = noms[0] !== '—' && noms[1] !== '—';
  $('#wait-txt').textContent = pret ? 'Vous êtes deux. Prêts ?' : 'En attente de l\'autre joueur…';
  $('#b-go').hidden = !(pret && hote);
}
$('#b-go').addEventListener('click', () => { if (hote) { chargeNiveau(0); envoie({ t: 'NIV', n: 0 }); } });

/* ============ CHARGEMENT D'UN NIVEAU ============ */
function chargeNiveau(n) {
  if (n >= MONDES.length) n = 0;
  niv = n; fini = false; porteOuverte = false;
  const M = MONDES[n];
  larg = M.larg;

  carte = M.map.map(r => r.padEnd(larg, ' ').slice(0, larg).split(''));
  while (carte.length < HAUT) carte.push(Array(larg).fill(' '));

  mobiles = []; plaques = []; boutons = []; coeurs = [];
  bestioles = []; planches = []; reprises = []; arriveePos = null;
  ramasses = 0; chutes = 0; repris[0] = repris[1] = null;

  for (let y = 0; y < HAUT; y++) {
    for (let x = 0; x < larg; x++) {
      const c = carte[y][x];
      if (c === '1') { depart[0] = { x: x * T + 7, y: y * T + 6 }; carte[y][x] = ' '; }
      else if (c === '2') { depart[1] = { x: x * T + 7, y: y * T + 6 }; carte[y][x] = ' '; }
      else if (c === '*') { boutons.push({ x: x * T + T / 2, y: y * T + T / 2, pris: false, ph: Math.random() * 6 }); carte[y][x] = ' '; }
      else if (c === 'o') { coeurs.push({ x: x * T + T / 2, y: y * T + T / 2, pris: false, ph: Math.random() * 6 }); carte[y][x] = ' '; }
      else if (c === 'F') { arriveePos = { x: x * T, y: y * T }; carte[y][x] = ' '; }
      else if (c === 'K') { reprises.push({ x: x * T, y: y * T, on: false }); carte[y][x] = ' '; }
      else if (c === 'E') {
        bestioles.push({ x: x * T + 3, y: y * T + 8, x0: x * T, dir: 1, vif: true, ph: Math.random() * 6, portee: 3 * T });
        carte[y][x] = ' ';
      }
      else if (c === 'b') plaques.push({ x: x * T, y: y * T });
      else if (c === 'x') planches.push({ x: x * T, y: y * T, usure: 0, tombee: 0 });
      else if (c === 'M') {
        const der = mobiles[mobiles.length - 1];
        if (der && der.y === y * T && der.x0 + der.w === x * T) der.w += T;
        else mobiles.push({ x0: x * T, x: x * T, y: y * T, w: T, h: 22, amp: 3.5 * T, ph: mobiles.length * 1.6 });
        carte[y][x] = ' ';
      }
    }
  }
  totalBoutons = boutons.length;

  J.forEach((p, i) => {
    p.x = depart[i].x; p.y = depart[i].y;
    p.vx = 0; p.vy = 0; p.mort = 0; p.sol = false; p.basAv = p.y + PH;
  });

  fondFixe = preDessine(carte, larg, solo ? -1 : moi);
  cam.x = depart[0].x; cam.y = depart[0].y; cam.s = 1;
  debutTemps = performance.now();
  parts = [];

  enJeu = true;
  ecran('s-jeu');
  $('#h-niv').textContent = `NIVEAU ${n + 1} / ${MONDES.length}`;
  $('#h-titre').textContent = M.nom;
  $('#fin').hidden = true;
  const a = $('#aide');
  a.textContent = M.aide; a.classList.remove('off');
  setTimeout(() => a.classList.add('off'), 7000);
  majHud();
  if (!boucle) boucle = requestAnimationFrame(tour);
}

const majHud = () => { $('#h-boutons').textContent = `● ${ramasses} / ${totalBoutons}`; };

/* ============ COLLISIONS ============ */
function estSolide(tx, ty, idx) {
  if (tx < 0 || tx >= larg) return true;
  if (ty < 0 || ty >= HAUT) return false;
  const c = carte[ty][tx];
  if (c === '#' || c === 'b' || c === 'B' || c === '>' || c === '<') return true;
  if (c === 'D') return !porteOuverte;
  if (c === 'C') return idx === 0;
  if (c === 'P') return idx === 1;
  return false;
}
function tuile(wx, wy) {
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  if (tx < 0 || tx >= larg || ty < 0 || ty >= HAUT) return ' ';
  return carte[ty][tx];
}
function heurte(idx, nx, ny) {
  const x0 = Math.floor(nx / T), x1 = Math.floor((nx + PW - 1) / T);
  const y0 = Math.floor(ny / T), y1 = Math.floor((ny + PH - 1) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (estSolide(tx, ty, idx)) return true;
  return false;
}
/* plateformes traversables : solides seulement quand on retombe dessus */
function poseUneWay(p, ny) {
  const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + PW - 1) / T);
  const bas = ny + PH;
  const ty = Math.floor(bas / T);
  if (ty < 0 || ty >= HAUT) return null;
  for (let tx = x0; tx <= x1; tx++) {
    if (tx < 0 || tx >= larg) continue;
    if (carte[ty][tx] !== '_') continue;
    const haut = ty * T + 6;
    if (p.basAv <= haut + 2 && bas >= haut) return haut;
  }
  return null;
}

/* ============ SIMULATION ============ */
let actif = 0;
const touches = {};

function meurt(p) { if (p.mort === 0) { p.mort = 45; chutes++; } }

function reapparait(p, idx) {
  const r = repris[idx];
  p.x = r ? r.x : depart[idx].x;
  p.y = r ? r.y : depart[idx].y;
  p.vx = p.vy = 0; p.basAv = p.y + PH;
}

function simule(p, idx, cmd) {
  if (p.mort > 0) {
    p.mort--;
    if (p.mort === 0) reapparait(p, idx);
    return;
  }
  const basAvant = p.y + PH;

  /* horizontal */
  if (cmd.g) { p.vx -= ACC; p.d = -1; }
  if (cmd.d) { p.vx += ACC; p.d = 1; }
  if (!cmd.g && !cmd.d) p.vx *= FROT;
  p.vx = Math.max(-VMAX, Math.min(VMAX, p.vx));
  if (Math.abs(p.vx) < .05) p.vx = 0;

  let dx = p.vx;
  if (p.sol) {
    const sous = tuile(p.x + PW / 2, p.y + PH + 2);
    if (sous === '>') dx += TAPIS;
    if (sous === '<') dx -= TAPIS;
  }

  const nx = p.x + dx;
  if (heurte(idx, nx, p.y)) {
    const pas = Math.sign(dx) || 1;
    while (!heurte(idx, p.x + pas, p.y) && Math.abs(p.x - nx) > .5) p.x += pas;
    p.vx = 0;
  } else p.x = nx;
  p.x = Math.max(0, Math.min(larg * T - PW, p.x));

  /* vertical */
  p.vy = Math.min(CHUTE, p.vy + G);
  if (cmd.saut) p.tampon = 7; else if (p.tampon > 0) p.tampon--;
  if (p.sol) p.coyote = 7; else if (p.coyote > 0) p.coyote--;
  if (p.tampon > 0 && p.coyote > 0) { p.vy = SAUT; p.tampon = 0; p.coyote = 0; p.sol = false; }
  if (!cmd.saut && p.vy < -5) p.vy *= .86;

  p.sol = false;
  const ny = p.y + p.vy;

  if (heurte(idx, p.x, ny)) {
    const pas = Math.sign(p.vy) || 1;
    while (!heurte(idx, p.x, p.y + pas) && Math.abs(p.y - ny) > .5) p.y += pas;
    if (p.vy > 0) {
      p.sol = true;
      const sous = tuile(p.x + PW / 2, p.y + PH + 2);
      if (sous === 'B') { p.vy = RESSORT; p.sol = false; poussiere(p.x + PW / 2, p.y + PH, 10); }
      else { if (p.vy > 10) poussiere(p.x + PW / 2, p.y + PH, 6); p.vy = 0; }
    } else p.vy = 0;
  } else {
    const h = p.vy > 0 ? poseUneWay(p, ny) : null;
    if (h !== null) { p.y = h - PH; p.vy = 0; p.sol = true; }
    else p.y = ny;
  }

  /* planches qui s'effondrent */
  planches.forEach(pl => {
    if (pl.tombee > 0) return;
    const dessus = p.x + PW > pl.x + 2 && p.x < pl.x + T - 2 &&
      p.y + PH >= pl.y + 4 && p.y + PH <= pl.y + 24 && p.vy >= 0;
    if (dessus) {
      p.y = pl.y + 6 - PH; p.vy = 0; p.sol = true;
      pl.usure = Math.min(1, pl.usure + .022);
      if (pl.usure >= 1) { pl.tombee = 150; poussiere(pl.x + T / 2, pl.y + 14, 8); }
    }
  });

  /* plateformes mobiles */
  mobiles.forEach(o => {
    const dessus = p.x + PW > o.x && p.x < o.x + o.w &&
      p.y + PH >= o.y + 2 && p.y + PH <= o.y + 26 && p.vy >= 0;
    if (dessus) { p.y = o.y + 4 - PH; p.vy = 0; p.sol = true; p.x += o.dx || 0; }
  });

  /* la tête de l'autre sert de marchepied */
  const q = J[1 - idx];
  if (q.mort === 0) {
    const dessus = p.x + PW > q.x + 3 && p.x < q.x + PW - 3 &&
      p.y + PH >= q.y && p.y + PH <= q.y + 16 && p.vy >= 0;
    if (dessus) { p.y = q.y - PH; p.vy = 0; p.sol = true; }
  }

  /* bestioles */
  bestioles.forEach((e, i) => {
    if (!e.vif) return;
    const touche = p.x + PW > e.x + 2 && p.x < e.x + 32 &&
      p.y + PH > e.y + 6 && p.y < e.y + 32;
    if (!touche) return;
    if (p.vy > 1 && basAvant <= e.y + 16) {
      e.vif = false; p.vy = REBOND; p.sol = false;
      etincelles(e.x + 17, e.y + 16, '#e8807a', 12);
      if (!solo) envoie({ t: 'STOMP', i });
    } else meurt(p);
  });

  /* épingles et chute hors du monde */
  if (p.y > HAUT * T + 80) meurt(p);
  if (tuile(p.x + PW / 2, p.y + PH - 4) === '^' || tuile(p.x + PW / 2, p.y + 6) === '^') meurt(p);

  /* points de reprise */
  reprises.forEach(k => {
    if (p.x + PW > k.x && p.x < k.x + T && p.y + PH > k.y && p.y < k.y + T + 12) {
      if (!k.on) { k.on = true; etincelles(k.x + T / 2, k.y + 10, '#6fd46f', 14); toast('Point de reprise'); }
      repris[idx] = { x: k.x + 4, y: k.y + 4 };
    }
  });

  /* ramassages */
  boutons.forEach((o, i) => {
    if (o.pris) return;
    if (Math.abs(p.x + PW / 2 - o.x) < 24 && Math.abs(p.y + PH / 2 - o.y) < 24) {
      o.pris = true; ramasses++; majHud();
      etincelles(o.x, o.y, '#ffd35c', 12);
      if (!solo) envoie({ t: 'PICK', k: 'b', i });
    }
  });
  coeurs.forEach((o, i) => {
    if (o.pris) return;
    if (Math.abs(p.x + PW / 2 - o.x) < 26 && Math.abs(p.y + PH / 2 - o.y) < 26) {
      o.pris = true;
      etincelles(o.x, o.y, '#ff6fa8', 18);
      if (!solo) envoie({ t: 'PICK', k: 'o', i });
    }
  });

  /* position du bas au DÉBUT du pas suivant : c'est cette valeur que
     poseUneWay() compare pour savoir si on arrive par au-dessus */
  p.basAv = p.y + PH;
}

function commandes(idx) {
  if (solo ? idx !== actif : idx !== moi) return { g: false, d: false, saut: false };
  return {
    g: !!(touches['q'] || touches['a'] || touches['arrowleft']),
    d: !!(touches['d'] || touches['arrowright']),
    saut: !!(touches['z'] || touches['w'] || touches['arrowup'] || touches[' '])
  };
}

/* ============ PARTICULES ============ */
let parts = [];
function poussiere(x, y, n) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2,
    r: 2 + Math.random() * 3, c: 'rgba(220,205,180,.7)', v: 1
  });
}
function etincelles(x, y, col, n) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 5 - 1,
    r: 2 + Math.random() * 3, c: col, v: 1
  });
}
function majParts() {
  parts = parts.filter(p => p.v > 0);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .18; p.v -= .022; });
}

/* ============ BOUCLE ============
   Pas de temps FIXE avec accumulateur. La simulation avance toujours
   par pas de 1/60 s, quelle que soit la fréquence de l'écran : le
   ressenti reste identique à 60 Hz et le jeu ne tourne plus 2,4× trop
   vite sur un écran 144 Hz. Le dessin, lui, suit l'écran.            */
const PAS = 1000 / 60;      // durée d'un pas de simulation, en ms
const RETARD_MAX = 250;     // au-delà (onglet inactif) on abandonne le retard
const PAS_MAX = 5;          // pas de simulation rattrapés au maximum par image

let boucle = null, dernierEnvoi = 0, tempsMobile = 0, temps = 0;
let dernierTs = 0, cumul = 0;

function tour(ts) {
  boucle = requestAnimationFrame(tour);
  if (!enJeu) return;
  temps = ts / 1000;

  if (!dernierTs) dernierTs = ts;
  let ecoule = ts - dernierTs;
  dernierTs = ts;
  if (ecoule > RETARD_MAX) ecoule = PAS;   // retour d'onglet : on repart net
  cumul += ecoule;

  let n = 0;
  while (cumul >= PAS && n < PAS_MAX) { simuleUnPas(ts); cumul -= PAS; n++; }
  if (n === PAS_MAX) cumul = 0;

  majCamera();
  dessine();

  $('#etat').textContent = solo
    ? `Tu diriges ${noms[actif]} — Tab pour changer de personnage`
    : `Tu es ${noms[moi]}`;
}

/* un pas de simulation = exactement ce que faisait l'ancienne image */
function simuleUnPas(ts) {
  if (hote) {
    tempsMobile += 1 / 60;
    mobiles.forEach(o => {
      const av = o.x;
      o.x = o.x0 + Math.sin(tempsMobile * .7 + o.ph) * o.amp;
      o.dx = o.x - av;
    });
    bestioles.forEach(e => {
      if (!e.vif) return;
      e.x += e.dir * 1.15;
      const devant = e.x + (e.dir > 0 ? 34 : 0);
      const tx = Math.floor(devant / T), ty = Math.floor((e.y + 40) / T);
      const tuileSous = (carte[ty] || [])[tx];
      const porte = estSolide(tx, ty, -1) || tuileSous === '_';
      const mur = estSolide(Math.floor((devant + e.dir * 3) / T), Math.floor((e.y + 20) / T), -1);
      if (!porte || mur || Math.abs(e.x - e.x0) > e.portee) { e.dir *= -1; e.x += e.dir * 3; }
    });
  }

  planches.forEach(pl => { if (pl.tombee > 0) { pl.tombee--; if (pl.tombee === 0) pl.usure = 0; } });

  if (plaques.length && !porteOuverte) {
    porteOuverte = plaques.every(pl =>
      J.some(p => p.mort === 0 &&
        p.x + PW > pl.x + 4 && p.x < pl.x + T - 4 &&
        Math.abs(p.y + PH - pl.y) < 16));
    if (porteOuverte) toast('La porte s\'ouvre !');
  }

  if (solo) { simule(J[0], 0, commandes(0)); simule(J[1], 1, commandes(1)); }
  else simule(J[moi], moi, commandes(moi));

  majParts();

  if (!solo && ts - dernierEnvoi > 50) {
    dernierEnvoi = ts;
    const p = J[moi];
    const m = { t: 'P', x: p.x, y: p.y, vx: p.vx, vy: p.vy, d: p.d, s: p.sol, mo: p.mort };
    if (hote) {
      m.mp = mobiles.map(o => Math.round(o.x));
      m.be = bestioles.map(e => [Math.round(e.x), e.dir, e.vif ? 1 : 0]);
      m.po = porteOuverte;
    }
    envoie(m);
  }

  if (arriveePos && !fini) {
    const sur = p => p.mort === 0 &&
      p.x + PW > arriveePos.x - 10 && p.x < arriveePos.x + T + 10 &&
      p.y + PH > arriveePos.y - 10 && p.y < arriveePos.y + T + 24;
    if (sur(J[0]) && sur(J[1]) && (hote || solo)) { gagne(); if (!solo) envoie({ t: 'WIN' }); }
  }
}

/* ---------- caméra : suit le milieu, dézoome si vous vous éloignez ---------- */
function majCamera() {
  const a = J[0], b = J[1];
  const cx = (a.x + b.x) / 2 + PW / 2;
  const cy = (a.y + b.y) / 2 + PH / 2;
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);

  const besoin = Math.max(dx + 560, (dy + 400) * (VUE_L / VUE_H), 940);
  const viseS = Math.max(.5, Math.min(1.05, VUE_L / besoin));
  cam.s += (viseS - cam.s) * .05;

  const visL = VUE_L / cam.s, visH = VUE_H / cam.s;
  const mondeL = larg * T, mondeH = HAUT * T;
  let vx = cx, vy = cy;
  vx = mondeL > visL ? Math.max(visL / 2, Math.min(mondeL - visL / 2, vx)) : mondeL / 2;
  vy = mondeH > visH ? Math.max(visH / 2, Math.min(mondeH - visH / 2, vy)) : mondeH / 2;

  cam.x += (vx - cam.x) * .12;
  cam.y += (vy - cam.y) * .12;
}

/* ============ FIN DE NIVEAU ============ */
function gagne() {
  if (fini) return;
  fini = true;
  const secs = Math.round((performance.now() - debutTemps) / 1000);
  const cle = 'n' + niv;
  const av = progres[cle];
  progres[cle] = { t: (!av || secs < av.t) ? secs : av.t, b: Math.max(ramasses, av ? av.b : 0) };
  sauve();

  const dernier = niv + 1 >= MONDES.length;
  $('#fin').hidden = false;
  $('#fin-t').textContent = dernier ? 'TOUT EST COUSU !' : 'NIVEAU TERMINÉ';
  $('#fin-stats').innerHTML =
    `<div><small>Temps</small><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b></div>` +
    `<div><small>Boutons</small><b>${ramasses}/${totalBoutons}</b></div>` +
    `<div><small>Chutes</small><b>${chutes}</b></div>`;
  $('#fin-p').textContent = dernier
    ? `Vous avez fini les ${MONDES.length} niveaux à deux. Rien que ça.`
    : (ramasses === totalBoutons ? 'Tous les boutons ramassés. Impeccable.' : 'Il reste des boutons à trouver si vous repassez.');
  $('#b-next').textContent = dernier ? 'Recommencer depuis le début' : 'Niveau suivant →';
  etincelles(J[0].x, J[0].y, '#ffd35c', 30);
}

$('#b-next').addEventListener('click', () => {
  const n = niv + 1 >= MONDES.length ? 0 : niv + 1;
  if (solo) { chargeNiveau(n); return; }
  if (hote) { chargeNiveau(n); envoie({ t: 'NIV', n }); }
  else envoie({ t: 'NEXT' });
});

/* ============ CLAVIER ============ */
/* on ne capture jamais le clavier pendant une saisie de texte,
   sinon l'espace du prénom est avalé par le saut */
const saisieEnCours = e => {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
};

addEventListener('keydown', e => {
  if (saisieEnCours(e)) return;
  const k = e.key.toLowerCase();
  if (k === 'tab') { e.preventDefault(); if (solo) actif = 1 - actif; return; }
  if (k === 'r' && enJeu) {
    if (solo) chargeNiveau(niv);
    else if (hote) { chargeNiveau(niv); envoie({ t: 'NIV', n: niv }); }
    return;
  }
  if ([' ', 'arrowup', 'arrowleft', 'arrowright', 'arrowdown'].includes(k)) e.preventDefault();
  touches[k] = true;
});
addEventListener('keyup', e => { if (!saisieEnCours(e)) touches[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in touches) touches[k] = false; });

/* ============ DESSIN ============ */
const cv = $('#cv'), g = cv.getContext('2d');

/* écrans haute densité : on augmente la résolution réelle du canvas et
   on compense par une échelle, sinon tout le décor est flou.
   Le reste du code continue de raisonner en 1280×720. */
let densite = 1;
function ajusteDensite() {
  const d = Math.min(2, window.devicePixelRatio || 1);
  if (d === densite && cv.width === VUE_L * d) return;
  densite = d;
  cv.width = VUE_L * d;
  cv.height = VUE_H * d;
}
ajusteDensite();
addEventListener('resize', ajusteDensite);

function dessine() {
  g.setTransform(densite, 0, 0, densite, 0, 0);
  fond(g, cam.x, temps);
  arbres(g, cam.x, larg);

  g.save();
  g.translate(VUE_L / 2, VUE_H / 2);
  g.scale(cam.s, cam.s);
  g.translate(-cam.x, -cam.y);

  /* on ne recopie que la portion visible du décor pré-dessiné :
     sans ça, un canvas de 3520 px partait entier à chaque image */
  if (fondFixe) {
    const visL = VUE_L / cam.s, visH = VUE_H / cam.s;
    const sx = Math.max(0, Math.floor(cam.x - visL / 2) - T);
    const sy = Math.max(0, Math.floor(cam.y - visH / 2) - T);
    const sw = Math.min(fondFixe.width - sx, Math.ceil(visL) + T * 2);
    const sh = Math.min(fondFixe.height - sy, Math.ceil(visH) + T * 2);
    if (sw > 0 && sh > 0) g.drawImage(fondFixe, sx, sy, sw, sh, sx, sy, sw, sh);
  }

  for (let y = 0; y < HAUT; y++)
    for (let x = 0; x < larg; x++)
      if (carte[y][x] === 'D') porteRendu(g, x * T, y * T, porteOuverte, temps);

  planches.forEach(pl => { if (pl.tombee === 0) planche(g, pl.x, pl.y, pl.usure); });
  mobiles.forEach(o => mobileRendu(g, o));
  reprises.forEach(k => checkpoint(g, k, k.on, temps));
  if (arriveePos) arrivee(g, arriveePos, temps);
  boutons.forEach(o => bouton(g, o, temps));
  coeurs.forEach(o => coeurLaine(g, o, temps));
  bestioles.forEach(e => bestiole(g, e, temps));

  if (J[0].mort === 0 && J[1].mort === 0) filDeLaine(g, J[0], J[1], temps);
  J.forEach((p, i) => bonhomme(g, p, i, noms[i], temps));

  parts.forEach(p => {
    g.globalAlpha = Math.max(0, p.v);
    g.fillStyle = p.c;
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
  });
  g.globalAlpha = 1;
  g.restore();

  const v = g.createRadialGradient(VUE_L / 2, VUE_H / 2, VUE_H * .45, VUE_L / 2, VUE_H / 2, VUE_H * .95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,20,40,.35)');
  g.fillStyle = v; g.fillRect(0, 0, VUE_L, VUE_H);
}

/* ============ RACCOURCIS D'ESSAI ============ */
(function raccourcis() {
  const p = new URLSearchParams(location.search);
  if (!p.has('solo')) return;
  solo = true; hote = true; moi = 0; autre = 1;
  noms = ['Perso 1', 'Perso 2'];
  chargeNiveau(Math.max(0, Math.min(MONDES.length - 1, (+p.get('niv') || 1) - 1)));
})();

/* ============ TOAST ============ */
let tT = null;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.hidden = false;
  clearTimeout(tT);
  tT = setTimeout(() => { el.hidden = true; }, 2600);
}
