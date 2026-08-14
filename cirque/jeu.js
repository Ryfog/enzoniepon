/* =========================================================
   LE PETIT CIRQUE — six numéros à deux
   ---------------------------------------------------------
   Pair-à-pair (WebRTC). L'hôte fait autorité sur les points,
   les vies et les événements ; le reste est SIMULÉ DES DEUX
   CÔTÉS à partir d'une horloge commune, pour que les deux
   écrans montrent exactement la même chose au même instant.
   ========================================================= */
'use strict';

const $  = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const melange = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const PREFIXE = 'cirque-es-';

const VW = 1000, VH = 620;          // piste virtuelle (tout est dessiné dedans)

/* le spectacle alterne : à deux, questions, à deux, duel… */
const ORDRE = ['tra', 'qui', 'fun', 'ass', 'pre', 'jon', 'can', 'qz'];
const GENRES = { duo: 'À DEUX', battle: 'DUEL', question: 'QUESTIONS' };

/* ---- tirage sans répétition d'une soirée à l'autre ---- */
const CLE_H = 'cirque_hist';
let HIST = {};
try { HIST = JSON.parse(localStorage.getItem(CLE_H) || '{}'); } catch (e) { HIST = {}; }
function tirer(cat, arr) {
  let vus = HIST[cat] || [];
  let libres = arr.map((_, i) => i).filter(i => !vus.includes(i));
  if (libres.length < 2) { vus = []; libres = arr.map((_, i) => i); }
  const i = pick(libres);
  vus.push(i); HIST[cat] = vus;
  try { localStorage.setItem(CLE_H, JSON.stringify(HIST)); } catch (e) {}
  return arr[i];
}

/* ============ ÉTAT ============ */
let peer = null, conn = null, hote = false, moi = 'h', autre = 'g', solo = false;
let st = null, rtt = 80, codeSalon = '';
let decalage = 0, meilleurAller = 1e9;   /* horloge partagée */
let boucleRetour = null, essais = 0, garde = null, pingeur = null;
let chronos = [];                        /* timeouts de l'hôte, à purger */

const tps = () => Date.now() + decalage;
const neuf = () => ({
  demarree: false, ph: 'attente', i: 0, total: ORDRE.length,
  acte: ORDRE[0], nm: { h: '', g: '' }, sc: { h: 0, g: 0 },
  d: {}, bilan: null
});

const nomActe = a => ACTES[a].nom;
const A = () => ACTES[st.acte];

/* ============ RÉSEAU ============ */
function envoie(m) { if (conn && conn.open) conn.send(m); }
function diffuse() { envoie({ t: 'S', st }); rendu(); }

function brancher(c) {
  if (conn && conn !== c) { conn.remplacee = true; try { conn.close(); } catch (e) {} }
  conn = c;
  c.on('data', recois);
  c.on('close', () => { if (!c.remplacee) { toast('Le fil s\'est coupé — on rattrape…'); relance(); } });
  c.on('error', () => { if (!c.remplacee) relance(); });
}

function recois(m) {
  switch (m.t) {
    case 'S':  st = m.st; rendu(); break;
    case 'A':  if (hote) action(autre, m.a); break;
    case 'IN': entrees[autre] = m.k ? 1 : 0; break;
    case 'EMO': emote(m.e, autre); break;
    case 'FC': if (!hote) corrigeFunambule(m); break;
    case 'KA': break;
    case 'HELLO':
      st.nm[autre] = m.nom || 'L\'autre artiste';
      envoie({ t: 'WELCOME', nom: st.nm[moi] });
      if (!st.demarree) { ecran('e-coulisses'); majCoulisses(); }
      diffuse();
      break;
    case 'WELCOME':
      st.nm[autre] = m.nom || 'L\'autre artiste';
      if (!st.demarree) { ecran('e-coulisses'); majCoulisses(); }
      break;
    case 'PING': envoie({ t: 'PONG', k: m.k, n: Date.now() }); break;
    case 'PONG': {
      const aller = (Date.now() - m.k) / 2;
      rtt = Math.min(500, aller * 2);
      /* on ne garde que l'aller-retour le plus court : c'est le moins bruité */
      if (!hote && aller < meilleurAller) { meilleurAller = aller; decalage = m.n + aller - Date.now(); }
      break;
    }
  }
}

function ping() { envoie({ t: 'PING', k: Date.now() }); }
function surveille() {
  clearInterval(garde); clearInterval(pingeur);
  garde = setInterval(() => { if (conn && conn.open) envoie({ t: 'KA' }); else relance(); }, 10000);
  let n = 0;
  pingeur = setInterval(() => { ping(); if (++n === 8) meilleurAller *= 1.25; }, 2200);
}
function relance() {
  if (hote || !codeSalon || boucleRetour) return;
  essais = 0; meilleurAller = 1e9;
  boucleRetour = setInterval(() => {
    if (conn && conn.open) { clearInterval(boucleRetour); boucleRetour = null; toast('Rebranché 🎪'); return; }
    if (++essais > 25) { clearInterval(boucleRetour); boucleRetour = null; toast('Impossible de rebrancher. Recharge la page.'); return; }
    try {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      const c = peer.connect(PREFIXE + codeSalon, { reliable: true });
      brancher(c);
      c.on('open', () => envoie({ t: 'HELLO', nom: monNom() }));
    } catch (e) {}
  }, 2500);
}

/* ============ ENTRÉE / COULISSES ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
const monNom = () => $('#nom').value.trim() || 'Artiste';
const erreur = t => { $('#err').textContent = t; };
function ecran(id) { document.querySelectorAll('.ec').forEach(s => s.classList.toggle('on', s.id === id)); }

$('#b-rejoindre').addEventListener('click', () => {
  $('#joinbox').hidden = !$('#joinbox').hidden;
  if (!$('#joinbox').hidden) $('#code').focus();
});

$('#b-ouvrir').addEventListener('click', () => {
  const code = codeAlea();
  hote = true; moi = 'h'; autre = 'g'; codeSalon = code; solo = false;
  st = neuf(); st.nm.h = monNom();
  erreur('On monte le chapiteau…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => { erreur(''); $('#code-geant').textContent = code; ecran('e-coulisses'); majCoulisses(); });
  peer.on('connection', c => {
    brancher(c);
    c.on('open', () => { ping(); surveille(); if (st.demarree) diffuse(); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-ouvrir').click(); }
    else erreur('Le chapiteau refuse de s\'ouvrir. Réessaie.');
  });
});

$('#b-entrer').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres du code.'); return; }
  hote = false; moi = 'g'; autre = 'h'; codeSalon = code; solo = false;
  st = neuf(); st.nm.g = monNom();
  erreur('On soulève la toile…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); ping(); surveille(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Chapiteau introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Chapiteau introuvable. Vérifie le code.'));
});

$('#b-seul').addEventListener('click', () => {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf();
  st.nm.h = monNom(); st.nm.g = 'Ton double';
  ecran('e-coulisses'); $('#code-geant').textContent = '····';
  $('#b-copier').hidden = true;
  majCoulisses();
});

$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
$('#b-copier').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-geant').textContent.trim())
    .then(() => toast('Code copié 📋')).catch(() => {});
});

function majCoulisses() {
  $('#nm1').textContent = st.nm.h || '—';
  $('#nm2').textContent = st.nm.g || '—';
  const pret = solo || !!(st.nm.h && st.nm.g);
  $('#attente-txt').textContent = pret
    ? (solo ? 'Répétition : tu tiens les deux rôles.' : 'La troupe est au complet. Le public s\'installe…')
    : 'On attend l\'autre artiste…';
  $('#b-lever').hidden = !(pret && hote);
}

$('#b-lever').addEventListener('click', () => { if (hote) lanceActe(0); });
$('#b-rejouer').addEventListener('click', () => {
  if (!hote) { toast('C\'est à ' + (st.nm.h || 'l\'hôte') + ' de relancer.'); return; }
  st.sc = { h: 0, g: 0 }; st.demarree = false;
  lanceActe(0);
});

/* ============ DÉROULÉ ============ */
function purge() { chronos.forEach(clearTimeout); chronos = []; }
function tard(f, ms) { const id = setTimeout(f, ms); chronos.push(id); return id; }

function lanceActe(i) {
  purge();
  st.i = i; st.acte = ORDRE[i]; st.demarree = true;
  st.ph = 'annonce'; st.bilan = null; st.d = {};
  entrees = { h: 0, g: 0 };
  ecran('e-piste'); diffuse();
  tard(() => {
    st.ph = 'jeu';
    A().init();
    diffuse();
  }, 2900);
}

function finActe(titre, sous, ptsH, ptsG) {
  purge();
  st.sc.h += ptsH; st.sc.g += ptsG;
  st.ph = 'bilan';
  st.bilan = { titre, sous, ph: ptsH, pg: ptsG };
  diffuse();
}

$('#b-suite').addEventListener('click', () => {
  if (!hote) { toast('C\'est à ' + (st.nm.h || 'l\'hôte') + ' d\'enchaîner.'); return; }
  if (st.i + 1 >= st.total) { st.ph = 'fin'; diffuse(); ecranFin(); }
  else lanceActe(st.i + 1);
});

/* à deux, le maximum tourne autour de 246 étoiles sur les huit numéros */
function ecranFin() {
  const tot = st.sc.h + st.sc.g;
  const nh = esc(st.nm.h || 'Artiste 1'), ng = esc(st.nm.g || 'Artiste 2');
  $('#fin-t').textContent = tot >= 180 ? 'Standing ovation' : tot >= 110 ? 'Le public en redemande' : 'Rideau';
  $('#fin-sc').innerHTML =
    `<div><small>${nh}</small><b>${st.sc.h}</b></div>` +
    `<div><small>Ensemble</small><b>${tot}</b></div>` +
    `<div><small>${ng}</small><b>${st.sc.g}</b></div>`;
  const ecart = Math.abs(st.sc.h - st.sc.g);
  const duel = ecart < 6
    ? 'Vous finissez au coude à coude — ' + ecart + ' étoile(s) d\'écart.'
    : (st.sc.h > st.sc.g ? nh : ng) + ' remporte la soirée de ' + ecart + ' étoiles.';
  $('#fin-p').textContent = duel + ' ' + (tot >= 180
    ? 'Huit numéros, et le chapiteau est à vous.'
    : tot >= 110
      ? 'Une belle représentation. On rallume les projecteurs quand vous voulez.'
      : 'La troupe débute. Une deuxième soirée et ce sera autre chose.');
  ecran('e-fin');
}

const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* ============ ACTIONS ============ */
function jouer(a) { if (hote) action(moi, a); else envoie({ t: 'A', a }); }
function action(qui, a) { if (hote && st.ph === 'jeu') A().action(qui, a); }

let entrees = { h: 0, g: 0 };
function maintien(k) {
  entrees[moi] = k ? 1 : 0;
  if (!solo) envoie({ t: 'IN', k: k ? 1 : 0 });
}

