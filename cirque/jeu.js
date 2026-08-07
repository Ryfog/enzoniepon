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
const PREFIXE = 'cirque-es-';

const VW = 1000, VH = 620;          // piste virtuelle (tout est dessiné dedans)
const ORDRE = ['tra', 'fun', 'ass', 'can', 'jon', 'mir'];

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

/* le maximum théorique est de 104 étoiles par artiste, soit 208 à deux */
function ecranFin() {
  const tot = st.sc.h + st.sc.g;
  $('#fin-t').textContent = tot >= 155 ? 'Standing ovation' : tot >= 95 ? 'Le public en redemande' : 'Rideau';
  $('#fin-sc').innerHTML =
    `<div><small>${esc(st.nm.h || 'Artiste 1')}</small><b>${st.sc.h}</b></div>` +
    `<div><small>Ensemble</small><b>${tot}</b></div>` +
    `<div><small>${esc(st.nm.g || 'Artiste 2')}</small><b>${st.sc.g}</b></div>`;
  $('#fin-p').textContent = tot >= 155
    ? 'Six numéros sans filet, et pas une chute qui compte. Le chapiteau est à vous.'
    : tot >= 95
      ? 'Une belle représentation. On rallume les projecteurs quand vous voulez.'
      : 'La troupe débute. Une deuxième représentation et ce sera autre chose.';
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
      if (d.vies <= 0) { d.fini = 1; this.termine(); return; }
      toast('Chute ! Il reste ' + d.vies + ' vie' + (d.vies > 1 ? 's' : '') + '.');
      this.corrige(true);
    }
    if (L.av > d.noeud + 240) { d.noeud = Math.floor(L.av / 240) * 240; this.corrige(true); }
    if (L.av >= 720) { d.fini = 2; this.termine(); return; }
    if (tps() - (d.derCor || 0) > 400) { d.derCor = tps(); this.corrige(false); }
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
   NUMÉRO 3 — LES ASSIETTES  (l'information partagée)
   Un seul tient la baguette. L'AUTRE voit les compteurs.
   ========================================================= */
ass: {
  nom: 'Les Assiettes',
  sous: 'Celui qui voit ne touche pas. Celui qui touche ne voit pas.',
  consigne() {
    const b = this.baguette();
    return b === moi
      ? 'Tu tiens la BAGUETTE : clique les assiettes. Tu ne vois pas les compteurs — écoute l\'autre.'
      : 'Tu vois les COMPTEURS. Dis à l\'autre quelle assiette relancer, vite.';
  },
  DUREE: 64000,
  XS: [155, 296, 437, 578, 719, 860],

  init() {
    const t = tps();
    st.d = {
      t0: t, vies: 3, tombees: 0, relances: 0,
      a: [0, 1, 2].map(i => ({ i, v: 1, t0: t, on: 1, chute: 0 }))
    };
  },
  baguette() { return Math.floor((tps() - st.d.t0) / 9000) % 2 ? 'g' : 'h'; },
  taux() { return 0.000060 * (1 + (tps() - st.d.t0) / 46000); },
  niveau(p) { return p.on ? clamp(p.v - (tps() - p.t0) * this.taux(), 0, 1) : 0; },

  action(qui, a) {
    if (a.k !== 'sp' || st.d.fini) return;
    if (qui !== this.baguette()) return;             /* seule la baguette relance */
    const p = st.d.a.find(x => x.i === a.i);
    if (!p || !p.on) return;
    if (this.niveau(p) > 0.93) return;                /* pas de spam inutile */
    p.v = 1; p.t0 = tps(); st.d.relances++;
    diffuse();
  },

  clic(x, y) {
    for (const p of st.d.a) {
      if (!p.on) continue;
      const px = this.XS[p.i];
      if (Math.abs(x - px) < 62 && y > 250 && y < 470) { jouer({ k: 'sp', i: p.i }); return; }
    }
  },
  touche(e) {
    const n = '&é"\'(-'.indexOf(e.key);
    const m = '123456'.indexOf(e.key);
    const i = m >= 0 ? m : n;
    if (i >= 0) jouer({ k: 'sp', i });
  },

  tick() {
    if (!hote || st.d.fini) return;
    const d = st.d, el = tps() - d.t0;
    /* on ajoute une assiette toutes les 13 s, jusqu'à 6 */
    const veut = Math.min(6, 3 + Math.floor(el / 13000));
    if (d.a.length < veut) {
      while (d.a.length < veut) d.a.push({ i: d.a.length, v: 1, t0: tps(), on: 1, chute: 0 });
      toast('Une assiette de plus !'); diffuse();
    }
    for (const p of d.a) {
      if (p.on && this.niveau(p) <= 0) {
        p.on = 0; p.chute = tps(); d.tombees++; d.vies--;
        toast('Une assiette au sol !');
        if (d.vies <= 0) { this.termine(); return; }
        tard(() => { p.on = 1; p.v = 1; p.t0 = tps(); diffuse(); }, 5000);
        diffuse();
      }
    }
    if (el > this.DUREE && d.vies > 0) this.termine();
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1;
    purge();
    const d = st.d, fini = tps() - d.t0 >= this.DUREE;
    const p = fini ? 6 + d.vies * 3 : d.vies * 2 + Math.round((tps() - d.t0) / 8000);
    tard(() => finActe(
      fini ? 'Numéro terminé !' : 'Tout s\'est brisé',
      d.tombees + ' assiette(s) au sol, ' + d.relances + ' relance(s).',
      p, p), 800);
  },

  cmd() {
    const b = this.baguette();
    if (b !== moi) return `<p class="etiq">Tu es les yeux. Parle vite : <b>1</b> à <b>6</b> de gauche à droite.</p>`;
    return `<p class="etiq">Tu as la baguette — clique les assiettes (ou touches 1 à 6)</p>`;
  },

  dessine(t) {
    const d = st.d, b = this.baguette(), jeVois = b !== moi;
    const chg = 9000 - ((t - d.t0) % 9000);

    /* bandeau baguette */
    cx.textAlign = 'center'; cx.font = '400 22px "Alfa Slab One", serif';
    cx.fillStyle = COUL[b].c2;
    cx.fillText('🥢 ' + (st.nm[b] || (b === 'h' ? 'Artiste 1' : 'Artiste 2')) + ' tient la baguette', VW / 2, 168);
    cx.font = '400 14px Jost, sans-serif'; cx.fillStyle = '#b99a8e';
    cx.fillText('elle change dans ' + (chg / 1000).toFixed(1) + ' s', VW / 2, 190);

    for (const p of d.a) {
      const x = this.XS[p.i], base = 470, hp = 152, ty = base - hp;
      /* la perche */
      cx.strokeStyle = '#6b4b2c'; cx.lineWidth = 5; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(x, base); cx.lineTo(x, ty); cx.stroke();
      cx.fillStyle = 'rgba(0,0,0,.35)';
      cx.beginPath(); cx.ellipse(x, base + 3, 20, 5, 0, 0, 6.3); cx.fill();
      /* le numéro de la perche : c'est par là qu'on se les désigne à voix haute */
      cx.font = '400 20px "Alfa Slab One", serif'; cx.textAlign = 'center';
      cx.fillStyle = 'rgba(43,15,22,.85)';
      cx.fillText(String(p.i + 1), x, base + 30);

      if (!p.on) {
        /* les débris */
        cx.fillStyle = 'rgba(247,233,210,.45)';
        for (let k = 0; k < 7; k++) {
          const a = k * 1.1 + p.i;
          cx.beginPath(); cx.arc(x + Math.cos(a) * (16 + k * 4), base - 2 + Math.sin(a) * 4, 3, 0, 6.3); cx.fill();
        }
        continue;
      }

      const e = this.niveau(p);
      const vac = (1 - e) * 0.42;
      const tilt = Math.sin(t * (0.006 + (1 - e) * 0.012) + p.i) * vac;

      cx.save(); cx.translate(x, ty); cx.rotate(tilt);
      cx.save(); cx.scale(1, 0.30);
      const g = cx.createRadialGradient(0, 0, 4, 0, 0, 46);
      g.addColorStop(0, '#fffaf0'); g.addColorStop(.7, '#efe0c8'); g.addColorStop(1, '#c9b391');
      cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, 46, 0, 6.3); cx.fill();
      cx.strokeStyle = e < 0.3 ? '#ff5f72' : '#c8384a'; cx.lineWidth = e < 0.3 ? 9 : 6;
      cx.beginPath(); cx.arc(0, 0, 40, 0, 6.3); cx.stroke();
      cx.restore();
      cx.restore();

      if (jeVois) {
        const pc = Math.round(e * 100);
        cx.font = '400 26px "Alfa Slab One", serif'; cx.textAlign = 'center';
        cx.fillStyle = e < 0.25 ? '#ff5f72' : e < 0.5 ? '#e8b558' : '#7fd68f';
        cx.fillText(pc + '%', x, ty - 40);
        /* petite barre */
        cx.fillStyle = 'rgba(0,0,0,.4)'; cx.fillRect(x - 30, ty - 30, 60, 7);
        cx.fillStyle = e < 0.25 ? '#ff5f72' : e < 0.5 ? '#e8b558' : '#7fd68f';
        cx.fillRect(x - 30, ty - 30, 60 * e, 7);
      } else if (e < 0.22) {
        cx.font = '400 26px "Alfa Slab One", serif'; cx.textAlign = 'center'; cx.fillStyle = '#ff5f72';
        cx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 0.015); cx.fillText('!', x, ty - 40); cx.globalAlpha = 1;
      }
    }

    /* les deux artistes au sol */
    artiste(this.XS[0] - 92, 496, 'h', 0.9, b === 'h' ? -1.2 : -0.4);
    artiste(this.XS[5] + 92, 496, 'g', 0.9, b === 'g' ? -1.9 : -2.7);

    coeurs(d.vies, 3);
    const reste = Math.max(0, this.DUREE - (t - d.t0));
    minuteur(reste / this.DUREE, (reste / 1000).toFixed(0) + ' s');
  }
},

