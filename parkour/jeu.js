/* =========================================================
   PARKOUR — moteur de plateforme coopératif
   Chaque machine simule SON personnage et diffuse sa position.
   L'hôte fait autorité sur les plateformes mobiles et le niveau.
   ========================================================= */
const $ = s => document.querySelector(s);
const PREFIXE = 'pk-es-';
const T = 40, LARG = 32, HAUT = 18;
const PW = 26, PH = 34;

/* physique */
const G = 0.86, VMAX = 4.7, ACC = 0.85, FROT = 0.78, SAUT = -14.6, CHUTE = 19, REBOND = -22;

/* ============ RÉSEAU ============ */
let peer = null, conn = null, hote = false, solo = false, moi = 0, autre = 1;
let codeSalon = '', boucleRetour = null, essais = 0, garde = null;
let noms = ['—', '—'];

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
    p.x = m.x; p.y = m.y; p.vx = m.vx; p.vy = m.vy; p.d = m.d; p.mort = m.mo;
    if (m.mp && !hote) mobiles.forEach((o, i) => { if (m.mp[i] !== undefined) o.x = m.mp[i]; });
    if (m.po !== undefined && !hote) porteOuverte = m.po;
  }
  else if (m.t === 'HELLO') {
    noms[autre] = m.nom || 'L\'autre';
    envoie({ t: 'WELCOME', nom: noms[moi], niv: niv });
    if (!enJeu) { ecran('s-wait'); majAttente(); }
    else envoie({ t: 'NIV', n: niv });
  }
  else if (m.t === 'WELCOME') {
    noms[autre] = m.nom || 'L\'autre';
    if (!enJeu) { ecran('s-wait'); majAttente(); }
  }
  else if (m.t === 'NIV') { chargeNiveau(m.n, true); }
  else if (m.t === 'NEXT' && hote) {
    const n = niv + 1 >= NIVEAUX.length ? 0 : niv + 1;
    chargeNiveau(n); envoie({ t: 'NIV', n });
  }
  else if (m.t === 'PICK') { if (coeurs[m.i]) { coeurs[m.i].pris = true; pris++; majHud(); } }
  else if (m.t === 'WIN') { gagne(true); }
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

/* ============ NIVEAU ============ */
let carte = [], mobiles = [], plaques = [], coeurs = [], drapeau = null;
let porteOuverte = false, niv = 0, pris = 0, enJeu = false, fini = false;
const depart = [{ x: 0, y: 0 }, { x: 0, y: 0 }];

const J = [
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0 },
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0 }
];

function chargeNiveau(n, distant) {
  if (n >= NIVEAUX.length) { finPartie(); return; }
  niv = n; fini = false; porteOuverte = false;
  const N = NIVEAUX[n];

  carte = N.map.slice(0, HAUT).map(r => r.padEnd(LARG, ' ').slice(0, LARG).split(''));
  while (carte.length < HAUT) carte.push(Array(LARG).fill(' '));

  mobiles = []; plaques = []; coeurs = []; drapeau = null; pris = 0;

  for (let y = 0; y < HAUT; y++) {
    for (let x = 0; x < LARG; x++) {
      const c = carte[y][x];
      if (c === '1') { depart[0] = { x: x * T + 7, y: y * T + 6 }; carte[y][x] = ' '; }
      if (c === '2') { depart[1] = { x: x * T + 7, y: y * T + 6 }; carte[y][x] = ' '; }
      if (c === 'o') { coeurs.push({ x: x * T + T / 2, y: y * T + T / 2, pris: false }); carte[y][x] = ' '; }
      if (c === 'F') { drapeau = { x: x * T, y: y * T }; carte[y][x] = ' '; }
      if (c === 'b') plaques.push({ x: x * T, y: y * T });
    }
  }
  /* les plateformes mobiles : on repère les suites de '=' */
  for (let y = 0; y < HAUT; y++) {
    let x = 0;
    while (x < LARG) {
      if (carte[y][x] === '=') {
        let l = 0;
        while (x + l < LARG && carte[y][x + l] === '=') { carte[y][x + l] = ' '; l++; }
        mobiles.push({ x0: x * T, x: x * T, y: y * T, w: l * T, h: T * .5, amp: 4 * T, ph: mobiles.length * 1.7 });
        x += l;
      } else x++;
    }
  }

  J.forEach((p, i) => {
    p.x = depart[i].x; p.y = depart[i].y;
    p.vx = 0; p.vy = 0; p.mort = 0; p.sol = false;
  });

  enJeu = true;
  ecran('s-jeu');
  $('#h-niv').textContent = `NIVEAU ${n + 1}`;
  $('#h-titre').textContent = N.nom;
  $('#fin').hidden = true;
  const a = $('#aide');
  a.textContent = N.aide; a.classList.remove('off');
  setTimeout(() => a.classList.add('off'), 6000);
  majHud();
  if (!boucle) boucle = requestAnimationFrame(tour);
}