/* ============ TOAST ============ */
let toastId = null;
function toast(txt) {
  const el = $('#toast'); el.textContent = txt; el.hidden = false;
  clearTimeout(toastId); toastId = setTimeout(() => { el.hidden = true; }, 2600);
}

/* =========================================================
   CANVAS
   ========================================================= */
const cv = $('#cv'), cx = cv.getContext('2d');
let W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;

function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  sc = Math.min(W / VW, H / VH);
  ox = (W - VW * sc) / 2; oy = (H - VH * sc) / 2;
}
window.addEventListener('resize', taille);
taille();

const versPiste = e => {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left - ox) / sc, y: (e.clientY - r.top - oy) / sc };
};
cv.addEventListener('pointerdown', e => {
  if (!st || st.ph !== 'jeu') return;
  const p = versPiste(e);
  A().clic?.(p.x, p.y);
});

/* ---------- décor : le chapiteau ---------- */
const POUSS = Array.from({ length: 90 }, () => ({
  x: Math.random() * VW, y: Math.random() * VH,
  r: 0.6 + Math.random() * 1.9, v: 3 + Math.random() * 9, p: Math.random() * 6.3
}));
const FOULE = Array.from({ length: 64 }, (_, i) => ({
  x: (i % 32) * 33 + (i > 31 ? 16 : 0), r: 12 + (i * 37 % 7),
  y: i > 31 ? 596 : 610, s: (i * 53 % 100) / 100
}));

function fond(t) {
  const g = cx.createRadialGradient(VW / 2, 250, 60, VW / 2, 330, 760);
  g.addColorStop(0, '#5a2029'); g.addColorStop(.45, '#38131c'); g.addColorStop(1, '#180810');
  cx.fillStyle = g; cx.fillRect(-400, -300, VW + 800, VH + 600);

  /* la toile du chapiteau : bandes qui convergent vers le mât */
  cx.save();
  cx.beginPath(); cx.rect(-400, -300, VW + 800, 190); cx.clip();
  for (let i = -9; i <= 9; i++) {
    cx.beginPath();
    cx.moveTo(VW / 2, -80);
    cx.lineTo(VW / 2 + i * 190, 210);
    cx.lineTo(VW / 2 + (i + 1) * 190, 210);
    cx.closePath();
    cx.fillStyle = i % 2 ? 'rgba(200,56,74,.30)' : 'rgba(247,233,210,.09)';
    cx.fill();
  }
  cx.restore();

  /* les cordages */
  cx.strokeStyle = 'rgba(232,181,88,.22)'; cx.lineWidth = 2;
  for (const x of [90, 910]) {
    cx.beginPath(); cx.moveTo(VW / 2, -40); cx.quadraticCurveTo((VW / 2 + x) / 2, 120, x, 420); cx.stroke();
  }

  /* les faisceaux */
  faisceau(210, -60, 0.34, t * 0.00021, 'rgba(255,226,168,');
  faisceau(790, -60, -0.34, t * 0.00017 + 2, 'rgba(255,214,206,');

  /* poussière dans la lumière */
  for (const p of POUSS) {
    const y = ((p.y - t / 1000 * p.v) % (VH + 60) + VH + 60) % (VH + 60) - 30;
    cx.globalAlpha = 0.06 + 0.10 * (0.5 + 0.5 * Math.sin(t * 0.0016 + p.p));
    cx.fillStyle = '#ffe9c4';
    cx.beginPath(); cx.arc(p.x, y, p.r, 0, 6.3); cx.fill();
  }
  cx.globalAlpha = 1;

  /* la piste : cercle de sciure */
  cx.save();
  cx.translate(VW / 2, 496); cx.scale(1, 0.19);
  const s = cx.createRadialGradient(0, 0, 20, 0, 0, 430);
  s.addColorStop(0, '#c8a877'); s.addColorStop(.75, '#8d6f4c'); s.addColorStop(1, '#5b442c');
  cx.fillStyle = s; cx.beginPath(); cx.arc(0, 0, 430, 0, 6.3); cx.fill();
  cx.lineWidth = 26; cx.strokeStyle = '#a4232f'; cx.stroke();
  cx.lineWidth = 8; cx.strokeStyle = 'rgba(232,181,88,.85)'; cx.beginPath(); cx.arc(0, 0, 430, 0, 6.3); cx.stroke();
  cx.restore();

  /* le public, en ombre */
  cx.fillStyle = 'rgba(10,4,7,.92)';
  for (const f of FOULE) {
    cx.beginPath(); cx.arc(f.x, f.y + Math.sin(t * 0.001 + f.s * 6) * 1.6, f.r, 0, 6.3); cx.fill();
    cx.fillRect(f.x - f.r, f.y, f.r * 2, 40);
  }
}

function faisceau(x, y, ang, osc, col) {
  const a = ang + Math.sin(osc) * 0.10;
  cx.save(); cx.translate(x, y); cx.rotate(a);
  const g = cx.createLinearGradient(0, 0, 0, 620);
  g.addColorStop(0, col + '.30)'); g.addColorStop(.55, col + '.09)'); g.addColorStop(1, col + '0)');
  cx.fillStyle = g;
  cx.beginPath(); cx.moveTo(-14, 0); cx.lineTo(-215, 640); cx.lineTo(215, 640); cx.lineTo(14, 0); cx.closePath(); cx.fill();
  cx.restore();
}

/* ---------- rideau de velours ---------- */
let rid = 1, ridCible = 1;
function rideaux(k) {
  if (k <= 0.002) return;
  const larg = (VW / 2 + 40) * k;
  for (const cote of [-1, 1]) {
    cx.save();
    if (cote < 0) cx.translate(0, 0); else cx.translate(VW, 0), cx.scale(-1, 1);
    const g = cx.createLinearGradient(0, 0, larg, 0);
    g.addColorStop(0, '#5f1420'); g.addColorStop(1, '#8c1f2e');
    cx.fillStyle = g; cx.fillRect(-60, -60, larg + 60, VH + 120);
    /* plis */
    for (let i = 0; i < 11; i++) {
      const x = larg * (i / 11) + larg * 0.02;
      cx.fillStyle = i % 2 ? 'rgba(0,0,0,.20)' : 'rgba(255,190,190,.055)';
      cx.fillRect(x, -60, larg / 22, VH + 120);
    }
    /* galon doré */
    cx.fillStyle = 'rgba(232,181,88,.9)'; cx.fillRect(larg - 9, -60, 9, VH + 120);
    cx.restore();
  }
  /* la frise du haut */
  cx.fillStyle = '#7a1a27'; cx.fillRect(-60, -60, VW + 120, 96 + 44 * k);
  cx.fillStyle = 'rgba(232,181,88,.9)';
  for (let i = 0; i < 26; i++) {
    cx.beginPath(); cx.arc(i * 40 + 20, 36 + 44 * k, 9, 0, 6.3); cx.fill();
  }
}

/* ---------- confettis ---------- */
let conf = [];
function confettis(n, cxx, cyy) {
  for (let i = 0; i < n; i++) conf.push({
    x: cxx, y: cyy, vx: (Math.random() - .5) * 9, vy: -3 - Math.random() * 8,
    r: Math.random() * 6.3, vr: (Math.random() - .5) * .4, v: 3 + Math.random() * 5,
    c: pick(['#e8b558', '#c8384a', '#4aa3c8', '#f7e9d2', '#f08a98'])
  });
  if (conf.length > 420) conf = conf.slice(-420);
}
function majConfettis(dt) {
  for (const p of conf) { p.vy += 22 * dt; p.x += p.vx * dt * 60 / 3; p.y += p.vy * dt * 60 / 3; p.r += p.vr; }
  conf = conf.filter(p => p.y < VH + 60);
  for (const p of conf) {
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    cx.fillStyle = p.c; cx.fillRect(-p.v / 2, -p.v / 4, p.v, p.v / 2); cx.restore();
  }
}

/* ---------- petits personnages ---------- */
const COUL = { h: { c: '#c8384a', c2: '#f08a98' }, g: { c: '#4aa3c8', c2: '#8fd0e8' } };
function artiste(x, y, role, ech, bras, pencher) {
  const C = COUL[role];
  cx.save(); cx.translate(x, y); cx.scale(ech, ech); cx.rotate(pencher || 0);
  cx.fillStyle = 'rgba(0,0,0,.35)';
  cx.beginPath(); cx.ellipse(0, 4, 15, 4, 0, 0, 6.3); cx.fill();
  /* jambes */
  cx.strokeStyle = '#2b1a12'; cx.lineWidth = 5; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-3, -14); cx.lineTo(-6, 0); cx.moveTo(3, -14); cx.lineTo(6, 0); cx.stroke();
  /* corps */
  const g = cx.createLinearGradient(0, -46, 0, -12);
  g.addColorStop(0, C.c2); g.addColorStop(1, C.c);
  cx.fillStyle = g;
  cx.beginPath(); cx.moveTo(-10, -12); cx.lineTo(-8, -44); cx.lineTo(8, -44); cx.lineTo(10, -12); cx.closePath(); cx.fill();
  /* bras */
  cx.strokeStyle = C.c2; cx.lineWidth = 5;
  const b = bras === undefined ? -0.5 : bras;
  cx.beginPath(); cx.moveTo(-7, -40); cx.lineTo(-7 - Math.cos(b) * 16, -40 - Math.sin(b) * 16);
  cx.moveTo(7, -40); cx.lineTo(7 + Math.cos(b) * 16, -40 - Math.sin(b) * 16); cx.stroke();
  /* tête */
  cx.fillStyle = '#f2d4b6'; cx.beginPath(); cx.arc(0, -52, 8.5, 0, 6.3); cx.fill();
  cx.fillStyle = C.c; cx.beginPath(); cx.arc(0, -56, 8.5, Math.PI, 0); cx.fill();
  cx.fillRect(-10, -57, 20, 2.5);
  cx.restore();
}

/* =========================================================
   NUMÉRO 1 — LE TRAPÈZE  (la simultanéité)
   Les deux trapèzes se croisent au milieu. Il faut lâcher
   AU MÊME PASSAGE et au même instant.
   ========================================================= */
const TRA_ESSAIS = 5;

