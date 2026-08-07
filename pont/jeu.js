/* =========================================================
   LE PONT — qui connaît le mieux l'autre ?
   ---------------------------------------------------------
   Treize questions. Selon le type, l'un répond pour lui et
   l'autre devine, ou les deux répondent en même temps.
   Chaque point pose une planche : à la fin, le pont se ferme
   et vous vous retrouvez dessus — plus ou moins loin de chez
   vous selon qui a le mieux deviné.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const melange = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const PREFIXE = 'pont-es-';

/* ---- le programme de la nuit : qui est le sujet de chaque question ---- */
const PROGRAMME = [
  { t: 'dev', s: 'h' }, { t: 'ens' }, { t: 'oui', s: 'g' }, { t: 'dev', s: 'g' },
  { t: 'dix', s: 'h' }, { t: 'ens' }, { t: 'oui', s: 'h' }, { t: 'dev', s: 'h' },
  { t: 'ens' }, { t: 'oui', s: 'g' }, { t: 'dix', s: 'g' }, { t: 'dev', s: 'g' },
  { t: 'oui', s: 'h' }
];
const LIBELLE = { dev: 'Devine ma réponse', ens: 'En même temps', oui: 'Oui ou non', dix: 'Sur dix' };
const LIMITE = 70000;

/* ---- anti-répétition d'une soirée à l'autre ---- */
const CLE = 'pont_hist';
let HIST = {};
try { HIST = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { HIST = {}; }
function tirer(cat, arr) {
  let vus = HIST[cat] || [];
  let libres = arr.map((_, i) => i).filter(i => !vus.includes(i));
  if (libres.length < 2) { vus = []; libres = arr.map((_, i) => i); }
  const i = pick(libres);
  vus.push(i); HIST[cat] = vus;
  try { localStorage.setItem(CLE, JSON.stringify(HIST)); } catch (e) {}
  return arr[i];
}

/* ============ ÉTAT ============ */
let peer = null, conn = null, hote = false, moi = 'h', autre = 'g', solo = false;
let st = null, codeSalon = '', monChoix = null;
let boucleRetour = null, essais = 0, garde = null, chronos = [];
/* Les planches se déduisent du score partagé, pas d'un compte local :
   sinon le pont ne se construirait que sur l'écran de l'hôte.
   On garde juste l'instant d'arrivée de chacune, pour l'animation. */
let poses = { h: [], g: [] };

const neuf = () => ({
  demarree: false, ph: 'attente', n: 0, total: PROGRAMME.length,
  q: null, rep: { h: null, g: null }, rev: null,
  sc: { h: 0, g: 0 }, nm: { h: '', g: '' }, t0: 0, premier: 0
});

const prog = () => PROGRAMME[st.n];
const sujet = () => prog().s;
const devineur = () => (prog().s === 'h' ? 'g' : 'h');
const nom = r => st.nm[r] || (r === 'h' ? 'Rive rose' : 'Rive bleue');

/* ============ RÉSEAU ============ */
function envoie(m) { if (conn && conn.open) conn.send(m); }

/* tant que la question n'est pas révélée, on ne transmet que « a répondu » */
function etatPublic() {
  const p = JSON.parse(JSON.stringify(st));
  if (p.ph === 'question') p.rep = { h: st.rep.h !== null ? 1 : 0, g: st.rep.g !== null ? 1 : 0 };
  return p;
}
function diffuse() { envoie({ t: 'S', st: etatPublic() }); rendu(); }

function brancher(c) {
  if (conn && conn !== c) { conn.remplacee = true; try { conn.close(); } catch (e) {} }
  conn = c;
  c.on('data', recois);
  c.on('close', () => { if (!c.remplacee) { toast('Le fil s\'est coupé — on rattrape…'); relance(); } });
  c.on('error', () => { if (!c.remplacee) relance(); });
}

function recois(m) {
  switch (m.t) {
    case 'S': {
      const avantN = st ? st.n : -1, avantPh = st ? st.ph : '';
      st = m.st;
      if (st.ph === 'question' && (st.n !== avantN || avantPh !== 'question')) monChoix = null;
      rendu();
      break;
    }
    case 'A': if (hote) repond(autre, m.v); break;
    case 'KA': break;
    case 'HELLO':
      st.nm[autre] = m.nom || 'Mon amour';
      envoie({ t: 'WELCOME', nom: st.nm[moi] });
      if (!st.demarree) { ecran('e-attente'); majAttente(); }
      diffuse();
      break;
    case 'WELCOME':
      st.nm[autre] = m.nom || 'Mon amour';
      if (!st.demarree) { ecran('e-attente'); majAttente(); }
      break;
    case 'PING': envoie({ t: 'PONG' }); break;
  }
}

function surveille() {
  clearInterval(garde);
  garde = setInterval(() => { if (conn && conn.open) envoie({ t: 'KA' }); else relance(); }, 10000);
}
function relance() {
  if (hote || !codeSalon || boucleRetour) return;
  essais = 0;
  boucleRetour = setInterval(() => {
    if (conn && conn.open) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnecté 💛'); return; }
    if (++essais > 25) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnexion impossible. Recharge la page.'); return; }
    try {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      const c = peer.connect(PREFIXE + codeSalon, { reliable: true });
      brancher(c);
      c.on('open', () => envoie({ t: 'HELLO', nom: monNom() }));
    } catch (e) {}
  }, 2500);
}

/* ============ RIVES ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
const monNom = () => $('#nom').value.trim() || 'Moi';
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
  erreur('On allume…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => { erreur(''); $('#code-geant').textContent = code; ecran('e-attente'); majAttente(); });
  peer.on('connection', c => {
    brancher(c);
    c.on('open', () => { surveille(); if (st.demarree) diffuse(); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-ouvrir').click(); }
    else erreur('Impossible d\'allumer ta rive. Réessaie.');
  });
});

$('#b-entrer').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres du code.'); return; }
  hote = false; moi = 'g'; autre = 'h'; codeSalon = code; solo = false;
  st = neuf(); st.nm.g = monNom();
  erreur('On traverse…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); surveille(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Rive introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Rive introuvable. Vérifie le code.'));
});

$('#b-seul').addEventListener('click', () => {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf(); st.nm.h = monNom(); st.nm.g = 'Elle';
  $('#b-copier').hidden = true;
  ecran('e-attente'); $('#code-geant').textContent = '····';
  majAttente();
});

$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
$('#b-copier').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-geant').textContent.trim())
    .then(() => toast('Code copié')).catch(() => {});
});

function majAttente() {
  $('#nm1').textContent = st.nm.h || '—';
  $('#nm2').textContent = st.nm.g || '—';
  const pret = solo || !!(st.nm.h && st.nm.g);
  $('#attente-txt').textContent = pret
    ? (solo ? 'Tu tiens les deux rives — utilise le bouton en bas pour changer.' : 'Les deux rives sont allumées.')
    : 'On attend l\'autre lumière…';
  $('#b-commencer').hidden = !(pret && hote);
}
$('#b-commencer').addEventListener('click', () => { if (hote) demarre(); });
$('#b-rejouer').addEventListener('click', () => {
  if (!hote) { toast('C\'est à ' + nom('h') + ' de relancer.'); return; }
  demarre();
});

/* ============ DÉROULÉ ============ */
function purge() { chronos.forEach(clearTimeout); chronos = []; }
function tard(f, ms) { const id = setTimeout(f, ms); chronos.push(id); return id; }

function demarre() {
  purge();
  const noms = st.nm;
  st = neuf(); st.nm = noms; st.demarree = true;
  poses = { h: [], g: [] }; tFin = 0;
  ecran('e-jeu');
  pose();
}

function pose() {
  purge();
  const p = PROGRAMME[st.n];
  const q = { t: p.t, s: p.s || null };
  if (p.t === 'dev') { const d = tirer('dev', DEVINE); q.txt = d[0]; q.opts = melange(d[1]); }
  else if (p.t === 'ens') q.txt = tirer('ens', ENSEMBLE);
  else if (p.t === 'oui') q.txt = tirer('oui', OUINON);
  else if (p.t === 'dix') q.txt = tirer('dix', SURDIX);
  st.q = q; st.rep = { h: null, g: null }; st.rev = null;
  st.ph = 'question'; st.t0 = Date.now(); st.premier = 0;
  monChoix = null;
  diffuse();
  tard(() => {
    if (st.ph !== 'question') return;
    for (const r of ['h', 'g']) if (st.rep[r] === null) st.rep[r] = -1;
    verifie();
  }, LIMITE);
}

function repond(qui, v) {
  if (!hote || st.ph !== 'question' || st.rep[qui] !== null) return;
  st.rep[qui] = v;
  if (st.rep.h !== null && st.rep.g !== null) { verifie(); return; }
  st.premier = Date.now();
  diffuse();
  /* le premier a répondu : l'autre a trente secondes, pas la nuit entière */
  tard(() => {
    if (st.ph !== 'question') return;
    for (const r of ['h', 'g']) if (st.rep[r] === null) st.rep[r] = -1;
    verifie();
  }, 30000);
}

function joue(v) {
  if (st.ph !== 'question' || monChoix !== null) return;
  monChoix = v;
  if (hote) repond(moi, v); else { envoie({ t: 'A', v }); rendu(); }
}

/* ---------- le décompte des points ---------- */
function verifie() {
  if (st.rev) return;
  purge();
  const q = st.q, r = st.rep;
  const gagne = { h: 0, g: 0 };
  let titre = '', sous = '';

  if (q.t === 'ens') {
    const ok = r.h === r.g && r.h !== -1;
    if (ok) { gagne.h = gagne.g = 2; titre = 'Vous avez dit la même chose'; sous = 'Deux planches, une de chaque côté.'; }
    else { titre = 'Pas d\'accord'; sous = nom('h') + ' a dit ' + lire('h') + ', ' + nom('g') + ' a dit ' + lire('g') + '.'; }
  } else {
    const s = q.s, d = s === 'h' ? 'g' : 'h';
    if (q.t === 'dix') {
      const ecart = (r[s] === -1 || r[d] === -1) ? 99 : Math.abs(r[s] - r[d]);
      const pts = ecart === 0 ? 4 : ecart === 1 ? 3 : ecart === 2 ? 2 : ecart === 3 ? 1 : 0;
      gagne[d] = pts;
      titre = ecart === 0 ? 'Pile dessus' : ecart <= 2 ? 'Tout près' : 'À côté';
      sous = nom(s) + ' a mis ' + lire(s) + ' — ' + nom(d) + ' avait dit ' + lire(d) + '.';
    } else {
      const ok = r[s] === r[d] && r[s] !== -1;
      gagne[d] = ok ? 3 : 0;
      titre = ok ? nom(d) + ' a deviné' : nom(d) + ' s\'est trompé';
      sous = nom(s) + ' a répondu : ' + lire(s) + '.';
    }
  }

  st.sc.h += gagne.h; st.sc.g += gagne.g;
  st.rev = { titre, sous, gagne };
  st.ph = 'revele';
  diffuse();

  tard(() => {
    if (st.n + 1 >= st.total) { st.ph = 'fin'; diffuse(); ecranFin(); return; }
    st.n++; pose();
  }, 4600);
}

/* la réponse d'un joueur, en toutes lettres */
function lire(r) {
  const q = st.q, v = st.rep[r];
  if (v === null) return '…';
  if (v === -1) return 'rien';
  if (q.t === 'dev') return q.opts[v];
  if (q.t === 'ens') return nom(v === 0 ? 'h' : 'g');
  if (q.t === 'oui') return v === 0 ? 'Oui' : 'Non';
  return String(v);
}

/* ============ TOAST ============ */
let toastId = null;
function toast(txt) {
  const el = $('#toast'); el.textContent = txt; el.hidden = false;
  clearTimeout(toastId); toastId = setTimeout(() => { el.hidden = true; }, 2600);
}

/* =========================================================
   LE DÉCOR
   ========================================================= */
const cv = $('#cv'), cx = cv.getContext('2d');
const VW = 1000, VH = 600;
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

const ETOILES = Array.from({ length: 90 }, () => ({
  x: Math.random() * VW, y: Math.random() * 300,
  r: 0.5 + Math.random() * 1.5, p: Math.random() * 6.3
}));
const EAU = Array.from({ length: 34 }, (_, i) => ({ y: 400 + i * 6, p: Math.random() * 6.3, l: 40 + Math.random() * 200 }));

const RIVE_G = 150, RIVE_D = 850, PONT_Y = 392;
const MAX_PLANCHES = 22;                 /* le maximum qu'un côté peut poser */

function decor(now) {
  /* le ciel */
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#150c22'); g.addColorStop(.45, '#2a1a3d'); g.addColorStop(.62, '#4b2b47');
  g.addColorStop(.72, '#2a1a30'); g.addColorStop(1, '#120a1a');
  cx.fillStyle = g; cx.fillRect(-400, -300, VW + 800, VH + 600);

  /* les étoiles */
  for (const e of ETOILES) {
    cx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(now * 0.0011 + e.p));
    cx.fillStyle = '#f6ecdf';
    cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, 6.3); cx.fill();
  }
  cx.globalAlpha = 1;

  /* la lune, décalée pour laisser le milieu à la question */
  const LX = 806, LY = 92;
  const lg = cx.createRadialGradient(LX, LY, 6, LX, LY, 92);
  lg.addColorStop(0, 'rgba(246,236,223,.42)'); lg.addColorStop(1, 'rgba(246,236,223,0)');
  cx.fillStyle = lg; cx.beginPath(); cx.arc(LX, LY, 92, 0, 6.3); cx.fill();
  cx.fillStyle = '#f6ecdf'; cx.beginPath(); cx.arc(LX, LY, 24, 0, 6.3); cx.fill();
  cx.fillStyle = '#241636'; cx.beginPath(); cx.arc(LX + 10, LY - 6, 22, 0, 6.3); cx.fill();

  /* l'eau */
  cx.fillStyle = 'rgba(10,6,16,.55)'; cx.fillRect(-400, 404, VW + 800, VH);
  for (const o of EAU) {
    const x = VW / 2 + Math.sin(now * 0.0006 + o.p) * 90;
    cx.globalAlpha = 0.05 + 0.05 * Math.sin(now * 0.0013 + o.p);
    cx.strokeStyle = '#f6ecdf'; cx.lineWidth = 1.4;
    cx.beginPath(); cx.moveTo(x - o.l / 2, o.y); cx.lineTo(x + o.l / 2, o.y); cx.stroke();
  }
  cx.globalAlpha = 1;

  /* les deux rives */
  for (const [x, dir, r] of [[RIVE_G, -1, 'h'], [RIVE_D, 1, 'g']]) {
    cx.fillStyle = '#1c1128';
    cx.beginPath();
    cx.moveTo(x, PONT_Y + 6);
    cx.lineTo(x + dir * 340, PONT_Y + 6);
    cx.lineTo(x + dir * 340, VH + 60);
    cx.lineTo(x - dir * 10, VH + 60);
    cx.closePath(); cx.fill();
    /* la lanterne de la rive */
    const col = r === 'h' ? '232,130,155' : '127,176,216';
    const bat = 1 + Math.sin(now * 0.0022 + (r === 'h' ? 0 : 1.6)) * 0.12;
    const lg2 = cx.createRadialGradient(x + dir * 26, PONT_Y - 54, 3, x + dir * 26, PONT_Y - 54, 120 * bat);
    lg2.addColorStop(0, `rgba(${col},.42)`); lg2.addColorStop(1, `rgba(${col},0)`);
    cx.fillStyle = lg2; cx.beginPath(); cx.arc(x + dir * 26, PONT_Y - 54, 120 * bat, 0, 6.3); cx.fill();
    cx.strokeStyle = 'rgba(246,236,223,.35)'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(x + dir * 26, PONT_Y + 4); cx.lineTo(x + dir * 26, PONT_Y - 44); cx.stroke();
    cx.fillStyle = `rgb(${col})`;
    cx.beginPath(); cx.arc(x + dir * 26, PONT_Y - 52, 8, 0, 6.3); cx.fill();
  }
}