const majHud = () => { $('#h-coeurs').textContent = `♥ ${pris}`; };

/* ============ COLLISIONS ============ */
function bloc(tx, ty, idx) {
  if (tx < 0 || tx >= LARG) return true;              // murs latéraux
  if (ty < 0) return false;
  if (ty >= HAUT) return false;
  const c = carte[ty][tx];
  if (c === '#' || c === 'b' || c === 'B') return true;
  if (c === 'D') return !porteOuverte;
  if (c === 'C') return idx === 0;
  if (c === 'P') return idx === 1;
  return false;
}
function tuile(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || tx >= LARG || ty < 0 || ty >= HAUT) return ' ';
  return carte[ty][tx];
}
/* teste si la boîte du joueur touche un bloc solide */
function heurte(p, idx, nx, ny) {
  const x0 = Math.floor(nx / T), x1 = Math.floor((nx + PW - 1) / T);
  const y0 = Math.floor(ny / T), y1 = Math.floor((ny + PH - 1) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (bloc(tx, ty, idx)) return true;
  return false;
}

/* ============ SIMULATION ============ */
let actif = 0;               // en solo : quel perso on dirige
const touches = {};

function simule(p, idx, cmd) {
  if (p.mort > 0) {
    p.mort--;
    if (p.mort === 0) { p.x = depart[idx].x; p.y = depart[idx].y; p.vx = p.vy = 0; }
    return;
  }

  /* déplacement horizontal */
  if (cmd.g) { p.vx -= ACC; p.d = -1; }
  if (cmd.d) { p.vx += ACC; p.d = 1; }
  if (!cmd.g && !cmd.d) p.vx *= FROT;
  p.vx = Math.max(-VMAX, Math.min(VMAX, p.vx));
  if (Math.abs(p.vx) < .05) p.vx = 0;

  let nx = p.x + p.vx;
  if (heurte(p, idx, nx, p.y)) {
    while (!heurte(p, idx, p.x + Math.sign(p.vx), p.y) && Math.abs(p.x - nx) > .5) p.x += Math.sign(p.vx);
    p.vx = 0;
  } else p.x = nx;

  /* gravité */
  p.vy = Math.min(CHUTE, p.vy + G);

  /* saut : petite tolérance après avoir quitté le sol, et mémoire d'appui */
  if (cmd.saut) p.tampon = 7; else if (p.tampon > 0) p.tampon--;
  if (p.sol) p.coyote = 7; else if (p.coyote > 0) p.coyote--;
  if (p.tampon > 0 && p.coyote > 0) { p.vy = SAUT; p.tampon = 0; p.coyote = 0; p.sol = false; }
  if (!cmd.saut && p.vy < -5) p.vy *= .86;          // saut plus court si on relâche

  p.sol = false;
  let ny = p.y + p.vy;

  if (heurte(p, idx, p.x, ny)) {
    const pas = Math.sign(p.vy);
    while (!heurte(p, idx, p.x, p.y + pas) && Math.abs(p.y - ny) > .5) p.y += pas;
    if (p.vy > 0) {
      p.sol = true;
      /* trampoline juste sous les pieds */
      const sous = tuile(p.x + PW / 2, p.y + PH + 2);
      if (sous === 'B') { p.vy = REBOND; p.sol = false; }
      else p.vy = 0;
    } else p.vy = 0;
  } else p.y = ny;

  /* plateformes mobiles : on se pose dessus */
  mobiles.forEach(o => {
    const dessus = p.x + PW > o.x && p.x < o.x + o.w &&
                   p.y + PH >= o.y && p.y + PH <= o.y + o.h + 12 && p.vy >= 0;
    if (dessus) { p.y = o.y - PH; p.vy = 0; p.sol = true; p.x += o.dx || 0; }
  });

  /* la tête de l'autre sert de marchepied */
  const q = J[1 - idx];
  if (q.mort === 0) {
    const dessus = p.x + PW > q.x + 3 && p.x < q.x + PW - 3 &&
                   p.y + PH >= q.y && p.y + PH <= q.y + 16 && p.vy >= 0;
    if (dessus) { p.y = q.y - PH; p.vy = 0; p.sol = true; }
  }

  /* sortie de l'écran par le bas, ou piques */
  if (p.y > HAUT * T + 60) p.mort = 40;
  const c1 = tuile(p.x + PW / 2, p.y + PH - 4);
  const c2 = tuile(p.x + PW / 2, p.y + 4);
  if (c1 === '^' || c2 === '^') p.mort = 40;

  /* cœurs */
  coeurs.forEach((h, i) => {
    if (h.pris) return;
    if (Math.abs(p.x + PW / 2 - h.x) < 24 && Math.abs(p.y + PH / 2 - h.y) < 24) {
      h.pris = true; pris++; majHud();
      if (!solo) envoie({ t: 'PICK', i });
    }
  });
}

function commandes(idx) {
  if (solo && idx !== actif) return { g: false, d: false, saut: false };
  if (!solo && idx !== moi) return { g: false, d: false, saut: false };
  return {
    g: !!(touches['q'] || touches['a'] || touches['arrowleft']),
    d: !!(touches['d'] || touches['arrowright']),
    saut: !!(touches['z'] || touches['w'] || touches['arrowup'] || touches[' '])
  };
}

/* ============ BOUCLE ============ */
let boucle = null, dernierEnvoi = 0, tempsMobile = 0;

function tour(ts) {
  boucle = requestAnimationFrame(tour);
  if (!enJeu) return;

  /* plateformes mobiles : l'hôte fait autorité, l'invité reçoit les positions */
  if (hote) {
    tempsMobile += 1 / 60;
    mobiles.forEach(o => {
      const av = o.x;
      o.x = o.x0 + Math.sin(tempsMobile * .8 + o.ph) * o.amp;
      o.dx = o.x - av;
    });
  }

  /* plaques de pression : les deux machines calculent pareil.
     Une fois toutes pressées en même temps, la porte reste ouverte —
     sinon elle se refermerait dès qu'on avance et le niveau serait infaisable. */
  if (plaques.length && !porteOuverte) {
    porteOuverte = plaques.every(pl =>
      J.some(p => p.mort === 0 &&
        p.x + PW > pl.x + 4 && p.x < pl.x + T - 4 &&
        Math.abs(p.y + PH - pl.y) < 14));
  }

  if (solo) { simule(J[0], 0, commandes(0)); simule(J[1], 1, commandes(1)); }
  else simule(J[moi], moi, commandes(moi));

  /* on diffuse sa position 20 fois par seconde */
  if (!solo && ts - dernierEnvoi > 50) {
    dernierEnvoi = ts;
    const p = J[moi];
    const m = { t: 'P', x: p.x, y: p.y, vx: p.vx, vy: p.vy, d: p.d, mo: p.mort };
    if (hote) { m.mp = mobiles.map(o => o.x); m.po = porteOuverte; }
    envoie(m);
  }

  /* arrivée : il faut y être à deux */
  if (drapeau && !fini) {
    const sur = p => p.mort === 0 &&
      p.x + PW > drapeau.x - 6 && p.x < drapeau.x + T + 6 &&
      p.y + PH > drapeau.y - 4 && p.y < drapeau.y + T + 10;
    if (sur(J[0]) && sur(J[1])) {
      if (hote) { gagne(); envoie({ t: 'WIN' }); }
    }
  }

  dessine();
  $('#etat').textContent = solo
    ? `Tu diriges le perso ${actif + 1} — appuie sur Tab pour changer`
    : `Tu es le perso ${moi + 1} (${noms[moi]})`;
}

function gagne() {
  if (fini) return;
  fini = true;
  $('#fin').hidden = false;
  $('#fin-t').textContent = niv + 1 >= NIVEAUX.length ? 'TERMINÉ !' : 'BRAVO !';
  $('#fin-p').textContent = niv + 1 >= NIVEAUX.length
    ? `Vous avez fini les ${NIVEAUX.length} niveaux, à deux. ${pris > 0 ? pris + ' cœur(s) ramassé(s).' : ''}`
    : `Niveau ${niv + 1} bouclé. ${pris > 0 ? pris + ' cœur(s) au passage.' : ''}`;
  $('#b-next').textContent = niv + 1 >= NIVEAUX.length ? 'Recommencer' : 'Niveau suivant →';
}
$('#b-next').addEventListener('click', () => {
  const n = niv + 1 >= NIVEAUX.length ? 0 : niv + 1;
  if (solo) { chargeNiveau(n); return; }
  if (hote) { chargeNiveau(n); envoie({ t: 'NIV', n }); }
  else envoie({ t: 'NEXT' });          // c'est l'hôte qui décide, on lui demande
});
function finPartie() { chargeNiveau(0); }

/* ============ CLAVIER ============ */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'tab') { e.preventDefault(); if (solo) actif = 1 - actif; return; }
  if (k === 'r' && enJeu) { chargeNiveau(niv); return; }
  if ([' ', 'arrowup', 'arrowleft', 'arrowright', 'arrowdown'].includes(k)) e.preventDefault();
  touches[k] = true;
});
addEventListener('keyup', e => { touches[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in touches) touches[k] = false; });