const ACTES = {

tra: {
  nom: 'Le Trapèze',
  genre: 'duo',
  sous: 'Lâchez ensemble, exactement au croisement.',
  consigne: () => st.d.verdict
    ? st.d.verdict
    : 'Appuyez tous les deux au moment précis où les trapèzes se croisent. Essai ' + (st.d.n + 1) + ' / ' + TRA_ESSAIS,

  init() {
    st.d = { n: 0, t0: tps() + 1800, T: 2500, taps: {}, verdict: '', anim: null, reussis: 0 };
  },

  /* révolutions écoulées ; le croisement tombe sur u = 0.25 + n */
  rev(t) { return (t - st.d.t0) / st.d.T; },

  action(qui, a) {
    if (a.k !== 'lache' || st.d.anim || st.d.taps[qui] !== undefined) return;
    st.d.taps[qui] = a.u;
    if (st.d.taps.h !== undefined && st.d.taps.g !== undefined) this.juge();
    else diffuse();
  },

  juge() {
    const d = st.d;
    const cr = u => { const x = u - 0.25, n = Math.round(x); return { n, err: (x - n) * d.T }; };
    const a = cr(d.taps.h), b = cr(d.taps.g);
    const ecart = Math.abs(a.err - b.err);
    const moy = (Math.abs(a.err) + Math.abs(b.err)) / 2;
    if (a.n !== b.n) this.conclut(false, 'Pas le même passage !', 'Vous avez lâché à deux balancements différents.');
    else if (ecart > 200) this.conclut(false, 'Décalés de ' + Math.round(ecart) + ' ms', 'Il faut partir ensemble, pas l\'un après l\'autre.');
    else if (moy > 260) this.conclut(false, 'Trop tôt / trop tard', 'Ensemble, oui — mais pas au bon moment.');
    else this.conclut(true, ecart < 60 ? 'PARFAIT !' : 'Rattrapée !', 'Écart entre vous : ' + Math.round(ecart) + ' ms.');
  },

  conclut(ok, titre, sous) {
    const d = st.d;
    if (d.anim) return;
    if (ok) { d.reussis++; confettis(60, VW / 2, 260); }
    d.anim = { ok, titre, sous };
    d.verdict = titre + ' — ' + sous;
    diffuse();
    tard(() => {
      if (d.n + 1 >= TRA_ESSAIS) {
        const p = d.reussis * 3;
        finActe('Le trapèze', d.reussis + ' vol' + (d.reussis > 1 ? 's' : '') + ' rattrapé' + (d.reussis > 1 ? 's' : '') + ' sur ' + TRA_ESSAIS + '.', p, p);
      } else {
        d.n++; d.taps = {}; d.anim = null; d.verdict = '';
        d.T = Math.max(1500, d.T - 190); d.t0 = tps() + 1200;
        diffuse();
      }
    }, 2500);
  },

  /* si l'un des deux n'appuie jamais, l'essai ne doit pas rester bloqué */
  tick() {
    if (!hote) return;
    const d = st.d;
    if (d.anim) return;
    const nh = d.taps.h !== undefined, ng = d.taps.g !== undefined;
    if (nh && ng) return;
    if (tps() > d.t0 + ((nh || ng) ? 9000 : 26000)) {
      this.conclut(false, (nh || ng) ? 'Un seul a lâché' : 'Personne n\'a lâché',
        'Il faut appuyer tous les deux, sur le même passage.');
    }
  },

  cmd() {
    const dej = st.d.taps && st.d.taps[moi] !== undefined;
    return `<button class="gros-bouton ${moi === 'h' ? 'rouge' : 'bleu'}" data-a="lache" ${dej || st.d.anim ? 'disabled' : ''}>LÂCHER</button>`;
  },
  bouton(k) {
    if (k !== 'lache') return;
    jouer({ k: 'lache', u: this.rev(tps()) });
    if (!hote) { st.d.taps[moi] = 0; rendu(); }   /* retour immédiat côté invité */
  },
  touche(e) { if (e.code === 'Space' || e.code === 'Enter') this.bouton('lache'); },

  dessine(t) {
    const d = st.d, u = this.rev(t), th = u * 6.283185;
    const L = 250, PY = 96, AMP = 0.66;
    const a1 = Math.sin(th) * AMP, a2 = -Math.sin(th) * AMP;
    const P = [{ px: 330, a: a1, r: 'h' }, { px: 670, a: a2, r: 'g' }];

    /* la barre de fixation */
    cx.strokeStyle = 'rgba(232,181,88,.35)'; cx.lineWidth = 6;
    cx.beginPath(); cx.moveTo(240, PY); cx.lineTo(760, PY); cx.stroke();

    /* le filet */
    cx.strokeStyle = 'rgba(247,233,210,.20)'; cx.lineWidth = 1.4;
    for (let i = 0; i <= 16; i++) {
      cx.beginPath(); cx.moveTo(230 + i * 34, 470); cx.lineTo(300 + i * 26, 520); cx.stroke();
    }
    for (let j = 0; j <= 4; j++) {
      cx.beginPath(); cx.moveTo(230 + j * 17, 470 + j * 12); cx.lineTo(774 - j * 13, 470 + j * 12); cx.stroke();
    }

    for (const p of P) {
      const bx = p.px + Math.sin(p.a) * L, by = PY + Math.cos(p.a) * L;
      cx.strokeStyle = 'rgba(247,233,210,.55)'; cx.lineWidth = 2.5;
      cx.beginPath(); cx.moveTo(p.px - 22, PY); cx.lineTo(bx - 22, by);
      cx.moveTo(p.px + 22, PY); cx.lineTo(bx + 22, by); cx.stroke();
      cx.strokeStyle = '#e8b558'; cx.lineWidth = 7; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(bx - 26, by); cx.lineTo(bx + 26, by); cx.stroke();
      const lache = d.anim && d.anim.ok;
      artiste(bx, by + 78, p.r, 1, -1.35, lache ? Math.sin(t * 0.01) * 0.3 : p.a * 0.5);
      /* les mains tiennent la barre */
      cx.strokeStyle = COUL[p.r].c2; cx.lineWidth = 4;
      cx.beginPath(); cx.moveTo(bx - 7, by + 32); cx.lineTo(bx - 4, by + 4);
      cx.moveTo(bx + 7, by + 32); cx.lineTo(bx + 4, by + 4); cx.stroke();
    }

    /* la fenêtre parfaite : un halo au centre quand ça se croise */
    const prox = Math.max(0, Math.sin(th));
    if (prox > 0.72) {
      cx.globalAlpha = (prox - 0.72) / 0.28 * 0.5;
      const g = cx.createRadialGradient(VW / 2, PY + L * Math.cos(AMP) + 10, 5, VW / 2, PY + L * Math.cos(AMP) + 10, 130);
      g.addColorStop(0, '#fff2cd'); g.addColorStop(1, 'rgba(255,242,205,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(VW / 2, PY + L * Math.cos(AMP) + 10, 130, 0, 6.3); cx.fill();
      cx.globalAlpha = 1;
    }

    /* qui a déjà lâché */
    cx.font = '600 20px Jost, sans-serif'; cx.textAlign = 'center';
    if (d.taps.h !== undefined) { cx.fillStyle = COUL.h.c2; cx.fillText('lâché !', 330, 560); }
    if (d.taps.g !== undefined) { cx.fillStyle = COUL.g.c2; cx.fillText('lâché !', 670, 560); }

    if (d.anim) {
      cx.font = '400 34px "Alfa Slab One", serif'; cx.textAlign = 'center';
      cx.fillStyle = d.anim.ok ? '#e8b558' : '#ff9aa8';
      cx.fillText(d.anim.titre, VW / 2, 440);
    }
    /* les étoiles gagnées */
    etoiles(d.reussis, TRA_ESSAIS, 60);
  }
},

/* =========================================================
   NUMÉRO 2 — LE FUNAMBULE  (l'équilibre à deux)
   Chacun tient un bout du balancier. Trop d'un côté, il tombe.
   ========================================================= */
fun: {
  nom: 'Le Funambule',
  genre: 'duo',
  sous: 'Un balancier, deux paires de mains.',
  consigne: () => moi === 'h'
    ? 'MAINTIENS ton bouton pour tirer le balancier vers TA gauche. Ne tire jamais tout seul.'
    : 'MAINTIENS ton bouton pour tirer le balancier vers TA droite. Lâche dès qu\'il penche.',

  init() {
    st.d = { t0: tps(), incl: 0, vit: 0, av: 0, vies: 3, noeud: 0, fini: 0, chute: 0 };
    L.incl = 0; L.vit = 0; L.av = 0; L.cumul = 0; L.der = performance.now();
  },

  /* le vent est une fonction pure du temps : les deux écrans le calculent pareil */
  vent(el) {
    return 0.55 * Math.sin(el * 0.00113 + 1.7) + 0.34 * Math.sin(el * 0.00271)
         + 0.22 * Math.sin(el * 0.00619 + 4.2);
  },

  pas(dt) {
    if (st.d.fini) return;
    const el = tps() - st.d.t0;
    const acc = this.vent(el) * 1.05
      + (entrees.h ? -3.2 : 0) + (entrees.g ? 3.2 : 0)
      + Math.sin(L.incl) * 2.4;                       /* pendule inversé : ça tombe tout seul */
    L.vit = (L.vit + acc * dt) * Math.pow(0.5, dt);
    L.incl += L.vit * dt;
    const stab = 1 - Math.min(1, Math.abs(L.incl) / 0.62) * 0.86;
    L.av += dt * 42 * stab;
  },

  action(qui, a) { if (a.k === 'reprise') { /* rien : géré par l'hôte */ } },

  tick(dt) {
    if (!hote) return;
    const d = st.d;
    if (d.fini) return;
    if (Math.abs(L.incl) > 0.62) {                    /* chute */
      d.vies--; d.chute = tps();
      L.incl = 0; L.vit = 0; L.av = d.noeud;
      /* dernière chute : on envoie quand même la position finale,
         sinon l'autre écran garde le funambule au milieu du fil */
      if (d.vies <= 0) { d.fini = 1; this.corrige(true); this.termine(); return; }
      toast('Chute ! Il reste ' + d.vies + ' vie' + (d.vies > 1 ? 's' : '') + '.');
      this.corrige(true);
    }
    if (L.av > d.noeud + 240) { d.noeud = Math.floor(L.av / 240) * 240; this.corrige(true); }
    if (L.av >= 720) { d.fini = 2; this.corrige(true); this.termine(); return; }
    if (tps() - (d.derCor || 0) > 250) { d.derCor = tps(); this.corrige(false); }
  },

  corrige(dur) {
    st.d.incl = L.incl; st.d.vit = L.vit; st.d.av = L.av;
    if (!solo) envoie({ t: 'FC', incl: L.incl, vit: L.vit, av: L.av, dur, vies: st.d.vies, noeud: st.d.noeud, fini: st.d.fini });
    if (dur) diffuse();
  },

  termine() {
    const d = st.d;
    const p = d.fini === 2 ? 4 + d.vies * 3 : d.vies * 2;
    tard(() => finActe(
      d.fini === 2 ? 'Traversée !' : 'Le filet vous rattrape',
      d.fini === 2 ? 'Arrivés de l\'autre côté avec ' + d.vies + ' vie(s).' : 'Arrêtés à ' + Math.round(L.av / 7.2) + ' % du fil.',
      p, p), 900);
  },

  cmd() {
    const c = moi === 'h' ? 'rouge' : 'bleu';
    return `<button class="gros-bouton ${c}" data-h="tire">${moi === 'h' ? '◀ TIRE' : 'TIRE ▶'}</button>`;
  },
  touche() {},

  dessine(t) {
    const d = st.d, Y = 392, X0 = 140, X1 = 860;
    /* les deux plateformes */
    cx.fillStyle = '#3d2a1c';
    cx.fillRect(X0 - 62, Y - 6, 62, 12); cx.fillRect(X1, Y - 6, 62, 12);
    cx.fillStyle = 'rgba(0,0,0,.5)'; cx.fillRect(X0 - 48, Y + 6, 12, 110); cx.fillRect(X1 + 36, Y + 6, 12, 110);
    /* le fil */
    cx.strokeStyle = '#e8d6a8'; cx.lineWidth = 2.5;
    cx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = X0 + (X1 - X0) * i / 40;
      const y = Y + Math.sin(Math.PI * i / 40) * 7;
      i ? cx.lineTo(x, y) : cx.moveTo(x, y);
    }
    cx.stroke();
    /* les nœuds franchis */
    for (let k = 240; k < 720; k += 240) {
      const x = X0 + (X1 - X0) * k / 720;
      cx.fillStyle = L.av >= k ? '#e8b558' : 'rgba(247,233,210,.25)';
      cx.beginPath(); cx.arc(x, Y, 5, 0, 6.3); cx.fill();
    }

    const px = X0 + (X1 - X0) * clamp(L.av, 0, 720) / 720;
    const py = Y + Math.sin(Math.PI * clamp(L.av, 0, 720) / 720) * 7;

    /* le balancier */
    cx.save(); cx.translate(px, py - 46); cx.rotate(L.incl);
    cx.strokeStyle = '#d8c9a0'; cx.lineWidth = 4; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(-135, 0); cx.lineTo(135, 0); cx.stroke();
    cx.fillStyle = COUL.h.c; cx.beginPath(); cx.arc(-135, 0, 10, 0, 6.3); cx.fill();
    cx.fillStyle = COUL.g.c; cx.beginPath(); cx.arc(135, 0, 10, 0, 6.3); cx.fill();
    cx.restore();

    /* le funambule penche avec le balancier */
    artiste(px, py, 'h', 1, undefined, L.incl * 0.8);

    /* jauge d'équilibre, au-dessus du fil pour rester lisible */
    const gx = VW / 2, gy = 252;
    cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(gx - 210, gy - 10, 420, 20);
    const dz = clamp(L.incl / 0.62, -1, 1);
    cx.fillStyle = Math.abs(dz) > .72 ? '#ff5f72' : Math.abs(dz) > .45 ? '#e8b558' : '#7fd68f';
    cx.fillRect(gx - 4, gy - 10, 8, 20);
    cx.fillRect(gx + dz * 200 - 6, gy - 16, 12, 32);
    cx.strokeStyle = 'rgba(247,233,210,.35)'; cx.lineWidth = 1.5;
    cx.strokeRect(gx - 210, gy - 10, 420, 20);
    cx.font = '600 13px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#b99a8e';
    cx.fillText(st.nm.h || 'A1', gx - 232, gy + 5); cx.fillText(st.nm.g || 'A2', gx + 236, gy + 5);

    /* qui tire */
    if (entrees.h) { cx.fillStyle = COUL.h.c2; cx.beginPath(); cx.arc(gx - 258, gy, 7, 0, 6.3); cx.fill(); }
    if (entrees.g) { cx.fillStyle = COUL.g.c2; cx.beginPath(); cx.arc(gx + 262, gy, 7, 0, 6.3); cx.fill(); }

    coeurs(d.vies, 3);
    cx.font = '400 15px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#b99a8e';
    cx.fillText(Math.round(L.av / 7.2) + ' %', px, py - 96);
    if (d.chute && t - d.chute < 800) {
      cx.font = '400 40px "Alfa Slab One", serif'; cx.fillStyle = '#ff9aa8';
      cx.fillText('CHUTE', VW / 2, 250);
    }
  }
},

/* =========================================================
   NUMÉRO — LE DUEL DES ASSIETTES  (bataille)
   Trois perches chacun, personne ne voit mieux que l'autre.
   Celui qui en casse le moins gagne le numéro.
   ========================================================= */
ass: {
  nom: 'Le Duel des Assiettes',
  sous: 'Trois perches chacun. Le dernier debout gagne.',
  genre: 'battle',
  consigne: () => 'Relance TES trois assiettes avant qu\'elles tombent — clique-les, ou touches 1 2 3. Ça accélère.',
  DUREE: 56000,
  XS: { h: [130, 245, 360], g: [640, 755, 870] },

  init() {
    const t = tps();
    const perches = r => [0, 1, 2].map(i => ({ i, v: 1, t0: t, on: 1 }));
    st.d = { t0: t, a: { h: perches('h'), g: perches('g') }, vies: { h: 3, g: 3 }, casse: { h: 0, g: 0 }, mort: {}, fini: 0 };
  },
  taux() { return 0.000062 * (1 + (tps() - st.d.t0) / 34000); },
  niveau(p) { return p.on ? clamp(p.v - (tps() - p.t0) * this.taux(), 0, 1) : 0; },

  action(qui, a) {
    if (a.k !== 'sp' || st.d.fini || st.d.mort[qui]) return;
    const p = st.d.a[qui][a.i];
    if (!p || !p.on || this.niveau(p) > 0.94) return;
    p.v = 1; p.t0 = tps();
    diffuse();
  },

  clic(x, y) {
    if (st.d.mort[moi]) return;
    const xs = this.XS[moi];
    for (let i = 0; i < 3; i++) if (Math.abs(x - xs[i]) < 62 && y > 250 && y < 470) { jouer({ k: 'sp', i }); return; }
  },
  touche(e) { const i = '123'.indexOf(e.key); if (i >= 0) jouer({ k: 'sp', i }); },

  tick() {
    if (!hote || st.d.fini) return;
    const d = st.d, el = tps() - d.t0;
    for (const r of ['h', 'g']) {
      if (d.mort[r]) continue;
      for (const p of d.a[r]) {
        if (p.on && this.niveau(p) <= 0) {
          p.on = 0; d.casse[r]++; d.vies[r]--;
          if (d.vies[r] <= 0) { d.mort[r] = tps(); }
          else tard(() => { p.on = 1; p.v = 1; p.t0 = tps(); diffuse(); }, 3500);
          diffuse();
        }
      }
    }
    if ((d.mort.h && d.mort.g) || el > this.DUREE) this.termine();
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1; purge();
    const d = st.d;
    /* à égalité de vies, celui qui a tenu le plus longtemps l'emporte */
    const fin = r => d.mort[r] || tps();
    let gagnant = null;
    if (d.vies.h !== d.vies.g) gagnant = d.vies.h > d.vies.g ? 'h' : 'g';
    else if (Math.abs(fin('h') - fin('g')) > 1200) gagnant = fin('h') > fin('g') ? 'h' : 'g';
    const ph = gagnant === 'h' ? 12 : gagnant === 'g' ? 5 : 9;
    const pg = gagnant === 'g' ? 12 : gagnant === 'h' ? 5 : 9;
    if (gagnant) confettis(70, gagnant === 'h' ? 245 : 755, 300);
    tard(() => finActe(
      gagnant ? (st.nm[gagnant] || 'L\'un de vous') + ' l\'emporte' : 'Égalité parfaite',
      d.casse.h + ' assiette(s) cassée(s) contre ' + d.casse.g + '.', ph, pg), 900);
  },

  dessine(t) {
    const d = st.d;
    /* la ligne qui sépare les deux camps */
    cx.strokeStyle = 'rgba(232,181,88,.25)'; cx.lineWidth = 2; cx.setLineDash([8, 10]);
    cx.beginPath(); cx.moveTo(VW / 2, 180); cx.lineTo(VW / 2, 500); cx.stroke(); cx.setLineDash([]);

    for (const r of ['h', 'g']) {
      const xs = this.XS[r];
      for (const p of d.a[r]) {
        const x = xs[p.i], base = 470, ty = base - 152;
        cx.strokeStyle = '#6b4b2c'; cx.lineWidth = 5; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(x, base); cx.lineTo(x, ty); cx.stroke();
        cx.fillStyle = 'rgba(0,0,0,.35)';
        cx.beginPath(); cx.ellipse(x, base + 3, 20, 5, 0, 0, 6.3); cx.fill();
        if (r === moi) {
          cx.font = '400 18px "Alfa Slab One", serif'; cx.textAlign = 'center';
          cx.fillStyle = 'rgba(43,15,22,.8)'; cx.fillText(String(p.i + 1), x, base + 28);
        }
        if (!p.on) {
          cx.fillStyle = 'rgba(247,233,210,.4)';
          for (let k = 0; k < 7; k++) {
            const a = k * 1.1 + p.i;
            cx.beginPath(); cx.arc(x + Math.cos(a) * (16 + k * 4), base - 2 + Math.sin(a) * 4, 3, 0, 6.3); cx.fill();
          }
          continue;
        }
        const e = this.niveau(p);
        cx.save(); cx.translate(x, ty);
        cx.rotate(Math.sin(t * (0.006 + (1 - e) * 0.014) + p.i) * (1 - e) * 0.44);
        cx.save(); cx.scale(1, 0.30);
        const g = cx.createRadialGradient(0, 0, 4, 0, 0, 46);
        g.addColorStop(0, '#fffaf0'); g.addColorStop(.7, '#efe0c8'); g.addColorStop(1, '#c9b391');
        cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, 46, 0, 6.3); cx.fill();
        cx.strokeStyle = e < 0.3 ? '#ff5f72' : COUL[r].c; cx.lineWidth = e < 0.3 ? 9 : 6;
        cx.beginPath(); cx.arc(0, 0, 40, 0, 6.3); cx.stroke();
        cx.restore(); cx.restore();
        /* la barre de vie de l'assiette : visible par les deux, c'est un duel loyal */
        cx.fillStyle = 'rgba(0,0,0,.4)'; cx.fillRect(x - 30, ty - 34, 60, 7);
        cx.fillStyle = e < 0.25 ? '#ff5f72' : e < 0.5 ? '#e8b558' : '#7fd68f';
        cx.fillRect(x - 30, ty - 34, 60 * e, 7);
      }
      artiste(r === 'h' ? 60 : 940, 496, r, 0.95, -1.6);
      /* les vies de chacun, sous le chrono pour ne pas se marcher dessus */
      cx.font = '20px system-ui, "Segoe UI Emoji", sans-serif'; cx.textAlign = r === 'h' ? 'left' : 'right';
      for (let i = 0; i < 3; i++) {
        cx.globalAlpha = i < d.vies[r] ? 1 : .2;
        cx.fillText('❤', r === 'h' ? 26 + i * 28 : VW - 26 - i * 28, 214);
      }
      cx.globalAlpha = 1;
      cx.font = '600 12px Jost, sans-serif'; cx.fillStyle = COUL[r].c2;
      cx.fillText((st.nm[r] || (r === 'h' ? 'Artiste 1' : 'Artiste 2')) + (r === moi ? ' (toi)' : ''),
        r === 'h' ? 26 : VW - 26, 236);
      if (d.mort[r]) {
        cx.font = '400 24px "Alfa Slab One", serif'; cx.textAlign = 'center'; cx.fillStyle = '#ff9aa8';
        cx.fillText('ÉLIMINÉ', r === 'h' ? 245 : 755, 300);
      }
    }
    const reste = Math.max(0, this.DUREE - (t - d.t0));
    minuteur(reste / this.DUREE, (reste / 1000).toFixed(0) + ' s');
  }
},