/* ---------- le pont ---------- */
const comptePlanches = r => poses[r].length;

/* on rattrape le score : chaque point gagné devient une planche qui tombe.
   Si l'écart est gros (on vient de rejoindre en cours de partie), on pose
   tout d'un coup au lieu de faire défiler vingt planches. */
function majPoses(now) {
  for (const r of ['h', 'g']) {
    const n = st && st.demarree ? st.sc[r] : 0;
    if (poses[r].length > n) poses[r].length = n;              /* nouvelle partie */
    const manque = n - poses[r].length;
    if (manque <= 0) continue;
    if (manque > 5) { while (poses[r].length < n) poses[r].push(now - 500); }
    else { let d = 0; while (poses[r].length < n) poses[r].push(now + (d++) * 110); }
  }
}

function pont(now) {
  const demi = (RIVE_D - RIVE_G) / 2;
  const larg = demi / MAX_PLANCHES;
  for (const [r, dir, x0] of [['h', 1, RIVE_G], ['g', -1, RIVE_D]]) {
    poses[r].forEach((t, i) => {
      const age = clamp((now - t) / 380, 0, 1);
      if (age <= 0) return;
      const x = x0 + dir * (i * larg);
      const y = PONT_Y - (1 - age) * 60;
      cx.globalAlpha = age;
      cx.fillStyle = i % 2 ? '#5c4030' : '#6b4c38';
      cx.fillRect(Math.min(x, x + dir * larg) + 1, y, larg - 2, 9);
      cx.fillStyle = 'rgba(246,236,223,.13)';
      cx.fillRect(Math.min(x, x + dir * larg) + 1, y, larg - 2, 2);
      cx.globalAlpha = 1;
    });
    /* le pilier de la rive */
    cx.fillStyle = '#3a2836';
    cx.fillRect(x0 - 5, PONT_Y, 10, 50);
  }
}