/* =========================================================
   NUMÉRO 4 — L'HOMME-CANON  (chacun sa moitié de la réponse)
   L'un voit le filet et règle l'angle. L'autre ne voit que la
   jauge de poudre. Aucun des deux ne peut viser seul.
   ========================================================= */
can: {
  nom: 'L\'Homme-Canon',
  sous: 'Toi l\'angle, moi la poudre. Parlez-vous.',
  consigne() {
    return moi === 'h'
      ? 'Tu vois le FILET et tu règles l\'ANGLE. Tu ne vois pas la poudre : demande-la.'
      : 'Tu règles la POUDRE. Tu ne vois pas où est le filet : demande à l\'autre.';
  },
  CIBLES: 3, TIRS: 5,

  init() {
    st.d = { c: 0, tir: 0, ang: 45, pui: 50, pret: {}, vol: null, imp: [], gagnees: 0, cible: this.tire(), fini: 0, dep: tps() };
  },
  /* personne n'appuie sur PRÊT : on ne reste pas coincé indéfiniment */
  tick() {
    if (!hote || st.d.fini || st.d.vol) return;
    if (tps() - st.d.dep > 120000) this.termine();
  },
  tire() { return 400 + Math.round(Math.random() * 480); },

  action(qui, a) {
    const d = st.d;
    if (d.vol) return;
    if (a.k === 'ang' && qui === 'h') { d.ang = clamp(a.v, 18, 72); diffuse(); }
    else if (a.k === 'pui' && qui === 'g') { d.pui = clamp(a.v, 0, 100); diffuse(); }
    else if (a.k === 'pret') {
      if (a.t !== undefined && a.t !== d.tir) return;   /* PRÊT en retard d'un tir */
      d.pret[qui] = 1;
      if (d.pret.h && d.pret.g) this.feu(); else diffuse();
    }
  },

  feu() {
    const d = st.d;
    d.pret = {}; d.tir++; d.dep = tps();
    const g = 0.30, v0 = 3.4 + d.pui * 0.135, a = d.ang * Math.PI / 180;
    const vx = Math.cos(a) * v0, vy = Math.sin(a) * v0;
    const duree = (2 * vy / g) * (1000 / 60);
    const portee = vx * (2 * vy / g);
    d.vol = { t0: tps() + 350, duree, vx, vy, g, x0: 176, y0: 452, chute: 176 + portee };
    const ecart = Math.abs(d.vol.chute - d.cible);
    d.vol.ok = ecart <= 36;
    confettis(14, 176, 452);
    diffuse();
    tard(() => {
      d.imp.push({ x: d.vol.chute, ok: d.vol.ok });
      if (d.vol.ok) confettis(70, d.cible, 440);
      const ok = d.vol.ok;
      d.vol = null;
      if (ok) {
        d.gagnees++;
        toast('Dans le filet ! 🎯');
        if (d.c + 1 >= this.CIBLES) return this.termine();
        d.c++; d.tir = 0; d.cible = this.tire(); d.imp = []; d.ang = 45; d.pui = 50;
      } else if (d.tir >= this.TIRS) {
        toast('Filet manqué. On change de place.');
        if (d.c + 1 >= this.CIBLES) return this.termine();
        d.c++; d.tir = 0; d.cible = this.tire(); d.imp = [];
      }
      diffuse();
    }, 350 + duree + 1100);
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1;
    const p = st.d.gagnees * 5;
    tard(() => finActe('L\'homme-canon', st.d.gagnees + ' filet(s) atteint(s) sur ' + this.CIBLES + '.', p, p), 700);
  },

  cmd() {
    const d = st.d;
    if (moi === 'h') {
      return `<p class="etiq">Angle du canon</p>
        <input class="curseur" type="range" min="18" max="72" value="${d.ang}" data-r="ang">
        <button class="gros-bouton rouge" data-a="pret">PRÊT</button>`;
    }
    return `<p class="etiq">Poudre</p>
      <input class="curseur" type="range" min="0" max="100" value="${d.pui}" data-r="pui">
      <button class="gros-bouton bleu" data-a="pret">PRÊT</button>`;
  },
  bouton(k) { if (k === 'pret') jouer({ k: 'pret', t: st.d.tir }); },
  curseur(r, v) { jouer({ k: r, v }); },
  touche(e) { if (e.code === 'Space') this.bouton('pret'); },

  dessine(t) {
    const d = st.d, SOL = 452;
    /* le canon */
    const a = d.ang * Math.PI / 180;
    cx.save(); cx.translate(140, SOL + 6);
    cx.fillStyle = '#4b3524'; cx.beginPath(); cx.arc(0, 0, 30, Math.PI, 0); cx.fill();
    cx.fillStyle = '#2f2117'; cx.fillRect(-34, 0, 68, 10);
    cx.rotate(-a);
    const g = cx.createLinearGradient(0, -20, 0, 20);
    g.addColorStop(0, '#8f7a56'); g.addColorStop(.5, '#4a3c28'); g.addColorStop(1, '#2a2118');
    cx.fillStyle = g;
    cx.beginPath(); cx.moveTo(-6, -20); cx.lineTo(96, -15); cx.lineTo(96, 15); cx.lineTo(-6, 20); cx.closePath(); cx.fill();
    cx.strokeStyle = '#e8b558'; cx.lineWidth = 3; cx.beginPath(); cx.arc(96, 0, 15.5, -1.5, 1.5); cx.stroke();
    cx.restore();

    /* le filet — visible seulement par l'artiste 1 */
    if (moi === 'h' || st.ph !== 'jeu') {
      const x = d.cible;
      cx.strokeStyle = '#e8b558'; cx.lineWidth = 4;
      cx.beginPath(); cx.moveTo(x - 46, SOL - 34); cx.lineTo(x - 40, SOL + 6);
      cx.moveTo(x + 46, SOL - 34); cx.lineTo(x + 40, SOL + 6); cx.stroke();
      cx.strokeStyle = 'rgba(247,233,210,.55)'; cx.lineWidth = 1.4;
      for (let i = 0; i <= 8; i++) {
        cx.beginPath(); cx.moveTo(x - 46 + i * 11.5, SOL - 34); cx.lineTo(x - 40 + i * 10, SOL + 6); cx.stroke();
      }
      for (let j = 0; j <= 4; j++) {
        const yy = SOL - 34 + j * 10;
        cx.beginPath(); cx.moveTo(x - 46 + j * 1.5, yy); cx.lineTo(x + 46 - j * 1.5, yy); cx.stroke();
      }
      cx.font = '400 14px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#e8b558';
      cx.fillText('le filet', x, SOL - 46);
    } else {
      cx.font = '400 15px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(185,154,142,.7)';
      cx.fillText('— tu ne vois pas le filet d\'ici —', VW / 2, 250);
    }

    /* les impacts */
    for (const im of d.imp) {
      cx.fillStyle = im.ok ? '#7fd68f' : 'rgba(247,233,210,.45)';
      cx.beginPath(); cx.moveTo(im.x, SOL + 8); cx.lineTo(im.x - 7, SOL + 22); cx.lineTo(im.x + 7, SOL + 22); cx.closePath(); cx.fill();
      if (moi === 'h') {
        const dd = Math.round(im.x - d.cible);
        cx.font = '600 13px Jost, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#b99a8e';
        cx.fillText((dd > 0 ? '+' : '') + dd, im.x, SOL + 38);
      }
    }

    /* le boulet humain */
    if (d.vol) {
      const el = t - d.vol.t0;
      if (el >= 0) {
        const f = Math.min(el / (1000 / 60), d.vol.duree / (1000 / 60));
        const x = d.vol.x0 + d.vol.vx * f;
        const y = d.vol.y0 - (d.vol.vy * f - d.vol.g * f * f / 2);
        artiste(x, y, moi === 'h' ? 'g' : 'h', 0.85, undefined, f * 0.05);
        /* la traînée */
        cx.strokeStyle = 'rgba(255,226,168,.35)'; cx.lineWidth = 2;
        cx.beginPath();
        for (let k = 0; k <= f; k += 4) {
          const xx = d.vol.x0 + d.vol.vx * k, yy = d.vol.y0 - (d.vol.vy * k - d.vol.g * k * k / 2);
          k ? cx.lineTo(xx, yy) : cx.moveTo(xx, yy);
        }
        cx.stroke();
      }
    }

    /* la jauge de poudre — visible seulement par l'artiste 2 */
    if (moi === 'g' || st.ph !== 'jeu') {
      const bx = 120, by = 250;
      cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(bx, by, 34, 150);
      cx.fillStyle = '#e8b558'; cx.fillRect(bx, by + 150 - 150 * d.pui / 100, 34, 150 * d.pui / 100);
      cx.strokeStyle = 'rgba(247,233,210,.4)'; cx.strokeRect(bx, by, 34, 150);
      cx.font = '400 24px "Alfa Slab One", serif'; cx.textAlign = 'center'; cx.fillStyle = '#e8b558';
      cx.fillText(d.pui, bx + 17, by - 12);
      cx.font = '400 12px Jost, sans-serif'; cx.fillStyle = '#b99a8e';
      cx.fillText('POUDRE', bx + 17, by + 168);
    }
    /* l'angle — visible seulement par l'artiste 1 */
    if (moi === 'h' || st.ph !== 'jeu') {
      cx.font = '400 24px "Alfa Slab One", serif'; cx.textAlign = 'left'; cx.fillStyle = '#e8b558';
      cx.fillText(d.ang + '°', 108, 250);
      cx.font = '400 12px Jost, sans-serif'; cx.fillStyle = '#b99a8e';
      cx.fillText('ANGLE', 108, 268);
    }

    /* qui est prêt */
    cx.textAlign = 'center'; cx.font = '600 16px Jost, sans-serif';
    cx.fillStyle = d.pret.h ? COUL.h.c2 : 'rgba(185,154,142,.35)';
    cx.fillText('● ' + (st.nm.h || 'A1'), VW / 2 - 95, 248);
    cx.fillStyle = d.pret.g ? COUL.g.c2 : 'rgba(185,154,142,.35)';
    cx.fillText('● ' + (st.nm.g || 'A2'), VW / 2 + 95, 248);

    cx.font = '400 15px Jost, sans-serif'; cx.fillStyle = '#b99a8e';
    cx.fillText('Filet ' + (d.c + 1) + '/' + this.CIBLES + ' · tir ' + Math.min(d.tir + 1, this.TIRS) + '/' + this.TIRS, VW / 2, 214);
    etoiles(d.gagnees, this.CIBLES, 60);
  }
},