/* =========================================================
   NUMÉRO — QUI DE NOUS DEUX  (complicité)
   Chacun désigne un nom. On marque si vous désignez le même.
   ========================================================= */
qui: {
  nom: 'Qui de nous deux',
  sous: 'Désignez la même personne, et le public applaudit.',
  genre: 'question',
  N: 6,
  consigne() {
    if (st.d.rev) return st.d.rev.ok ? 'Vous avez dit pareil.' : 'Pas d\'accord, tous les deux.';
    return st.d.rep[moi] ? 'C\'est envoyé. On attend l\'autre…' : 'Désigne l\'un de vous deux.';
  },

  init() { st.d = { n: 0, q: '', rep: {}, rev: null, acc: 0, fini: 0 }; this.pose(); },
  pose() { st.d.q = tirer('qui', QUI); st.d.rep = {}; st.d.rev = null; st.d.t0 = tps(); diffuse(); },

  action(qui, a) {
    const d = st.d;
    if (a.k !== 'r' || d.rev || d.rep[qui]) return;
    d.rep[qui] = a.v;                                   /* 'h' ou 'g' */
    if (d.rep.h && d.rep.g) this.verifie(); else { d.premier = tps(); diffuse(); }
  },

  verifie() {
    const d = st.d;
    if (d.rev) return;
    const ok = d.rep.h === d.rep.g && d.rep.h !== '?';
    if (ok) { d.acc++; confettis(50, VW / 2, 300); }
    d.rev = { ok };
    diffuse();
    tard(() => { if (d.n + 1 >= this.N) return this.termine(); d.n++; this.pose(); }, 3600);
  },

  /* si l'un des deux ne répond jamais, on n'attend pas la nuit entière —
     et dès que le premier a répondu, l'autre n'a plus que 25 s */
  tick() {
    if (!hote || st.d.rev || st.d.fini) return;
    const d = st.d;
    if (tps() - d.t0 > 50000 || (d.premier && tps() - d.premier > 25000)) {
      for (const r of ['h', 'g']) if (!d.rep[r]) d.rep[r] = '?';
      this.verifie();
    }
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1; purge();
    const p = st.d.acc * 3;
    tard(() => finActe('Qui de nous deux', st.d.acc + ' réponse(s) identique(s) sur ' + this.N + '.', p, p), 500);
  },

  cmd() {
    if (st.d.rev) return '<p class="etiq">…</p>';
    const dej = !!st.d.rep[moi];
    return `<div class="paire">
      <button class="choix rouge" data-a="rh" ${dej ? 'disabled' : ''}>${esc(st.nm.h || 'Artiste 1')}</button>
      <button class="choix bleu" data-a="rg" ${dej ? 'disabled' : ''}>${esc(st.nm.g || 'Artiste 2')}</button></div>`;
  },
  bouton(k) { if (k === 'rh' || k === 'rg') jouer({ k: 'r', v: k === 'rh' ? 'h' : 'g' }); },
  touche(e) { if (e.key === '1') this.bouton('rh'); if (e.key === '2') this.bouton('rg'); },

  dessine(t) { panneauQuestion(st.d.q, st.d.n, this.N, st.d.rep, st.d.rev, r => st.nm[st.d.rep[r]] || '?'); }
},