/* ---------- les deux silhouettes ---------- */
function silhouette(x, y, r, k) {
  const col = r === 'h' ? '#e8829b' : '#7fb0d8';
  cx.save(); cx.translate(x, y);
  cx.fillStyle = 'rgba(0,0,0,.3)';
  cx.beginPath(); cx.ellipse(0, 2, 11, 3, 0, 0, 6.3); cx.fill();
  cx.strokeStyle = col; cx.lineWidth = 4; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-3, -14); cx.lineTo(-5, 0); cx.moveTo(3, -14); cx.lineTo(5, 0); cx.stroke();
  cx.fillStyle = col;
  cx.beginPath(); cx.moveTo(-8, -13); cx.lineTo(-6, -36); cx.lineTo(6, -36); cx.lineTo(8, -13); cx.closePath(); cx.fill();
  cx.strokeStyle = col; cx.lineWidth = 3.5;
  const bras = k ? -1.1 : -0.3;                      /* bras tendus au moment de se rejoindre */
  cx.beginPath();
  cx.moveTo(-5, -32); cx.lineTo(-5 - Math.cos(bras) * 13, -32 - Math.sin(bras) * 13);
  cx.moveTo(5, -32); cx.lineTo(5 + Math.cos(bras) * 13, -32 - Math.sin(bras) * 13);
  cx.stroke();
  cx.fillStyle = col; cx.beginPath(); cx.arc(0, -43, 7, 0, 6.3); cx.fill();
  cx.restore();
}

