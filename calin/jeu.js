/* =========================================================
   POUR TOI — cinq petits jeux, un mot à chaque fois.
   Rien de difficile : on ne peut pas perdre, seulement avancer.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---- la lettre, découpée en cinq morceaux ---- */
const LETTRE = [
  'Merci mon amoureuse d\'être dans ma vie.',
  'Tu fais chavirer mon cœur à chaque fois que tu rigoles,',
  'et je n\'arrête pas de compter les jours qui passent — ça me paraît tellement loin avant d\'être dans tes bras.',
  'T\'es une fille en or et je veux pas te perdre.',
  'Alors tg et viens là pour le câlin. 🧸'
];

const JEUX = [
  { id: 'attrape', nom: 'Attrape les cœurs', emoji: '💗',
    regle: 'Bouge le nounours avec ton doigt (ou la souris) et attrape 12 cœurs.',
    aide: 'Attrape-les tous, ils sont pour toi.' },
  { id: 'reveil', nom: 'Réveille le nounours', emoji: '🧸',
    regle: 'Il dort. Tape dessus doucement jusqu\'à ce qu\'il ouvre les yeux.',
    aide: 'Encore… il est du matin difficile, comme quelqu\'un que je connais.' },
  { id: 'memory', nom: 'Le memory des câlins', emoji: '🎀',
    regle: 'Retrouve les six paires. Prends ton temps, personne ne te chronomètre.',
    aide: 'Clique deux cartes pour les retourner.' },
  { id: 'coeur', nom: 'Gonfle le cœur', emoji: '🎈',
    regle: 'Maintiens le bouton pour gonfler le cœur, et lâche quand il remplit le cercle. Trois fois.',
    aide: 'Ni trop petit, ni trop gros. Juste comme il faut.' },
  { id: 'cache', nom: 'Les nounours farceurs', emoji: '🐻',
    regle: 'Ils sortent de leurs cachettes. Attrapes-en 14 avant qu\'ils se recachent.',
    aide: 'Tape dessus dès qu\'un nounours sort !' }
];

/* ---- où elle en est ---- */
const CLE = 'calin_avance';
/* on lit l'adresse UNE fois : ?reset nettoie l'URL juste après */
const PARAMS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
let avance = 0;
try { avance = Math.max(0, Math.min(5, parseInt(localStorage.getItem(CLE) || '0', 10) || 0)); } catch (e) { avance = 0; }
function sauve() { try { localStorage.setItem(CLE, String(avance)); } catch (e) {} }

if (PARAMS.has('reset')) {
  avance = 0; sauve();
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
}

let jeuActif = null, D = {};                 /* le jeu en cours et ses données */

/* =========================================================
   DÉCOR
   ========================================================= */
const cv = $('#cv'), cx = cv.getContext('2d');
let W = 0, H = 0, dpr = 1;
function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}
window.addEventListener('resize', taille);
taille();

const souris = { x: 0, y: 0, actif: false };
cv.addEventListener('pointermove', e => { souris.x = e.clientX; souris.y = e.clientY; souris.actif = true; });
document.addEventListener('pointermove', e => { souris.x = e.clientX; souris.y = e.clientY; });