/* =========================================================
   NUMÉRO — TU PRÉFÈRES  (l'un répond, l'autre devine)
   ========================================================= */
pre: {
  nom: 'Tu préfères',
  sous: 'L\'un choisit pour de vrai, l\'autre essaie de le deviner.',
  genre: 'question',
  N: 6,
  consigne() {
    const d = st.d;
    if (d.rev) return d.rev.ok ? 'Deviné !' : 'Raté.';
    if (d.rep[moi] !== undefined) return 'C\'est envoyé. On attend l\'autre…';
    return d.sujet === moi ? 'C\'est TOI le sujet : réponds sincèrement.' : 'Devine ce que l\'autre va choisir.';
  },

  init() { st.d = { n: 0, p: null, sujet: 'h', rep: {}, rev: null, bons: 0, fini: 0 }; this.pose(); },
  pose() {
    const d = st.d;
    d.p = tirer('pre', PREFERE); d.sujet = d.n % 2 === 0 ? 'h' : 'g';
    d.rep = {}; d.rev = null; d.t0 = tps(); diffuse();
  },

  action(qui, a) {
    const d = st.d;
    if (a.k !== 'r' || d.rev || d.rep[qui] !== undefined) return;
    d.rep[qui] = a.v;
    if (d.rep.h !== undefined && d.rep.g !== undefined) this.verifie(); else { d.premier = tps(); diffuse(); }
  },

  verifie() {
    const d = st.d;
    if (d.rev) return;
    const ok = d.rep.h === d.rep.g && d.rep.h >= 0;
    const dev = d.sujet === 'h' ? 'g' : 'h';
    if (ok) { d.bons++; confettis(50, VW / 2, 300); }
    d.pts = d.pts || { h: 0, g: 0 };
    if (ok) { d.pts[dev] += 4; d.pts[d.sujet] += 2; }
    d.rev = { ok, dev };
    diffuse();
    tard(() => { if (d.n + 1 >= this.N) return this.termine(); d.n++; this.pose(); }, 3600);
  },

  tick() {
    if (!hote || st.d.rev || st.d.fini) return;
    const d = st.d;
    if (tps() - d.t0 > 50000 || (d.premier && tps() - d.premier > 25000)) {
      for (const r of ['h', 'g']) if (d.rep[r] === undefined) d.rep[r] = -1;
      this.verifie();
    }
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1; purge();
    const p = st.d.pts || { h: 0, g: 0 };
    tard(() => finActe('Tu préfères', st.d.bons + ' bonne(s) intuition(s) sur ' + this.N + '.', p.h, p.g), 500);
  },

  cmd() {
    const d = st.d;
    if (d.rev || !d.p) return '<p class="etiq">…</p>';
    const dej = d.rep[moi] !== undefined;
    return `<div class="paire">
      <button class="choix long" data-a="r0" ${dej ? 'disabled' : ''}>${esc(d.p[0])}</button>
      <button class="choix long" data-a="r1" ${dej ? 'disabled' : ''}>${esc(d.p[1])}</button></div>`;
  },
  bouton(k) { if (k === 'r0' || k === 'r1') jouer({ k: 'r', v: k === 'r0' ? 0 : 1 }); },
  touche(e) { if (e.key === '1') this.bouton('r0'); if (e.key === '2') this.bouton('r1'); },

  dessine(t) {
    const d = st.d; if (!d.p) return;
    const nomS = st.nm[d.sujet] || (d.sujet === 'h' ? 'Artiste 1' : 'Artiste 2');
    const titre = d.sujet === moi ? 'TOI — tu préfères…' : nomS + ' préfère…';
    panneauQuestion(titre, d.n, this.N, d.rep, d.rev,
      r => d.rep[r] === undefined ? '?' : d.rep[r] === -1 ? '—' : d.p[d.rep[r]],
      d.rev ? (d.rev.ok ? '#7fd68f' : '#ff9aa8') : null);
  }
},

/* =========================================================
   NUMÉRO — LE QUIZ DU CHAPITEAU  (bataille de vitesse)
   ========================================================= */
qz: {
  nom: 'Le Quiz du Chapiteau',
  sous: 'Bonne réponse ET plus vite que l\'autre.',
  genre: 'battle',
  N: 8, LIMITE: 12000,
  consigne() {
    const d = st.d;
    if (d.rev) return d.rev.txt;
    return d.rep[moi] !== undefined ? 'Réponse enregistrée. On attend l\'autre…' : 'Le plus rapide à avoir juste marque le plus.';
  },

  init() { st.d = { n: 0, q: null, ch: [], bon: 0, rep: {}, rev: null, pts: { h: 0, g: 0 }, fini: 0 }; this.pose(); },
  pose() {
    const d = st.d, q = tirer('qz', QUIZ);
    const idx = melange([0, 1, 2, 3]);
    d.q = q[0];
    d.ch = idx.map(i => q[1][i]);
    d.bon = idx.indexOf(q[2]);
    d.rep = {}; d.rev = null; d.t0 = tps(); diffuse();
  },

  action(qui, a) {
    const d = st.d;
    if (a.k !== 'r' || d.rev || d.rep[qui] !== undefined) return;
    d.rep[qui] = { v: a.v, ms: clamp(a.ms, 0, this.LIMITE) };
    if (d.rep.h !== undefined && d.rep.g !== undefined) this.juge();
    else diffuse();
  },

  juge() {
    const d = st.d;
    const bons = ['h', 'g'].filter(r => d.rep[r].v === d.bon);
    bons.sort((a, b) => d.rep[a].ms - d.rep[b].ms);
    let txt;
    if (!bons.length) txt = 'Personne. La bonne réponse était « ' + d.ch[d.bon] + ' ».';
    else {
      d.pts[bons[0]] += 3;
      if (bons[1]) d.pts[bons[1]] += 1;
      const nm = r => st.nm[r] || (r === 'h' ? 'Artiste 1' : 'Artiste 2');
      txt = bons.length === 2
        ? nm(bons[0]) + ' a été plus rapide de ' + Math.round(d.rep[bons[1]].ms - d.rep[bons[0]].ms) + ' ms.'
        : nm(bons[0]) + ' seul(e) a trouvé.';
      confettis(40, VW / 2, 300);
    }
    d.rev = { txt };
    diffuse();
    tard(() => { if (d.n + 1 >= this.N) return this.termine(); d.n++; this.pose(); }, 3400);
  },

  tick() {
    if (!hote || st.d.fini || st.d.rev) return;
    if (tps() - st.d.t0 > this.LIMITE) {
      for (const r of ['h', 'g']) if (st.d.rep[r] === undefined) st.d.rep[r] = { v: -1, ms: this.LIMITE };
      this.juge();
    }
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1; purge();
    const p = st.d.pts;
    tard(() => finActe('Le quiz du chapiteau',
      (p.h === p.g ? 'Vous finissez à égalité.' : (st.nm[p.h > p.g ? 'h' : 'g'] || 'L\'un de vous') + ' mène le quiz.'),
      p.h, p.g), 500);
  },

  cmd() {
    const d = st.d;
    if (d.rev || !d.q) return '<p class="etiq">…</p>';
    const dej = d.rep[moi] !== undefined;
    return '<div class="quatre">' + d.ch.map((c, i) =>
      `<button class="choix" data-a="r${i}" ${dej ? 'disabled' : ''}>${esc(c)}</button>`).join('') + '</div>';
  },
  bouton(k) {
    const i = +k.slice(1);
    if (i >= 0 && i < 4) jouer({ k: 'r', v: i, ms: tps() - st.d.t0 });
  },
  touche(e) { const i = '1234'.indexOf(e.key); if (i >= 0) this.bouton('r' + i); },

  dessine(t) {
    const d = st.d; if (!d.q) return;
    panneauQuestion(d.q, d.n, this.N, d.rep, d.rev,
      r => d.rep[r] === undefined ? '?' : d.rep[r].v < 0 ? '—' : d.ch[d.rep[r].v],
      null,
      d.rev ? d.ch[d.bon] : null);
    if (!d.rev) {
      const reste = Math.max(0, this.LIMITE - (t - d.t0));
      minuteur(reste / this.LIMITE, (reste / 1000).toFixed(1) + ' s');
    }
  }
},