/* ---------- la question, en grand au milieu de la nuit ---------- */
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

function question() {
  const q = st.q;
  if (!q || (st.ph !== 'question' && st.ph !== 'revele')) return;
  const jeSuisSujet = q.t === 'ens' || q.s === moi;

  cx.textAlign = 'center';
  /* à qui s'adresse la question */
  cx.font = '600 12px Karla, sans-serif';
  cx.fillStyle = q.t === 'ens' ? '#f0c274' : jeSuisSujet ? '#f0c274' : (sujet() === 'h' ? '#e8829b' : '#7fb0d8');
  cx.fillText(q.t === 'ens' ? 'TOUS LES DEUX' : (jeSuisSujet ? 'TOI' : nom(sujet()).toUpperCase()), VW / 2, 216);

  cx.font = 'italic 400 30px "Cormorant Garamond", serif';
  cx.fillStyle = '#f6ecdf';
  const lignes = enroule(q.txt, 660);
  const y0 = 258 - (lignes.length - 1) * 19;
  lignes.forEach((l, i) => cx.fillText(l, VW / 2, y0 + i * 38));

  if (q.t === 'dix') {
    cx.font = '400 12px Karla, sans-serif'; cx.fillStyle = 'rgba(168,148,180,.8)';
    cx.fillText('0 = pas du tout   ·   10 = complètement', VW / 2, y0 + lignes.length * 38 + 6);
  }
}