/* ---------- un petit nounours, dessiné ---------- */
function nounours(x, y, r, poil, dort, bras) {
  const clairs = { '#c98f6a': '#e8c4a8', '#f0a8bb': '#ffd9e6', '#a9836f': '#dcc0ae', '#e6a0a0': '#ffd6d6' };
  const museau = clairs[poil] || '#f4dcc8';
  cx.save(); cx.translate(x, y); cx.scale(r / 40, r / 40);

  /* les bras levés pour un câlin */
  if (bras) {
    cx.strokeStyle = poil; cx.lineWidth = 13; cx.lineCap = 'round';
    cx.beginPath();
    cx.moveTo(-26, 16); cx.lineTo(-42, -12);
    cx.moveTo(26, 16); cx.lineTo(42, -12);
    cx.stroke();
  }
  /* les oreilles */
  cx.fillStyle = poil;
  cx.beginPath(); cx.arc(-27, -27, 13, 0, 6.3); cx.arc(27, -27, 13, 0, 6.3); cx.fill();
  cx.fillStyle = museau;
  cx.beginPath(); cx.arc(-27, -27, 6.5, 0, 6.3); cx.arc(27, -27, 6.5, 0, 6.3); cx.fill();
  /* la tête */
  cx.fillStyle = poil;
  cx.beginPath(); cx.arc(0, 0, 36, 0, 6.3); cx.fill();
  /* le museau */
  cx.fillStyle = museau;
  cx.beginPath(); cx.ellipse(0, 13, 19, 14, 0, 0, 6.3); cx.fill();
  /* les yeux */
  cx.strokeStyle = '#5c3a33'; cx.fillStyle = '#5c3a33'; cx.lineWidth = 3; cx.lineCap = 'round';
  if (dort) {
    cx.beginPath();
    cx.arc(-14, -4, 7, 0.15, Math.PI - 0.15); cx.stroke();
    cx.beginPath();
    cx.arc(14, -4, 7, 0.15, Math.PI - 0.15); cx.stroke();
  } else {
    cx.beginPath(); cx.arc(-14, -5, 4.6, 0, 6.3); cx.arc(14, -5, 4.6, 0, 6.3); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(-12.4, -6.6, 1.7, 0, 6.3); cx.arc(15.6, -6.6, 1.7, 0, 6.3); cx.fill();
  }
  /* le nez et le sourire */
  cx.fillStyle = '#5c3a33';
  cx.beginPath(); cx.ellipse(0, 7, 5.4, 4.2, 0, 0, 6.3); cx.fill();
  cx.strokeStyle = '#5c3a33'; cx.lineWidth = 2.6;
  cx.beginPath(); cx.moveTo(0, 11); cx.lineTo(0, 15);
  cx.moveTo(0, 15); cx.quadraticCurveTo(-7, 21, -11, 14);
  cx.moveTo(0, 15); cx.quadraticCurveTo(7, 21, 11, 14);
  cx.stroke();
  /* les joues */
  cx.fillStyle = 'rgba(255,134,174,.5)';
  cx.beginPath(); cx.arc(-25, 8, 7, 0, 6.3); cx.arc(25, 8, 7, 0, 6.3); cx.fill();
  cx.restore();
}

function coeur(x, y, t, col, angle) {
  cx.save(); cx.translate(x, y); cx.rotate(angle || 0); cx.scale(t / 20, t / 20);
  cx.fillStyle = col || '#ff86ae';
  cx.beginPath();
  cx.moveTo(0, 7);
  cx.bezierCurveTo(-14, -6, -9, -19, 0, -11);
  cx.bezierCurveTo(9, -19, 14, -6, 0, 7);
  cx.closePath(); cx.fill();
  cx.restore();
}

/* ---------- le fond : des cœurs et des nounours qui flottent ---------- */
const POILS = ['#c98f6a', '#f0a8bb', '#a9836f', '#e6a0a0'];
let flotte = [], voile = 0;
function remplitFond() {
  flotte = Array.from({ length: 22 }, (_, i) => ({
    x: Math.random(), y: Math.random(), v: 0.006 + Math.random() * 0.014,
    t: 12 + Math.random() * 26, p: Math.random() * 6.3,
    ours: i % 4 === 0, poil: pick(POILS)
  }));
}
remplitFond();