/* =========================================================
   NUMÉRO — LE DUEL DU CANON  (bataille)
   Un canon chacun, une cible au milieu. Le plus près gagne.
   ========================================================= */
can: {
  nom: 'Le Duel du Canon',
  sous: 'Un canon chacun, une seule cible.',
  genre: 'battle',
  MANCHES: 4, SOL: 452,
  consigne() {
    if (st.d.vol) return 'Ça part !';
    return st.d.pret[moi] ? 'Prêt. On attend l\'autre…' : 'Règle ton angle et ta poudre, puis PRÊT. Le plus près de la cible marque.';
  },

  init() { st.d = { m: 0, cible: this.tire(), ang: { h: 45, g: 45 }, pui: { h: 50, g: 50 }, pret: {}, vol: null, imp: {}, pts: { h: 0, g: 0 }, fini: 0, dep: tps() }; },
  tire() { return 380 + Math.round(Math.random() * 240); },

  action(qui, a) {
    const d = st.d;
    if (d.vol || d.fini) return;
    if (a.k === 'ang') { d.ang[qui] = clamp(a.v, 18, 72); diffuse(); }
    else if (a.k === 'pui') { d.pui[qui] = clamp(a.v, 0, 100); diffuse(); }
    else if (a.k === 'pret') {
      if (a.m !== undefined && a.m !== d.m) return;
      d.pret[qui] = 1;
      if (d.pret.h && d.pret.g) this.feu(); else diffuse();
    }
  },

  /* même physique pour les deux, l'un tire vers la droite, l'autre vers la gauche */
  trajet(r) {
    const d = st.d, g = 0.30, v0 = 3.4 + d.pui[r] * 0.135, a = d.ang[r] * Math.PI / 180;
    const sens = r === 'h' ? 1 : -1;
    const vx = Math.cos(a) * v0 * sens, vy = Math.sin(a) * v0;
    return { g, vx, vy, x0: r === 'h' ? 176 : VW - 176, y0: this.SOL, duree: (2 * vy / g) * (1000 / 60), sens };
  },

  feu() {
    const d = st.d;
    d.pret = {};
    const th = this.trajet('h'), tg = this.trajet('g');
    th.chute = th.x0 + th.vx * (2 * th.vy / th.g);
    tg.chute = tg.x0 + tg.vx * (2 * tg.vy / tg.g);
    const t0 = tps() + 350;
    d.vol = { t0, h: th, g: tg, duree: Math.max(th.duree, tg.duree) };
    diffuse();
    tard(() => {
      const eh = Math.abs(th.chute - d.cible), eg = Math.abs(tg.chute - d.cible);
      d.imp = { h: th.chute, g: tg.chute };
      const nm = r => st.nm[r] || (r === 'h' ? 'Artiste 1' : 'Artiste 2');
      let msg;
      if (Math.abs(eh - eg) < 8) { d.pts.h += 2; d.pts.g += 2; msg = 'Aussi près l\'un que l\'autre.'; }
      else {
        const v = eh < eg ? 'h' : 'g', e = Math.min(eh, eg);
        d.pts[v] += e <= 22 ? 6 : 4;
        msg = nm(v) + (e <= 22 ? ' en plein dans la cible !' : ' est le plus près (' + Math.round(e) + ' px).');
        confettis(60, d.cible, 420);
      }
      toast(msg);
      d.vol = null;
      if (d.m + 1 >= this.MANCHES) return this.termine();
      d.m++; d.cible = this.tire(); d.dep = tps();
      tard(() => { d.imp = {}; diffuse(); }, 1800);
      diffuse();
    }, 350 + d.vol.duree + 900);
  },

  tick() {
    if (!hote || st.d.fini || st.d.vol) return;
    const d = st.d;
    /* l'un a dit PRÊT et l'autre ne vient jamais : on tire quand même */
    if ((d.pret.h || d.pret.g) && tps() - d.dep > 45000) { d.pret.h = d.pret.g = 1; this.feu(); return; }
    if (tps() - d.dep > 90000) this.termine();
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1; purge();
    const p = st.d.pts;
    tard(() => finActe('Le duel du canon',
      p.h === p.g ? 'Match nul, à la poudre près.' : (st.nm[p.h > p.g ? 'h' : 'g'] || 'L\'un de vous') + ' vise mieux.',
      p.h, p.g), 700);
  },

  cmd() {
    const d = st.d;
    const c = moi === 'h' ? 'rouge' : 'bleu';
    return `<div class="reglages">
        <label class="etiq">Angle<input class="curseur" type="range" min="18" max="72" value="${d.ang[moi]}" data-r="ang"></label>
        <label class="etiq">Poudre<input class="curseur" type="range" min="0" max="100" value="${d.pui[moi]}" data-r="pui"></label>
      </div>
      <button class="gros-bouton ${c}" data-a="pret">PRÊT</button>`;
  },
  bouton(k) { if (k === 'pret') jouer({ k: 'pret', m: st.d.m }); },
  curseur(r, v) { jouer({ k: r, v }); },
  touche(e) { if (e.code === 'Space') this.bouton('pret'); },

  dessine(t) {
    const d = st.d, SOL = this.SOL;

    /* les deux canons */
    for (const r of ['h', 'g']) {
      const sens = r === 'h' ? 1 : -1, bx = r === 'h' ? 140 : VW - 140;
      cx.save(); cx.translate(bx, SOL + 6); cx.scale(sens, 1);
      cx.fillStyle = '#4b3524'; cx.beginPath(); cx.arc(0, 0, 30, Math.PI, 0); cx.fill();
      cx.fillStyle = '#2f2117'; cx.fillRect(-34, 0, 68, 10);
      cx.rotate(-d.ang[r] * Math.PI / 180);
      const g = cx.createLinearGradient(0, -20, 0, 20);
      g.addColorStop(0, COUL[r].c2); g.addColorStop(.5, '#4a3c28'); g.addColorStop(1, '#2a2118');
      cx.fillStyle = g;
      cx.beginPath(); cx.moveTo(-6, -20); cx.lineTo(96, -15); cx.lineTo(96, 15); cx.lineTo(-6, 20); cx.closePath(); cx.fill();
      cx.strokeStyle = '#e8b558'; cx.lineWidth = 3; cx.beginPath(); cx.arc(96, 0, 15.5, -1.5, 1.5); cx.stroke();
      cx.restore();
      /* réglages, lisibles par les deux : c'est un duel d'adresse, pas de secret */
      cx.font = '400 20px "Alfa Slab One", serif'; cx.textAlign = r === 'h' ? 'left' : 'right';
      cx.fillStyle = COUL[r].c2;
      cx.fillText(d.ang[r] + '°  ·  ' + d.pui[r], r === 'h' ? 26 : VW - 26, 212);
      cx.font = '600 14px Jost, sans-serif'; cx.fillStyle = d.pret[r] ? '#7fd68f' : 'rgba(185,154,142,.45)';
      cx.fillText(d.pret[r] ? '● prêt' : '○ règle son tir', r === 'h' ? 26 : VW - 26, 234);
    }

    /* la cible */
    const cible = d.cible;
    cx.strokeStyle = '#e8b558'; cx.lineWidth = 4;
    cx.beginPath(); cx.arc(cible, SOL - 4, 30, Math.PI, 0); cx.stroke();
    cx.strokeStyle = '#c8384a'; cx.lineWidth = 4;
    cx.beginPath(); cx.arc(cible, SOL - 4, 18, Math.PI, 0); cx.stroke();
    cx.fillStyle = '#e8b558'; cx.beginPath(); cx.arc(cible, SOL - 4, 6, 0, 6.3); cx.fill();
    cx.fillStyle = '#3d2a1c'; cx.fillRect(cible - 34, SOL - 2, 68, 8);

    /* les boulets */
    if (d.vol) {
      const el = t - d.vol.t0;
      if (el >= 0) for (const r of ['h', 'g']) {
        const v = d.vol[r], f = Math.min(el / (1000 / 60), v.duree / (1000 / 60));
        const x = v.x0 + v.vx * f, y = v.y0 - (v.vy * f - v.g * f * f / 2);
        cx.strokeStyle = COUL[r].c + '55'; cx.lineWidth = 2;
        cx.beginPath();
        for (let k = 0; k <= f; k += 4) {
          const xx = v.x0 + v.vx * k, yy = v.y0 - (v.vy * k - v.g * k * k / 2);
          k ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy);
        }
        cx.stroke();
        artiste(x, y, r, 0.8, undefined, f * 0.04 * v.sens);
      }
    }
    /* les impacts de la manche */
    for (const r of ['h', 'g']) {
      if (d.imp[r] === undefined) continue;
      cx.fillStyle = COUL[r].c2;
      cx.beginPath(); cx.moveTo(d.imp[r], SOL + 8); cx.lineTo(d.imp[r] - 7, SOL + 24); cx.lineTo(d.imp[r] + 7, SOL + 24); cx.closePath(); cx.fill();
    }

    cx.font = '400 15px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#b99a8e';
    cx.fillText('Manche ' + (d.m + 1) + ' / ' + this.MANCHES, VW / 2, 196);
    cx.font = '400 26px "Alfa Slab One", serif';
    cx.fillStyle = COUL.h.c2; cx.textAlign = 'right'; cx.fillText(String(d.pts.h), VW / 2 - 24, 200);
    cx.fillStyle = '#b99a8e'; cx.textAlign = 'center'; cx.fillText('–', VW / 2, 200);
    cx.fillStyle = COUL.g.c2; cx.textAlign = 'left'; cx.fillText(String(d.pts.g), VW / 2 + 24, 200);
  }
}
,

/* =========================================================
   NUMÉRO 5 — LES MASSUES  (le rythme croisé)
   Les massues traversent la piste. Chacun rattrape les siennes.
   ========================================================= */