let tFin = 0;
function scene(now) {
  if (!st || !st.demarree) return;
  question();
  majPoses(now);
  pont(now);

  const demi = (RIVE_D - RIVE_G) / 2, larg = demi / MAX_PLANCHES;
  const boutH = RIVE_G + comptePlanches('h') * larg;
  const boutG = RIVE_D - comptePlanches('g') * larg;

  if (st.ph === 'fin') {
    /* on se rejoint : chacun marche jusqu'au bout de ce qu'il a construit */
    if (!tFin) tFin = now;
    const k = clamp((now - tFin) / 2600, 0, 1);
    const doux = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const point = (boutH + boutG) / 2;
    silhouette(lerp(RIVE_G, Math.min(boutH, point), doux), PONT_Y, 'h', k > .9);
    silhouette(lerp(RIVE_D, Math.max(boutG, point), doux), PONT_Y, 'g', k > .9);
    if (k > .95) {
      cx.globalAlpha = clamp((k - .95) / .05, 0, 1) * (0.6 + 0.4 * Math.sin(now * 0.004));
      cx.font = '30px system-ui, "Segoe UI Emoji", sans-serif'; cx.textAlign = 'center';
      cx.fillText('💛', point, PONT_Y - 64);
      cx.globalAlpha = 1;
    }
    return;
  }
  tFin = 0;
  silhouette(RIVE_G, PONT_Y, 'h', false);
  silhouette(RIVE_D, PONT_Y, 'g', false);

  /* combien de planches il reste avant de se toucher */
  if (st.ph !== 'attente') {
    const reste = Math.max(0, Math.round((boutG - boutH) / larg));
    cx.textAlign = 'center'; cx.font = '400 13px Karla, sans-serif';
    cx.fillStyle = 'rgba(168,148,180,.75)';
    cx.fillText(reste > 0 ? reste + ' planches avant de se toucher' : 'Le pont est joint', VW / 2, PONT_Y + 44);
  }
}