/* ============ RENDU ============ */
const cv = $('#cv'), g = cv.getContext('2d');
const COUL = ['#3fe0d0', '#ff6fa8'];

function rrect(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function dessine() {
  g.clearRect(0, 0, cv.width, cv.height);

  for (let y = 0; y < HAUT; y++) {
    for (let x = 0; x < LARG; x++) {
      const c = carte[y][x], px = x * T, py = y * T;
      if (c === '#') {
        g.fillStyle = '#1d3a4a';
        rrect(px + 1, py + 1, T - 2, T - 2, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,.06)';
        rrect(px + 1, py + 1, T - 2, 8, 5); g.fill();
      }
      else if (c === 'C' || c === 'P') {
        const col = c === 'C' ? COUL[0] : COUL[1];
        g.globalAlpha = (c === 'C' ? moi === 0 : moi === 1) || solo ? .95 : .38;
        g.fillStyle = col;
        rrect(px + 2, py + 6, T - 4, T - 14, 5); g.fill();
        g.globalAlpha = 1;
      }
      else if (c === 'B') {
        g.fillStyle = '#ffc65c';
        rrect(px + 2, py + 16, T - 4, T - 18, 8); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(px + 7, py + 22); g.lineTo(px + T / 2, py + 15); g.lineTo(px + T - 7, py + 22); g.stroke();
      }
      else if (c === 'b') {
        g.fillStyle = porteOuverte ? '#7ef0c9' : '#4a6b7c';
        rrect(px + 3, py + 22, T - 6, T - 24, 4); g.fill();
      }
      else if (c === 'D' && !porteOuverte) {
        g.fillStyle = '#8a5a2b';
        rrect(px + 6, py, T - 12, T, 3); g.fill();
        g.fillStyle = 'rgba(0,0,0,.25)';
        g.fillRect(px + 6, py + T / 2 - 1, T - 12, 2);
      }
      else if (c === '^') {
        g.fillStyle = '#ff5d7a';
        for (let i = 0; i < 2; i++) {
          g.beginPath();
          g.moveTo(px + i * 20 + 2, py + T);
          g.lineTo(px + i * 20 + 10, py + 16);
          g.lineTo(px + i * 20 + 18, py + T);
          g.closePath(); g.fill();
        }
      }
    }
  }

  mobiles.forEach(o => {
    g.fillStyle = '#5b8aa6';
    rrect(o.x, o.y, o.w, o.h, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)';
    rrect(o.x, o.y, o.w, 5, 3); g.fill();
  });

  coeurs.forEach(h => {
    if (h.pris) return;
    g.font = '26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('💗', h.x, h.y + Math.sin(Date.now() / 400) * 4);
  });

  if (drapeau) {
    g.font = '34px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🚩', drapeau.x + T / 2, drapeau.y + T / 2);
  }

  J.forEach((p, i) => {
    if (p.mort > 0) {
      g.globalAlpha = (p.mort % 8 < 4) ? .3 : .08;
    }
    g.fillStyle = COUL[i];
    g.shadowColor = COUL[i]; g.shadowBlur = 16;
    rrect(p.x, p.y, PW, PH, 8); g.fill();
    g.shadowBlur = 0;
    /* yeux */
    g.fillStyle = '#0a1620';
    const ox = p.d > 0 ? 4 : -4;
    g.beginPath(); g.arc(p.x + 9 + ox, p.y + 13, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(p.x + 18 + ox, p.y + 13, 3, 0, 7); g.fill();
    g.globalAlpha = 1;
    /* prénom */
    g.fillStyle = 'rgba(231,244,251,.75)';
    g.font = '500 12px "Space Grotesk", sans-serif';
    g.textAlign = 'center';
    g.fillText(noms[i], p.x + PW / 2, p.y - 8);
  });
}

/* ============ RACCOURCIS D'ESSAI ============
   ?solo lance directement le mode solo, ?niv=3 démarre au niveau 3 */
(function raccourcis() {
  const p = new URLSearchParams(location.search);
  if (!p.has('solo')) return;
  solo = true; hote = true; moi = 0; autre = 1;
  noms = ['Perso 1', 'Perso 2'];
  chargeNiveau(Math.max(0, Math.min(NIVEAUX.length - 1, (+p.get('niv') || 1) - 1)));
})();

/* ============ TOAST ============ */
let tT = null;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.hidden = false;
  clearTimeout(tT);
  tT = setTimeout(() => { el.hidden = true; }, 3200);
}