jon: {
  nom: 'Les Massues',
  genre: 'duo',
  sous: 'Rattrape au bon instant, renvoie sans réfléchir.',
  consigne: () => 'Appuie EXACTEMENT quand une massue arrive dans tes mains. Elles vont accélérer.',
  DUREE: 62000, FEN: 175, HOLD: 260,
  XH: 250, XG: 750, YM: 386,

  init() {
    const t = tps() + 1500;
    st.d = { t0: t, vies: 3, passes: 0, seq: 1, fini: 0, cl: [{ id: 1, de: 'h', vers: 'g', t0: t, duree: 1600 }] };
  },

  action(qui, a) {
    const d = st.d;
    if (a.k !== 'att') return;
    const c = d.cl.find(x => x.id === a.id);
    if (!c || c.vers !== qui || c.pris) return;
    const err = Math.abs(a.err || 0);
    if (err > this.FEN) { this.rate(c, 'trop ' + ((a.err || 0) < 0 ? 'tôt' : 'tard')); return; }
    c.pris = 1;
    const arr = c.t0 + c.duree;
    d.passes++;
    const nd = Math.max(620, c.duree * 0.962);
    d.cl = d.cl.filter(x => x.id !== c.id);
    d.cl.push({ id: ++d.seq, de: c.vers, vers: c.de, t0: arr + this.HOLD, duree: nd });
    diffuse();
  },

  rate(c, pourquoi) {
    const d = st.d;
    c.rate = tps();
    d.cl = d.cl.filter(x => x.id !== c.id);
    d.vies--;
    toast('Massue tombée (' + pourquoi + ') — ' + Math.max(0, d.vies) + ' vie(s)');
    if (d.vies <= 0) { this.termine(); return; }
    /* on la relance depuis le sol, un peu plus lente */
    tard(() => {
      d.cl.push({ id: ++d.seq, de: c.de, vers: c.vers, t0: tps() + 900, duree: Math.min(1700, c.duree * 1.10) });
      diffuse();
    }, 1200);
    diffuse();
  },

  tick() {
    if (!hote) return;
    const d = st.d, t = tps(), el = t - d.t0;
    if (d.fini) return;
    /* nouvelles massues */
    const veut = el > 34000 ? 4 : el > 20000 ? 3 : el > 9000 ? 2 : 1;
    if (d.cl.length < veut) {
      d.cl.push({ id: ++d.seq, de: d.cl.length % 2 ? 'g' : 'h', vers: d.cl.length % 2 ? 'h' : 'g', t0: t + 700, duree: 1500 });
      diffuse();
    }
    /* massues manquées */
    for (const c of [...d.cl]) {
      if (!c.pris && t > c.t0 + c.duree + this.FEN + 60 + (solo ? 0 : rtt)) { this.rate(c, 'pas rattrapée'); return; }
    }
    if (el > this.DUREE) this.termine();
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1;
    purge();
    const d = st.d, complet = tps() - d.t0 >= this.DUREE;
    const p = Math.min(18, Math.round(d.passes / 2.2)) + (complet ? 4 : 0);
    tard(() => finActe(
      complet ? 'Le numéro tient !' : 'Massues au sol',
      d.passes + ' passe(s) réussie(s).', p, p), 800);
  },

  /* la massue la plus proche de mes mains, si elle m'est destinée */
  ma(t) {
    let best = null, bd = 1e9;
    for (const c of st.d.cl) {
      if (c.vers !== moi || c.pris) continue;
      const dd = Math.abs(t - (c.t0 + c.duree));
      if (dd < bd) { bd = dd; best = c; }
    }
    return best && bd < 900 ? { c: best, err: t - (best.t0 + best.duree) } : null;
  },

  cmd() {
    return `<button class="gros-bouton ${moi === 'h' ? 'rouge' : 'bleu'}" data-a="att">RATTRAPER</button>`;
  },
  bouton(k) {
    if (k !== 'att') return;
    const m = this.ma(tps());
    if (!m) { toast('Rien dans tes mains…'); return; }
    jouer({ k: 'att', id: m.c.id, err: m.err });
  },
  touche(e) { if (e.code === 'Space' || e.code === 'Enter') this.bouton('att'); },

  pos(c, t) {
    const u = clamp((t - c.t0) / c.duree, 0, 1);
    const x0 = c.de === 'h' ? this.XH : this.XG, x1 = c.vers === 'h' ? this.XH : this.XG;
    return { x: lerp(x0, x1, u), y: this.YM - 4 * 190 * u * (1 - u), u };
  },

  dessine(t) {
    const d = st.d;
    /* les deux jongleurs */
    const mainH = d.cl.some(c => c.vers === 'h' && Math.abs(t - (c.t0 + c.duree)) < 260);
    const mainG = d.cl.some(c => c.vers === 'g' && Math.abs(t - (c.t0 + c.duree)) < 260);
    artiste(this.XH, 470, 'h', 1.15, mainH ? -1.5 : -0.9);
    artiste(this.XG, 470, 'g', 1.15, mainG ? -1.5 : -0.9);

    /* trajectoires fantômes */
    cx.strokeStyle = 'rgba(232,181,88,.10)'; cx.lineWidth = 2;
    for (const c of d.cl) {
      cx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = k / 24, x = lerp(c.de === 'h' ? this.XH : this.XG, c.vers === 'h' ? this.XH : this.XG, u);
        const y = this.YM - 4 * 190 * u * (1 - u);
        k ? cx.lineTo(x, y) : cx.moveTo(x, y);
      }
      cx.stroke();
    }

    for (const c of d.cl) {
      if (t < c.t0 - 40) continue;
      const p = this.pos(c, t);
      const rot = (t - c.t0) / 150;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(rot);
      cx.fillStyle = '#f7e9d2';
      cx.beginPath(); cx.moveTo(0, -22); cx.quadraticCurveTo(9, 0, 5, 20);
      cx.lineTo(-5, 20); cx.quadraticCurveTo(-9, 0, 0, -22); cx.fill();
      cx.fillStyle = c.vers === 'h' ? COUL.h.c : COUL.g.c;
      cx.beginPath(); cx.arc(0, -20, 7, 0, 6.3); cx.fill();
      cx.restore();

      /* l'anneau de rattrapage : se resserre à l'arrivée */
      const reste = (c.t0 + c.duree) - t;
      if (c.vers === moi && reste < 800 && reste > -this.FEN) {
        const k = clamp(Math.abs(reste) / 800, 0, 1);
        const cxx = c.vers === 'h' ? this.XH : this.XG;
        cx.strokeStyle = Math.abs(reste) < this.FEN ? '#7fd68f' : 'rgba(232,181,88,.8)';
        cx.lineWidth = 3;
        cx.beginPath(); cx.arc(cxx, this.YM, 22 + k * 78, 0, 6.3); cx.stroke();
      }
    }

    coeurs(d.vies, 3);
    cx.textAlign = 'center'; cx.font = '400 30px "Alfa Slab One", serif'; cx.fillStyle = '#e8b558';
    cx.fillText(d.passes + ' passes', VW / 2, 200);
    const reste = Math.max(0, this.DUREE - (t - d.t0));
    minuteur(reste / this.DUREE, (reste / 1000).toFixed(0) + ' s');
  }
}

};

/* ============ le panneau des numéros à questions ============ */
function enroule(txt, maxL) {
  const mots = String(txt).split(' '), lignes = [];
  let l = '';
  for (const m of mots) {
    const essai = l ? l + ' ' + m : m;
    if (cx.measureText(essai).width > maxL && l) { lignes.push(l); l = m; }
    else l = essai;
  }
  if (l) lignes.push(l);
  return lignes;
}

function panneauQuestion(txt, n, N, rep, rev, lire, couleur, bonne) {
  const PX = VW / 2, PY = 300, PL = 720;

  cx.fillStyle = 'rgba(20,7,11,.62)';
  cx.beginPath(); cx.roundRect(PX - PL / 2, 172, PL, 240, 14); cx.fill();
  cx.strokeStyle = 'rgba(232,181,88,.55)'; cx.lineWidth = 2;
  cx.beginPath(); cx.roundRect(PX - PL / 2, 172, PL, 240, 14); cx.stroke();

  cx.textAlign = 'center';
  cx.font = '600 12px Jost, sans-serif'; cx.fillStyle = '#b99a8e';
  cx.fillText('QUESTION ' + (n + 1) + ' / ' + N, PX, 200);

  cx.font = '400 27px "Alfa Slab One", serif'; cx.fillStyle = '#f7e9d2';
  const lignes = enroule(txt, PL - 70);
  const y0 = 246 - (lignes.length - 1) * 18;
  lignes.forEach((l, i) => cx.fillText(l, PX, y0 + i * 36));

  /* les deux réponses */
  for (const r of ['h', 'g']) {
    const x = r === 'h' ? PX - 175 : PX + 175, y = 342;
    const aRepondu = rep && rep[r] !== undefined && rep[r] !== null;
    cx.font = '600 13px Jost, sans-serif'; cx.fillStyle = COUL[r].c2;
    cx.fillText((st.nm[r] || (r === 'h' ? 'Artiste 1' : 'Artiste 2')) + (r === moi ? ' (toi)' : ''), x, y - 22);
    cx.fillStyle = rev ? (couleur || 'rgba(232,181,88,.16)') : 'rgba(0,0,0,.32)';
    cx.globalAlpha = rev ? .22 : 1;
    cx.beginPath(); cx.roundRect(x - 160, y - 12, 320, 44, 8); cx.fill();
    cx.globalAlpha = 1;
    cx.strokeStyle = aRepondu ? COUL[r].c : 'rgba(247,233,210,.14)'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.roundRect(x - 160, y - 12, 320, 44, 8); cx.stroke();
    cx.font = '500 16px Jost, sans-serif';
    if (rev) {
      cx.fillStyle = '#f7e9d2';
      const t = String(lire(r));
      const ls = enroule(t, 300);
      cx.fillText(ls[0] + (ls.length > 1 ? '…' : ''), x, y + 16);
    } else {
      cx.fillStyle = aRepondu ? '#7fd68f' : 'rgba(185,154,142,.5)';
      cx.fillText(aRepondu ? '✓ a répondu' : 'réfléchit…', x, y + 16);
    }
  }

  if (rev && bonne) {
    cx.font = '400 18px "Alfa Slab One", serif'; cx.fillStyle = '#7fd68f';
    cx.fillText('Bonne réponse : ' + bonne, PX, 400);
  }

  artiste(120, 496, 'h', 1, -0.9);
  artiste(VW - 120, 496, 'g', 1, -2.3);
}

/* ============ réagir sans un mot ============ */
let bulles = [];
function emote(e, de) { bulles.push({ e, de, t0: performance.now() }); if (bulles.length > 24) bulles.shift(); }
function envoiEmote(e) { emote(e, moi); if (!solo) envoie({ t: 'EMO', e }); }
function dessineBulles(now) {
  for (const b of bulles) {
    const a = (now - b.t0) / 2600;
    if (a > 1) continue;
    cx.globalAlpha = a < .12 ? a / .12 : 1 - Math.max(0, (a - .68) / .32);
    cx.font = Math.round(30 + a * 16) + 'px system-ui, "Segoe UI Emoji", sans-serif';
    cx.textAlign = 'center';
    cx.fillText(b.e, (b.de === 'h' ? 120 : VW - 120) + Math.sin(a * 7) * 14, 440 - a * 210);
  }
  cx.globalAlpha = 1;
  bulles = bulles.filter(b => now - b.t0 < 2600);
}