function boucle(now) {
  requestAnimationFrame(boucle);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  cx.save(); cx.translate(ox, oy); cx.scale(sc, sc);
  cx.save(); cx.beginPath(); cx.rect(-ox / sc, -oy / sc, VW + 2 * ox / sc, VH + 2 * oy / sc); cx.clip();
  decor(now);
  scene(now);
  cx.restore(); cx.restore();
}
requestAnimationFrame(boucle);

/* =========================================================
   RENDU DOM
   ========================================================= */
let sigRep = '';
function rendu() {
  if (!st) return;
  if (!st.demarree) { majAttente(); return; }
  if (st.ph === 'fin') { ecranFin(); return; }
  ecran('e-jeu');

  $('#s1').textContent = st.sc.h;
  $('#s2').textContent = st.sc.g;
  $('#n1').textContent = nom('h') + (moi === 'h' ? ' (toi)' : '');
  $('#n2').textContent = nom('g') + (moi === 'g' ? ' (toi)' : '');
  $('#etape').textContent = 'Question ' + (st.n + 1) + ' / ' + st.total;
  $('#genre').textContent = LIBELLE[st.q ? st.q.t : 'dev'];

  const q = st.q;
  if (st.ph === 'revele') {
    $('#revele').hidden = false;
    $('#r-titre').textContent = st.rev.titre;
    $('#r-sous').textContent = st.rev.sous;
    $('#consigne').textContent = q.txt;
    $('#reponses').innerHTML = ''; sigRep = '';
  } else {
    $('#revele').hidden = true;
    const jeSuisSujet = q.t === 'ens' || q.s === moi;
    const dejaLui = st.rep && st.rep[autre];
    $('#consigne').textContent = (q.t === 'ens'
      ? 'Répondez tous les deux : vous marquez si c\'est pareil.'
      : jeSuisSujet
        ? 'C\'est sur toi — réponds sincèrement, ' + nom(devineur()) + ' doit te deviner.'
        : 'Devine ce que ' + nom(sujet()) + ' a répondu.')
      + (monChoix !== null ? '  ·  C\'est envoyé.' : dejaLui ? '  ·  L\'autre a déjà répondu.' : '');

    const sig = [st.n, st.ph, moi, monChoix].join('|');
    if (sig !== sigRep) { sigRep = sig; $('#reponses').className = 'reponses ' + grille(q); $('#reponses').innerHTML = boutons(q); }
  }

  $('#basculer').hidden = !solo;
  if (solo) $('#switch-nom').textContent = nom(moi);
}