/* =========================================================
   NUMÉRO 5 — LES MASSUES  (le rythme croisé)
   Les massues traversent la piste. Chacun rattrape les siennes.
   ========================================================= */
jon: {
  nom: 'Les Massues',
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
},

/* =========================================================
   NUMÉRO 6 — LE MIROIR DU MAGICIEN  (la mémoire à deux voix)
   La formule s'affiche à moitié pour l'un, à moitié pour l'autre.
   ========================================================= */
mir: {
  nom: 'Le Miroir',
  sous: 'Chacun ne voit que la moitié de la formule.',
  consigne() {
    const d = st.d;
    if (d.f === 'montre') return 'Retiens les symboles que TU vois. L\'autre voit les autres. Dites-les à voix haute.';
    if (d.f === 'joue') return (this.tour() === moi ? 'À TOI : clique le symbole n°' + (d.pos + 1) + '.' : 'À l\'autre de jouer. Dicte-lui ce que tu as vu.');
    return '…';
  },
  SYM: ['⭐', '🎩', '🐘', '🤹', '🎈', '🦁', '🥁', '🎪'],
  MANCHES: [4, 6, 8],
  XS: [140, 245, 350, 455, 560, 665, 770, 875],
  YS: 470,

  init() { st.d = { m: 0, vies: 3, reussies: 0, seq: [], pos: 0, f: 'attente', k: 0, t0: 0, fini: 0 }; this.manche(); },

  manche() {
    const d = st.d, n = this.MANCHES[d.m];
    d.seq = Array.from({ length: n }, () => Math.floor(Math.random() * 8));
    d.pos = 0; d.k = -1; d.f = 'montre'; d.t0 = tps();
    diffuse();
    const pas = 950;
    for (let i = 0; i < n; i++) tard(() => { d.k = i; diffuse(); }, 600 + i * pas);
    tard(() => { d.k = -1; d.f = 'joue'; d.tj = tps(); diffuse(); }, 600 + n * pas + 400);
  },

  tour() { return st.d.pos % 2 === 0 ? 'h' : 'g'; },

  action(qui, a) {
    const d = st.d;
    if (a.k !== 'sym' || d.f !== 'joue') return;
    if (qui !== this.tour()) return;
    /* le réseau peut livrer deux fois le même clic : on refuse ce qui
       ne concerne plus la position en cours, sinon un double-clic coûte une vie */
    if (a.p !== undefined && a.p !== d.pos) return;
    if (a.i === d.seq[d.pos]) {
      d.pos++; d.tj = tps();
      if (d.pos >= d.seq.length) {
        d.reussies++; d.f = 'gagne'; confettis(80, VW / 2, 300); diffuse();
        tard(() => { if (d.m + 1 >= this.MANCHES.length) this.termine(); else { d.m++; this.manche(); } }, 2000);
      } else diffuse();
    } else this.echoue('Formule brisée.');
  },

  echoue(txt) {
    const d = st.d;
    if (d.f !== 'joue') return;
    d.vies--; d.f = 'rate'; diffuse();
    toast(txt + ' Il reste ' + Math.max(0, d.vies) + ' essai(s).');
    tard(() => {
      if (d.vies <= 0 || d.m + 1 >= this.MANCHES.length) return this.termine();
      d.m++; this.manche();
    }, 2000);
  },

  /* si celui dont c'est le tour ne joue jamais, on ne bloque pas le spectacle */
  tick() {
    if (!hote || st.d.fini) return;
    if (st.d.f === 'joue' && tps() - (st.d.tj || 0) > 90000) this.echoue('Trop long !');
  },

  pose(i) {
    if (st.d.f !== 'joue' || this.tour() !== moi) return;
    if (tps() - (this.der || 0) < 350) return;      /* anti-rebond local */
    this.der = tps();
    jouer({ k: 'sym', i, p: st.d.pos });
  },
  clic(x, y) {
    for (let i = 0; i < 8; i++) {
      if (Math.abs(x - this.XS[i]) < 48 && Math.abs(y - this.YS) < 48) { this.pose(i); return; }
    }
  },
  touche(e) {
    const i = '12345678'.indexOf(e.key);
    if (i >= 0) this.pose(i);
  },

  termine() {
    if (st.d.fini) return; st.d.fini = 1;
    purge();
    const p = st.d.reussies * 6 + st.d.vies * 2;
    tard(() => finActe('Le miroir', st.d.reussies + ' formule(s) sur ' + this.MANCHES.length + '.', p, p), 600);
  },

  cmd() {
    if (st.d.f === 'joue') return `<p class="etiq">Clique un symbole (ou touches 1 à 8)</p>`;
    return `<p class="etiq">Regarde bien…</p>`;
  },

  dessine(t) {
    const d = st.d;

    /* le grand miroir */
    cx.save();
    cx.translate(VW / 2, 268);
    const g = cx.createLinearGradient(0, -150, 0, 150);
    g.addColorStop(0, 'rgba(120,180,200,.20)'); g.addColorStop(1, 'rgba(40,20,40,.55)');
    cx.fillStyle = g;
    cx.beginPath(); cx.ellipse(0, 0, 190, 150, 0, 0, 6.3); cx.fill();
    cx.lineWidth = 12; cx.strokeStyle = '#e8b558';
    cx.beginPath(); cx.ellipse(0, 0, 190, 150, 0, 0, 6.3); cx.stroke();
    cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,240,200,.5)';
    cx.beginPath(); cx.ellipse(0, 0, 178, 138, 0, 0, 6.3); cx.stroke();
    cx.restore();

    /* le symbole en cours d'affichage */
    if (d.f === 'montre' && d.k >= 0) {
      const pourMoi = (d.k % 2 === 0 ? 'h' : 'g') === moi;
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      if (pourMoi) {
        const age = 1;
        cx.font = '96px system-ui, "Segoe UI Emoji", sans-serif';
        cx.globalAlpha = age; cx.fillText(this.SYM[d.seq[d.k]], VW / 2, 262); cx.globalAlpha = 1;
      } else {
        cx.font = '400 84px "Alfa Slab One", serif'; cx.fillStyle = 'rgba(185,154,142,.35)';
        cx.fillText('?', VW / 2, 268);
      }
      cx.textBaseline = 'alphabetic';
      cx.font = '400 15px Jost, sans-serif'; cx.fillStyle = pourMoi ? '#e8b558' : '#b99a8e';
      cx.fillText(pourMoi ? 'symbole ' + (d.k + 1) + ' — POUR TOI' : 'symbole ' + (d.k + 1) + ' — pour l\'autre', VW / 2, 356);
    }
    if (d.f === 'joue' || d.f === 'gagne' || d.f === 'rate') {
      /* la formule en train de se reconstituer */
      const n = d.seq.length, larg = Math.min(64, 520 / n);
      for (let i = 0; i < n; i++) {
        const x = VW / 2 + (i - (n - 1) / 2) * larg, y = 266;
        const fait = i < d.pos || d.f === 'gagne';
        cx.fillStyle = fait ? 'rgba(232,181,88,.9)' : 'rgba(0,0,0,.35)';
        cx.beginPath(); cx.roundRect(x - larg / 2 + 3, y - 24, larg - 6, 48, 6); cx.fill();
        if (fait) {
          cx.textAlign = 'center'; cx.textBaseline = 'middle';
          cx.font = Math.round(larg * 0.55) + 'px system-ui, "Segoe UI Emoji", sans-serif';
          cx.fillText(this.SYM[d.seq[i]], x, y);
          cx.textBaseline = 'alphabetic';
        } else {
          cx.fillStyle = i === d.pos ? COUL[this.tour()].c2 : 'rgba(185,154,142,.4)';
          cx.font = '600 20px Jost, sans-serif'; cx.textAlign = 'center';
          cx.fillText(String(i + 1), x, y + 7);
        }
      }
      if (d.f === 'joue') {
        cx.font = '400 22px "Alfa Slab One", serif'; cx.textAlign = 'center';
        cx.fillStyle = COUL[this.tour()].c2;
        cx.fillText('à ' + (st.nm[this.tour()] || (this.tour() === 'h' ? 'Artiste 1' : 'Artiste 2')), VW / 2, 356);
      }
      if (d.f === 'gagne') { cx.font = '400 34px "Alfa Slab One", serif'; cx.fillStyle = '#7fd68f'; cx.textAlign = 'center'; cx.fillText('FORMULE COMPLÈTE', VW / 2, 200); }
      if (d.f === 'rate') { cx.font = '400 34px "Alfa Slab One", serif'; cx.fillStyle = '#ff9aa8'; cx.textAlign = 'center'; cx.fillText('RATÉ', VW / 2, 200); }
    }

    /* le pupitre de symboles */
    const actif = d.f === 'joue' && this.tour() === moi;
    for (let i = 0; i < 8; i++) {
      const x = this.XS[i], y = this.YS;
      cx.fillStyle = actif ? 'rgba(232,181,88,.16)' : 'rgba(0,0,0,.30)';
      cx.beginPath(); cx.roundRect(x - 44, y - 42, 88, 84, 10); cx.fill();
      cx.strokeStyle = actif ? '#e8b558' : 'rgba(247,233,210,.16)'; cx.lineWidth = 2;
      cx.beginPath(); cx.roundRect(x - 44, y - 42, 88, 84, 10); cx.stroke();
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.globalAlpha = actif ? 1 : .45;
      cx.font = '42px system-ui, "Segoe UI Emoji", sans-serif';
      cx.fillText(this.SYM[i], x, y - 4);
      cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
      cx.font = '600 12px Jost, sans-serif'; cx.fillStyle = 'rgba(185,154,142,.6)';
      cx.fillText(String(i + 1), x, y + 34);
    }

    coeurs(d.vies, 3);
    cx.font = '400 15px Jost, sans-serif'; cx.textAlign = 'left'; cx.fillStyle = '#b99a8e';
    cx.fillText('Formule ' + (d.m + 1) + ' / ' + this.MANCHES.length + ' · ' + d.seq.length + ' symboles', 26, 206);
  }
}

};

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
  /* correction douce, sauf après une chute où l'on recale sec */
  if (m.dur) { L.incl = m.incl; L.vit = m.vit; L.av = m.av; }
  else {
    L.incl = lerp(L.incl, m.incl, .3);
    L.vit = lerp(L.vit, m.vit, .3);
    L.av = lerp(L.av, m.av, .3);
  }
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

  if (st.ph === 'annonce') {
    $('#rideau-txt').hidden = false;
    $('#rt-titre').textContent = 'Numéro ' + (st.i + 1) + ' — ' + a.nom;
    $('#rt-sous').textContent = a.sous;
    $('#b-suite').hidden = true;
    $('#consigne').textContent = a.sous;
    $('#cmd').innerHTML = ''; sigCmd = '';
  } else if (st.ph === 'bilan') {
    $('#rideau-txt').hidden = false;
    $('#rt-titre').textContent = st.bilan ? st.bilan.titre : '';
    $('#rt-sous').textContent = (st.bilan ? st.bilan.sous + ' ' : '') +
      (st.bilan && st.bilan.ph ? '+' + st.bilan.ph + ' ★ chacun.' : 'Aucune étoile cette fois.');
    $('#b-suite').hidden = false;
    $('#b-suite').textContent = st.i + 1 >= st.total ? 'Le salut final ★' : 'Numéro suivant →';
    $('#cmd').innerHTML = ''; sigCmd = '';
  } else {
    $('#rideau-txt').hidden = true;
    $('#consigne').textContent = a.consigne();
    const sig = [
      st.acte, st.ph, moi, st.d.f || '',
      st.acte === 'ass' ? a.baguette() : '',
      st.acte === 'can' ? st.d.c : '',
      st.acte === 'tra' ? (st.d.taps && st.d.taps[moi] !== undefined ? 1 : 0) + (st.d.anim ? 2 : 0) : ''
    ].join('|');
    if (sig !== sigCmd) { sigCmd = sig; $('#cmd').innerHTML = a.cmd ? a.cmd() : ''; }
  }

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