/* ============ petits affichages partagés ============ */
function coeurs(v, max) {
  cx.textAlign = 'left'; cx.font = '22px system-ui, "Segoe UI Emoji", sans-serif';
  for (let i = 0; i < max; i++) {
    cx.globalAlpha = i < v ? 1 : .22;
    cx.fillText('❤', 26 + i * 28, 176);
  }
  cx.globalAlpha = 1;
}
function etoiles(n, max, y) {
  cx.textAlign = 'left'; cx.font = '22px system-ui, "Segoe UI Emoji", sans-serif';
  for (let i = 0; i < max; i++) {
    cx.globalAlpha = i < n ? 1 : .2;
    cx.fillText('★', 26 + i * 28, y + 116);
  }
  cx.globalAlpha = 1;
}
function minuteur(k, txt) {
  const x = VW - 200, y = 162;
  cx.fillStyle = 'rgba(0,0,0,.4)'; cx.fillRect(x, y, 174, 12);
  cx.fillStyle = k < .2 ? '#ff5f72' : '#e8b558'; cx.fillRect(x, y, 174 * clamp(k, 0, 1), 12);
  cx.font = '600 13px Jost, sans-serif'; cx.textAlign = 'right'; cx.fillStyle = '#b99a8e';
  cx.fillText(txt, x + 174, y + 30);
}

/* ============ prédiction locale (funambule) ============ */
const L = { incl: 0, vit: 0, av: 0, cumul: 0, der: 0 };
function corrigeFunambule(m) {
  /* l'inclinaison se recale en douceur pour ne pas sauter à l'écran ;
     l'avancée, elle, suit l'hôte au pixel près — elle bouge lentement,
     et c'est elle qui décide de la traversée */
  if (m.dur) { L.incl = m.incl; L.vit = m.vit; }
  else {
    L.incl = lerp(L.incl, m.incl, .35);
    L.vit = lerp(L.vit, m.vit, .35);
  }
  L.av = m.av;
  if (st && st.d) { st.d.vies = m.vies; st.d.noeud = m.noeud; st.d.fini = m.fini; }
}

/* =========================================================
   BOUCLE
   ========================================================= */
const PAS = 1000 / 60, RETARD_MAX = 250, PAS_MAX = 6;
let der = performance.now(), cumul = 0;

function boucle(now) {
  requestAnimationFrame(boucle);
  let dt = now - der; der = now;
  if (dt > RETARD_MAX) dt = PAS;
  cumul += dt;
  let n = 0;
  while (cumul >= PAS && n < PAS_MAX) {
    if (st && st.ph === 'jeu') {
      const a = ACTES[st.acte];
      a.pas?.(PAS / 1000);
      if (hote) a.tick?.(PAS / 1000);
    }
    cumul -= PAS; n++;
  }
  if (cumul > PAS * PAS_MAX) cumul = 0;

  /* rideau */
  ridCible = (!st || st.ph === 'attente' || st.ph === 'annonce' || st.ph === 'bilan' || st.ph === 'fin') ? 1 : 0;
  rid = lerp(rid, ridCible, 0.085);
  if (Math.abs(rid - ridCible) < 0.002) rid = ridCible;

  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  cx.save();
  cx.translate(ox, oy); cx.scale(sc, sc);
  cx.save(); cx.beginPath(); cx.rect(-ox / sc, -oy / sc, VW + 2 * ox / sc, VH + 2 * oy / sc); cx.clip();

  fond(now);                       /* le décor vit sur l'horloge locale */
  if (st && st.ph === 'jeu') { cx.textAlign = 'left'; ACTES[st.acte].dessine(tps()); }
  majConfettis(1 / 60);
  dessineBulles(now);
  rideaux(rid);
  cx.restore();
  cx.restore();
}
requestAnimationFrame(boucle);

/* =========================================================
   RENDU DOM
   ========================================================= */
let sigCmd = '', vuActe = '', vuPh = '';
function rendu() {
  if (!st) return;
  if (st.ph === 'fin') { ecranFin(); return; }
  if (st.demarree) ecran('e-piste'); else { majCoulisses(); return; }

  /* changement de numéro ou de phase : on remet les commandes et la
     simulation locale à zéro (l'invité ne passe jamais par init()) */
  if (st.acte !== vuActe || st.ph !== vuPh) {
    vuActe = st.acte; vuPh = st.ph; sigCmd = '';
    entrees = { h: 0, g: 0 };
    if (st.acte === 'fun' && st.ph === 'jeu') {
      L.incl = st.d.incl || 0; L.vit = st.d.vit || 0; L.av = st.d.av || 0;
    }
  }

  $('#p1').textContent = st.sc.h;
  $('#p2').textContent = st.sc.g;
  $('#n1').textContent = (st.nm.h || 'Artiste 1') + (moi === 'h' ? ' (toi)' : '');
  $('#n2').textContent = (st.nm.g || 'Artiste 2') + (moi === 'g' ? ' (toi)' : '');
  $('#num-lab').textContent = 'Numéro ' + (st.i + 1) + ' / ' + st.total;
  $('#num-nom').textContent = nomActe(st.acte);

  const a = ACTES[st.acte];

  $('#num-genre').textContent = GENRES[a.genre] || '';
  $('#num-genre').className = 'chip ' + (a.genre || 'duo');

  if (st.ph === 'annonce') {
    $('#rideau-txt').hidden = false;
    $('#rt-titre').textContent = 'Numéro ' + (st.i + 1) + ' — ' + a.nom;
    $('#rt-sous').textContent = (GENRES[a.genre] ? GENRES[a.genre] + ' · ' : '') + a.sous;
    $('#b-suite').hidden = true;
    $('#consigne').textContent = a.sous;
    $('#cmd').innerHTML = ''; sigCmd = '';
  } else if (st.ph === 'bilan') {
    const b = st.bilan;
    $('#rideau-txt').hidden = false;
    $('#rt-titre').textContent = b ? b.titre : '';
    $('#rt-sous').textContent = (b ? b.sous + ' ' : '') + (!b ? '' :
      b.ph === b.pg
        ? (b.ph ? '+' + b.ph + ' ★ chacun.' : 'Aucune étoile cette fois.')
        : '+' + b.ph + ' ★ pour ' + (st.nm.h || 'Artiste 1') + ', +' + b.pg + ' ★ pour ' + (st.nm.g || 'Artiste 2') + '.');
    $('#b-suite').hidden = false;
    $('#b-suite').textContent = st.i + 1 >= st.total ? 'Le salut final ★' : 'Numéro suivant →';
    $('#cmd').innerHTML = ''; sigCmd = '';
  } else {
    $('#rideau-txt').hidden = true;
    $('#consigne').textContent = a.consigne();
    const d = st.d;
    /* on ne reconstruit les commandes que si leur contenu change vraiment :
       sinon on casserait un curseur en plein glissement */
    const sig = [
      st.acte, st.ph, moi,
      d.n ?? '', d.m ?? '', d.sujet ?? '',
      d.rev ? 1 : 0,
      d.rep && d.rep[moi] !== undefined ? 1 : 0,
      d.pret && d.pret[moi] ? 1 : 0,
      d.vol ? 1 : 0,
      st.acte === 'tra' ? (d.taps && d.taps[moi] !== undefined ? 1 : 0) + (d.anim ? 2 : 0) : ''
    ].join('|');
    if (sig !== sigCmd) { sigCmd = sig; $('#cmd').innerHTML = a.cmd ? a.cmd() : ''; }
  }

  $('#emobar').hidden = false;
  $('#bascule').hidden = !solo;
  if (solo) $('#switch-nom').textContent = moi === 'h' ? (st.nm.h || 'Artiste 1') : 'Artiste 2';
}

/* ---------- commandes ---------- */
const cmdEl = $('#cmd');
cmdEl.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (b && !b.disabled) ACTES[st.acte].bouton?.(b.dataset.a);
});
cmdEl.addEventListener('input', e => {
  const r = e.target.closest('[data-r]');
  if (r) ACTES[st.acte].curseur?.(r.dataset.r, +r.value);
});
/* boutons « à maintenir » */
const presse = v => { const b = cmdEl.querySelector('[data-h]'); if (b) maintien(v); };
cmdEl.addEventListener('pointerdown', e => { if (e.target.closest('[data-h]')) { e.target.setPointerCapture?.(e.pointerId); presse(1); } });
window.addEventListener('pointerup', () => presse(0));
window.addEventListener('pointercancel', () => presse(0));
window.addEventListener('blur', () => presse(0));

/* ---------- clavier ---------- */
const saisie = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
window.addEventListener('keydown', e => {
  if (saisie(e)) { if (e.key === 'Enter' && e.target.id === 'code') $('#b-entrer').click(); return; }
  if (e.key === 'Tab' && solo) {
    e.preventDefault();
    moi = moi === 'h' ? 'g' : 'h'; autre = moi === 'h' ? 'g' : 'h';
    sigCmd = ''; rendu(); toast('Tu joues : ' + (moi === 'h' ? (st.nm.h || 'Artiste 1') : 'Artiste 2'));
    return;
  }
  if (!st || st.ph !== 'jeu') return;
  if (e.code === 'Space') e.preventDefault();
  if (cmdEl.querySelector('[data-h]') && (e.code === 'Space' || e.code === 'Enter')) { if (!e.repeat) maintien(1); return; }
  ACTES[st.acte].touche?.(e);
});
window.addEventListener('keyup', e => {
  if (saisie(e)) return;
  if (cmdEl.querySelector('[data-h]') && (e.code === 'Space' || e.code === 'Enter')) maintien(0);
});

$('#b-switch').addEventListener('click', () => {
  moi = moi === 'h' ? 'g' : 'h'; autre = moi === 'h' ? 'g' : 'h';
  sigCmd = ''; rendu();
});

/* ---------- les emotes : se répondre sans se parler ---------- */
$('#emobar').addEventListener('click', e => {
  const b = e.target.closest('[data-e]');
  if (b) envoiEmote(b.dataset.e);
});

/* en solo, l'hôte joue aussi le rôle de l'invité : pas de réseau du tout */

/* ?numero=tra|fun|ass|can|jon|mir : va droit à un numéro, seul, pour le revoir */
if (typeof location !== 'undefined') {
  const ap = new URLSearchParams(location.search).get('numero');
  if (ap && ORDRE.includes(ap)) {
    solo = true; hote = true; moi = 'h'; autre = 'g';
    st = neuf(); st.nm.h = 'Artiste 1'; st.nm.g = 'Artiste 2';
    st.demarree = true; st.i = ORDRE.indexOf(ap); st.acte = ap; st.ph = 'jeu';
    ACTES[ap].init(); rid = 0; ridCible = 0;
    ecran('e-piste'); rendu();
  }
}