const grille = q => q.t === 'dev' ? 'g4' : q.t === 'dix' ? 'g11' : 'g2';

function boutons(q) {
  const pris = monChoix !== null;
  const b = (v, txt, cls) =>
    `<button class="rep ${cls || ''}${monChoix === v ? ' choisi' : ''}" data-v="${v}" ${pris ? 'disabled' : ''}>${esc(txt)}</button>`;
  if (q.t === 'dev') return q.opts.map((o, i) => b(i, o)).join('');
  if (q.t === 'ens') return b(0, nom('h'), 'rose') + b(1, nom('g'), 'bleu');
  if (q.t === 'oui') return b(0, 'Oui', 'rose') + b(1, 'Non', 'bleu');
  return Array.from({ length: 11 }, (_, i) => b(i, String(i), 'chiffre')).join('');
}

function ecranFin() {
  const h = st.sc.h, g = st.sc.g;
  $('#fin-t').textContent = h === g ? 'À égalité parfaite'
    : (nom(h > g ? 'h' : 'g') + ' connaît mieux l\'autre');
  $('#fin-sc').innerHTML =
    `<div class="a"><small>${esc(nom('h'))}</small><b>${h}</b></div>` +
    `<div class="b"><small>${esc(nom('g'))}</small><b>${g}</b></div>`;
  const tot = h + g;
  $('#fin-p').textContent = tot >= 34
    ? 'Le pont est joint bien avant le milieu : vous vous connaissez par cœur.'
    : tot >= 20
      ? 'Le pont tient. Il reste quelques planches à poser — c\'est ce qui reste à découvrir.'
      : 'Le pont est court ce soir. Tant mieux : il vous reste tout à apprendre l\'un de l\'autre.';
  $('#fin-mot').textContent = h === g
    ? '« Vous avez posé exactement le même nombre de planches. »'
    : '« ' + nom(h > g ? 'h' : 'g') + ' a marché plus loin pour aller chercher l\'autre. »';
  ecran('e-fin');
}

/* ---------- entrées ---------- */
$('#reponses').addEventListener('click', e => {
  const b = e.target.closest('[data-v]');
  if (b && !b.disabled) joue(+b.dataset.v);
});
$('#b-switch').addEventListener('click', () => {
  moi = moi === 'h' ? 'g' : 'h'; autre = moi === 'h' ? 'g' : 'h';
  monChoix = st.rep && st.rep[moi] !== null && st.rep[moi] !== undefined ? st.rep[moi] : null;
  sigRep = ''; rendu();
});
const saisie = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
window.addEventListener('keydown', e => {
  if (saisie(e)) { if (e.key === 'Enter' && e.target.id === 'code') $('#b-entrer').click(); return; }
  if (!st || st.ph !== 'question') return;
  if (st.q.t === 'dix') {
    /* 0 à 9 au clavier ; le 10 se clique */
    const v = parseInt(e.key, 10);
    if (!isNaN(v) && e.key.length === 1) joue(v);
    return;
  }
  const n = '123456789'.indexOf(e.key);          /* 1 = premier bouton */
  if (n >= 0) joue(n);
});

/* ?apercu=1 : la nuit et le pont à moitié posé, pour revoir le décor */
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('apercu')) {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf(); st.nm.h = 'Enzo'; st.nm.g = 'Stacy'; st.demarree = true;
  st.sc = { h: 9, g: 6 };
  ecran('e-jeu'); pose();
}