function fond(now) {
  /* Le château est derrière, en CSS : on ne peint qu'un voile rose.
     Pendant un jeu on l'épaissit, sinon les cœurs roses se perdent
     dans les fleurs roses du décor. */
  voile = lerp(voile, jeuActif ? 1 : 0, 0.05);
  const a = k => (k + voile * 0.34).toFixed(3);
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(255,230,240,${a(.42)})`);
  g.addColorStop(.5, `rgba(255,217,230,${a(.30)})`);
  g.addColorStop(1, `rgba(255,201,221,${a(.46)})`);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  /* un halo clair au centre, pour que les cartes se détachent */
  const v = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .12, W / 2, H / 2, Math.max(W, H) * .72);
  v.addColorStop(0, `rgba(255,247,250,${a(.30)})`); v.addColorStop(1, `rgba(255,180,210,${a(.28)})`);
  cx.fillStyle = v; cx.fillRect(0, 0, W, H);

  for (const f of flotte) {
    const y = ((f.y - now * 0.00001 * f.v * 60) % 1.2 + 1.2) % 1.2 - 0.1;
    const x = f.x * W + Math.sin(now * 0.0007 + f.p) * 22;
    const py = y * (H + 120) - 60;
    cx.globalAlpha = 0.72;
    if (f.ours) nounours(x, py, f.t * 1.1, f.poil, false, false);
    else coeur(x, py, f.t, 'rgba(255,134,174,.75)', Math.sin(now * 0.001 + f.p) * 0.3);
    cx.globalAlpha = 1;
  }
}

/* ---------- confettis de cœurs ---------- */
let pluie = [];
function fete(n, x, y) {
  for (let i = 0; i < n; i++) pluie.push({
    x, y, vx: (Math.random() - .5) * 10, vy: -4 - Math.random() * 9,
    t: 10 + Math.random() * 16, a: Math.random() * 6.3, va: (Math.random() - .5) * .2,
    col: pick(['#ff86ae', '#e6497e', '#ffc2d8', '#f7c66b', '#fff'])
  });
  if (pluie.length > 400) pluie = pluie.slice(-400);
}
function majPluie() {
  for (const p of pluie) { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.a += p.va; }
  pluie = pluie.filter(p => p.y < H + 60);
  for (const p of pluie) coeur(p.x, p.y, p.t, p.col, p.a);
}

/* =========================================================
   ÉCRANS
   ========================================================= */
function ecran(id) { document.querySelectorAll('.ec').forEach(s => s.classList.toggle('on', s.id === id)); }

let bulleId = null;
function bulle(txt) {
  const el = $('#bulle'); el.textContent = txt; el.hidden = false;
  clearTimeout(bulleId); bulleId = setTimeout(() => { el.hidden = true; }, 1800);
}

function majCoeurs() {
  $('#coeurs').innerHTML = JEUX.map((_, i) =>
    `<span class="${i < avance ? 'on' : ''}">💗</span>`).join('');
}

/* ---------- accueil ---------- */
if (avance > 0 && avance < 5) {
  $('#reprise').hidden = false;
  $('#reprise').textContent = 'Tu as déjà gagné ' + avance + ' mot' + (avance > 1 ? 's' : '') + ' — on reprend là où tu t\'es arrêtée.';
} else if (avance >= 5) {
  $('#reprise').hidden = false;
  $('#reprise').textContent = 'Tu as déjà tout gagné — appuie pour relire.';
}

$('#b-go').addEventListener('click', () => {
  if (avance >= 5) { montreLettre(); return; }
  annonce();
});

function annonce() {
  const j = JEUX[avance];
  $('#a-emoji').textContent = j.emoji;
  $('#a-num').textContent = 'Jeu ' + (avance + 1) + ' sur 5';
  $('#a-nom').textContent = j.nom;
  $('#a-regle').textContent = j.regle;
  ecran('e-annonce');
}
$('#b-jouer').addEventListener('click', () => lance(JEUX[avance].id));

/* ---------- fin d'un jeu ---------- */
function gagne() {
  jeuActif = null;
  fete(80, W / 2, H * 0.55);
  $('#mot-txt').textContent = LETTRE[avance];
  avance++; sauve();
  $('#carnet').innerHTML = LETTRE.map((l, i) =>
    i < avance
      ? `<div class="${i === avance - 1 ? 'neuf' : ''}">${i === avance - 1 ? '✨ ' : '💗 '}${echappe(l)}</div>`
      : `<div class="vide">🔒 ・・・・・・</div>`).join('');
  $('#b-suite').textContent = avance >= 5 ? 'Lis la lettre 💌' : 'La suite';
  setTimeout(() => ecran('e-mot'), 700);
}
const echappe = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

$('#b-suite').addEventListener('click', () => {
  if (avance >= 5) montreLettre(); else annonce();
});

function montreLettre() {
  const el = $('#lettre');
  el.classList.remove('tout-vu');
  el.innerHTML = LETTRE.map((l, i) =>
    `<p style="animation-delay:${0.35 + i * 0.75}s">${echappe(l)}</p>`).join('');
  ecran('e-lettre');
  /* si l'animation ne se lance pas (vieux navigateur, onglet en veille…),
     on force l'affichage : c'est la seule chose qu'elle doit voir */
  setTimeout(() => el.classList.add('tout-vu'), 4600);
  for (let i = 0; i < 5; i++) setTimeout(() => fete(14, Math.random() * W, H * 0.7), 400 + i * 700);
}
$('#b-calin').addEventListener('click', () => {
  ecran('e-calin');
  for (let i = 0; i < 8; i++) setTimeout(() => fete(30, W / 2 + (Math.random() - .5) * W * .6, H * .6), i * 180);
});
$('#b-relire').addEventListener('click', montreLettre);

/* =========================================================
   LES CINQ JEUX
   ========================================================= */
function lance(id) {
  jeuActif = id; D = {};
  majCoeurs();
  $('#aide').textContent = JEUX[avance].aide;
  $('#grille').hidden = true; $('#grille').innerHTML = '';
  $('#commande').innerHTML = '';
  ecran('e-jeu');
  ({ attrape: initAttrape, reveil: initReveil, memory: initMemory, coeur: initCoeur, cache: initCache })[id]();
}

/* ---------- 1. attrape les cœurs ---------- */
const BUT_COEURS = 12;
function initAttrape() {
  D = { pris: 0, x: W / 2, tombe: [], prochain: 0 };
  souris.x = W / 2;
  maj();
}
function jeuAttrape(now) {
  D.x = lerp(D.x, clamp(souris.x, 50, W - 50), 0.18);
  if (now > D.prochain) {
    D.prochain = now + 620 + Math.random() * 420;
    D.tombe.push({ x: 60 + Math.random() * (W - 120), y: -40, v: 1.7 + Math.random() * 1.1, t: 20 + Math.random() * 10, a: 0 });
  }
  const solY = H * 0.78;
  for (const c of D.tombe) {
    c.y += c.v; c.a += 0.02;
    if (!c.pris && Math.abs(c.x - D.x) < 52 && Math.abs(c.y - solY) < 46) {
      c.pris = 1; D.pris++;
      fete(10, c.x, c.y);
      maj();
      if (D.pris >= BUT_COEURS) { gagne(); return; }
    }
    if (!c.pris) coeur(c.x, c.y, c.t, '#ff86ae', c.a);
  }
  D.tombe = D.tombe.filter(c => !c.pris && c.y < H + 60);
  nounours(D.x, solY, 52, '#c98f6a', false, true);
}

/* ---------- 2. réveille le nounours ---------- */
const BUT_TAPES = 15;
function initReveil() {
  D = { n: 0, sec: 0 };
  $('#commande').innerHTML = '<button class="bouton-tenir" id="b-tape">Fais-lui un bisou 💋</button>';
  $('#b-tape').addEventListener('click', tape);
  maj();
}
function tape() {
  if (jeuActif !== 'reveil') return;
  D.n++; D.sec = 1;
  fete(6, W / 2 + (Math.random() - .5) * 120, H * 0.5);
  maj();
  if (D.n >= BUT_TAPES) { $('#commande').innerHTML = ''; gagne(); }
}
function jeuReveil(now) {
  const k = D.n / BUT_TAPES;
  const y = H * 0.5 + Math.sin(now * 0.002) * (4 + k * 6);
  D.sec = Math.max(0, D.sec - 0.05);
  nounours(W / 2, y, 92 + D.sec * 8, '#c98f6a', k < 0.75, k > 0.5);
  if (k < 0.75) {
    cx.font = '600 ' + Math.round(26 - k * 12) + 'px Fredoka, sans-serif';
    cx.fillStyle = 'rgba(123,74,85,' + (0.8 - k * 0.7) + ')'; cx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      cx.fillText('z', W / 2 + 78 + i * 22, y - 66 - i * 26 + Math.sin(now * 0.003 + i) * 5);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      coeur(W / 2 + Math.sin(now * 0.002 + i * 2) * 90, y - 90 - i * 26 + Math.cos(now * 0.0016 + i) * 8,
        16, 'rgba(230,73,126,.75)', 0);
    }
  }
}

/* ---------- 3. le memory ---------- */
const SYMBOLES = ['🧸', '💗', '🌸', '🍓', '🎀', '🐻'];
function initMemory() {
  const cartes = [...SYMBOLES, ...SYMBOLES]
    .map(s => ({ s, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((c, i) => ({ s: c.s, i, ouverte: false, trouvee: false }));
  D = { cartes, ouvertes: [], paires: 0, bloque: false };
  const g = $('#grille');
  g.hidden = false;
  g.innerHTML = cartes.map(c =>
    `<button class="carte-jeu" data-i="${c.i}"><span>${c.s}</span></button>`).join('');
  maj();
}
$('#grille').addEventListener('click', e => {
  const b = e.target.closest('[data-i]');
  if (!b || jeuActif !== 'memory' || D.bloque) return;
  const c = D.cartes[+b.dataset.i];
  if (c.ouverte || c.trouvee) return;
  c.ouverte = true; b.classList.add('ouverte');
  D.ouvertes.push(c);
  if (D.ouvertes.length < 2) return;

  const [a, d] = D.ouvertes;
  if (a.s === d.s) {
    a.trouvee = d.trouvee = true;
    D.ouvertes = []; D.paires++;
    for (const x of [a, d]) {
      const el = $(`[data-i="${x.i}"]`);
      el.classList.remove('ouverte'); el.classList.add('trouvee');
      const r = el.getBoundingClientRect();
      fete(8, r.left + r.width / 2, r.top + r.height / 2);
    }
    maj();
    if (D.paires >= SYMBOLES.length) { $('#grille').hidden = true; gagne(); }
  } else {
    D.bloque = true;
    setTimeout(() => {
      for (const x of D.ouvertes) { x.ouverte = false; $(`[data-i="${x.i}"]`).classList.remove('ouverte'); }
      D.ouvertes = []; D.bloque = false;
    }, 750);
  }
});

/* ---------- 4. gonfle le cœur ---------- */
const BUT_GONFLE = 3;
function initCoeur() {
  D = { ok: 0, t: 0, tient: false, cible: 0, flash: 0 };
  nouvelleCible();
  $('#commande').innerHTML = '<button class="bouton-tenir" id="b-tenir">Maintiens 🎈</button>';
  const b = $('#b-tenir');
  const bas = e => { e.preventDefault(); if (jeuActif === 'coeur') D.tient = true; };
  const haut = () => { if (jeuActif === 'coeur' && D.tient) { D.tient = false; juge(); } };
  b.addEventListener('pointerdown', bas);
  window.addEventListener('pointerup', haut);
  window.addEventListener('pointercancel', haut);
  maj();
}
function nouvelleCible() { D.cible = 88 + Math.random() * 78; D.t = 0; }
function juge() {
  const ecart = Math.abs(D.t - D.cible);
  if (ecart <= 20) {
    D.ok++; D.flash = 1;
    fete(26, W / 2, H * 0.46);
    bulle(ecart <= 7 ? 'Parfait ! 💗' : 'Bien joué !');
    maj();
    if (D.ok >= BUT_GONFLE) { $('#commande').innerHTML = ''; gagne(); return; }
  } else {
    bulle(D.t < D.cible ? 'Un peu plus gros 🫧' : 'Un peu trop, doucement 🫧');
  }
  nouvelleCible();
}
function jeuCoeur(now) {
  if (D.tient) D.t = Math.min(230, D.t + 1.5);
  D.flash = Math.max(0, D.flash - 0.03);
  const cxx = W / 2, cyy = H * 0.46;
  /* le cercle à remplir */
  cx.setLineDash([7, 9]); cx.lineWidth = 3;
  cx.strokeStyle = Math.abs(D.t - D.cible) <= 20 ? '#3fbf6f' : 'rgba(230,73,126,.55)';
  cx.beginPath(); cx.arc(cxx, cyy, D.cible, 0, 6.3); cx.stroke();
  cx.setLineDash([]);
  coeur(cxx, cyy, Math.max(14, D.t * 0.92), D.flash > 0 ? '#3fbf6f' : '#e6497e', Math.sin(now * 0.004) * 0.05);
  cx.font = '600 15px Quicksand, sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#7b4a55';
  cx.fillText('Lâche quand le cœur remplit le cercle', cxx, cyy + D.cible + 34);
}

/* ---------- 5. les nounours farceurs ---------- */
const BUT_CACHE = 14;
function initCache() {
  D = { pris: 0, trous: [], prochain: 0 };
  const cols = 3, lignes = 3;
  for (let l = 0; l < lignes; l++) for (let c = 0; c < cols; c++) {
    D.trous.push({ cx: (c + 1) / (cols + 1), cy: 0.30 + l * 0.19, sorti: 0, fin: 0, poil: pick(POILS) });
  }
  maj();
}
function posTrou(t) { return { x: t.cx * W, y: t.cy * H }; }
cv.addEventListener('pointerdown', e => {
  if (jeuActif !== 'cache') return;
  for (const t of D.trous) {
    if (!t.sorti) continue;
    const p = posTrou(t);
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 56) {
      t.sorti = 0; D.pris++;
      fete(12, p.x, p.y); maj();
      if (D.pris >= BUT_CACHE) gagne();
      return;
    }
  }
});
function jeuCache(now) {
  if (now > D.prochain) {
    const libres = D.trous.filter(t => !t.sorti);
    if (libres.length) {
      const t = pick(libres);
      t.sorti = 1; t.debut = now;
      t.fin = now + 1250 - Math.min(500, D.pris * 34);
    }
    D.prochain = now + 480 - Math.min(240, D.pris * 16);
  }
  for (const t of D.trous) {
    const p = posTrou(t);
    /* le terrier */
    cx.fillStyle = 'rgba(230,73,126,.16)';
    cx.beginPath(); cx.ellipse(p.x, p.y + 26, 46, 14, 0, 0, 6.3); cx.fill();
    if (!t.sorti) continue;
    if (now > t.fin) { t.sorti = 0; continue; }
    const vie = (now - t.debut) / (t.fin - t.debut);
    const monte = Math.min(1, vie * 5) * Math.min(1, (1 - vie) * 5 + 0.2);
    nounours(p.x, p.y + 26 - monte * 40, 44 * (0.6 + monte * 0.4), t.poil, false, false);
  }
}

/* ---------- l'affichage du score ---------- */
function maj() {
  const s = {
    attrape: () => D.pris + ' / ' + BUT_COEURS + ' 💗',
    reveil: () => D.n + ' / ' + BUT_TAPES + ' 💋',
    memory: () => D.paires + ' / ' + SYMBOLES.length + ' paires',
    coeur: () => D.ok + ' / ' + BUT_GONFLE + ' 🎈',
    cache: () => D.pris + ' / ' + BUT_CACHE + ' 🐻'
  }[jeuActif];
  $('#score-jeu').textContent = s ? s() : '';
  majCoeurs();
}

/* =========================================================
   BOUCLE
   ========================================================= */
function boucle(now) {
  requestAnimationFrame(boucle);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  fond(now);
  if (jeuActif) ({
    attrape: jeuAttrape, reveil: jeuReveil, coeur: jeuCoeur, cache: jeuCache, memory: () => {}
  })[jeuActif](now);
  majPluie();
}
requestAnimationFrame(boucle);

majCoeurs();

/* pour toi, pour vérifier avant de lui envoyer :
   ?reset remet à zéro · ?voir=lettre ouvre la lettre · ?jeu=3 saute au 3e jeu */
if (PARAMS.get('voir') === 'lettre') montreLettre();
else if (PARAMS.get('jeu')) { avance = clamp((parseInt(PARAMS.get('jeu'), 10) || 1) - 1, 0, 4); annonce(); }
