/* =========================================================
   NOUS DEUX — un montage de vos photos, sur sa chanson.
   Chaque image respire (lent travelling), les passages se
   font en fondu, et la durée totale se cale sur le morceau
   pour que la dernière photo tombe sur la dernière note.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const doux = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const sat = (a, b, v) => clamp((v - a) / (b - a), 0, 1);

const VIDEO = 'WikAeXGsmHY';
const RETROUVAILLES = new Date(2026, 8, 16);
const JOURS = Math.max(0, Math.ceil((RETROUVAILLES - new Date()) / 86400000));

/* ---------------------------------------------------------
   LE MONTAGE
   poids  : durée relative de l'image
   de/vers: le travelling — e = échelle, x/y = cadrage (-1 à 1)
   txt    : le carton qui s'affiche par-dessus
   --------------------------------------------------------- */
const PHOTOS = [
  /* la capture des messages est petite (319 px) : on la grossit à peine */
  { f: 'messages', poids: 1.05, de: { e: 1.04, x: -.06, y: -.10 }, vers: { e: 1.00, x: .04, y: .10 },
    txt: 'Ça a commencé comme ça. Un soir, des messages.' },
  /* la photo a été recadrée sur son visage : la vignette de musique incrustée
     dans la story d'origine tombait en plein milieu */
  { f: 'stacy',    poids: 1.25, de: { e: 1.14, x: .05, y: .08 },  vers: { e: 1.00, x: -.03, y: -.06 },
    txt: 'Et puis il y a eu toi.' },
  { f: 'detail',   poids: .95,  de: { e: 1.06, x: .12, y: .10 },  vers: { e: 1.22, x: -.06, y: -.08 } },
  { f: 'lettre',   poids: 1.40, de: { e: 1.30, x: -.02, y: -.34 }, vers: { e: 1.14, x: .02, y: .30 },
    txt: 'Je t\'ai écrit tout ce que je n\'arrive pas à te dire.' },
  { f: 'nounours', poids: 1.05, de: { e: 1.18, x: .08, y: .10 },  vers: { e: 1.02, x: -.05, y: -.06 },
    txt: 'Je t\'ai laissé quelqu\'un pour les nuits où je ne suis pas là.' },
  { f: 'raiponce', poids: 1.05, de: { e: 1.04, x: -.10, y: .06 }, vers: { e: 1.20, x: .08, y: -.08 },
    txt: 'Ma seule et vraie Raiponce.' },
  { f: 'milo',     poids: 1.00, de: { e: 1.24, x: .04, y: .18 },  vers: { e: 1.06, x: -.02, y: -.10 },
    txt: 'Il y a Milo, aussi. Qui attend avec nous.' },
  { f: 'peche',    poids: .85,  de: { e: 1.02, x: -.12, y: 0 },   vers: { e: 1.18, x: .10, y: .04 },
    txt: 'Et les jours où on ne peut pas se voir…' },
  { f: 'rouge',    poids: .85,  de: { e: 1.20, x: .10, y: -.04 }, vers: { e: 1.04, x: -.08, y: .06 },
    txt: '…on se retrouve quand même.' },
  { f: 'ensemble', poids: .95,  de: { e: 1.06, x: 0, y: .12 },    vers: { e: 1.22, x: 0, y: -.10 } },
  { f: 'chien',    poids: .75,  de: { e: 1.22, x: -.08, y: -.06 }, vers: { e: 1.04, x: .06, y: .08 } },
  { f: 'voiture',  poids: .80,  de: { e: 1.04, x: .10, y: .06 },  vers: { e: 1.20, x: -.08, y: -.04 },
    txt: 'Ce monde-là compte autant que l\'autre.' },
  { f: 'mains',    poids: 1.30, de: { e: 1.26, x: -.06, y: .08 }, vers: { e: 1.06, x: .04, y: -.04 },
    txt: 'Bientôt, ce sera pour de vrai.' },
  { f: 'bague',    poids: 1.70, de: { e: 1.28, x: .04, y: .06 },  vers: { e: 1.06, x: -.02, y: -.02 },
    txt: 'Et pour tout le reste, on a la vie entière.' }
];

const FONDU = 1.25;          /* le temps que dure chaque passage */
const OUVERTURE = 1.6;       /* noir au début */
let DUREE = 148;             /* recalculée sur la longueur de la chanson */

/* ============ CHARGEMENT DES IMAGES ============ */
const images = {};
let chargees = 0;
function chargeImages(fini) {
  for (const p of PHOTOS) {
    const im = new Image();
    im.onload = im.onerror = () => {
      chargees++;
      $('#charge').textContent = chargees < PHOTOS.length
        ? 'chargement des photos… ' + chargees + ' / ' + PHOTOS.length : '';
      if (chargees === PHOTOS.length) fini();
    };
    im.src = 'img/' + p.f + '.webp';
    images[p.f] = im;
  }
}

/* ============ LA MINUTERIE DU MONTAGE ============ */
let plan = [];
function calcule() {
  const total = PHOTOS.reduce((s, p) => s + p.poids, 0);
  /* chaque image occupe sa part, plus le recouvrement des fondus */
  const utile = DUREE - OUVERTURE;
  let t = OUVERTURE;
  plan = PHOTOS.map(p => {
    const d = utile * (p.poids / total);
    const o = { p, a: t, b: t + d };
    t += d;
    return o;
  });
}

/* ============ LA CHANSON ============ */
let yt = null, ytPret = false, ytMort = false, sonCoupe = false;
function chargeYT() {
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => { ytMort = true; };
  document.head.appendChild(s);
  setTimeout(() => { if (!ytPret) ytMort = true; }, 7000);
}
window.onYouTubeIframeAPIReady = () => {
  try {
    yt = new YT.Player('lecteur', {
      videoId: VIDEO,
      playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          ytPret = true;
          /* on cale le montage sur la vraie longueur du morceau */
          try {
            const d = yt.getDuration();
            if (d > 30) { DUREE = clamp(d - 1.5, 95, 230); calcule(); }
          } catch (e) {}
        },
        onError: () => { ytMort = true; }
      }
    });
  } catch (e) { ytMort = true; }
};
chargeYT();
const chansonOk = () => yt && ytPret && !ytMort;

/* ============ CANEVAS ============ */
const cv = $('#cv'), cx = cv.getContext('2d');
let W = 0, H = 0, dpr = 1;
function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}
window.addEventListener('resize', taille);
taille();

/* ---------------------------------------------------------
   La photo est posée au milieu du noir, en petit, et une
   lumière la traverse lentement — comme un tirage qu'on
   éclaire à la main dans une pièce sombre.
   --------------------------------------------------------- */
const PART = 0.56;                       /* la photo occupe 56 % de la hauteur : elle reste au milieu, le texte a sa place dessous */

function boite(im, e) {
  const rc = im.naturalWidth / im.naturalHeight;
  let h = H * PART * e, l = h * rc;
  const lMax = W * 0.58 * e;
  if (l > lMax) { l = lMax; h = l / rc; }
  return { l, h, x: (W - l) / 2, y: (H - h) / 2 };
}

/* le halo qui la décolle du fond */
function halo(b, a) {
  const g = cx.createRadialGradient(W / 2, H / 2, Math.min(b.l, b.h) * .2,
    W / 2, H / 2, Math.max(b.l, b.h) * 1.25);
  g.addColorStop(0, `rgba(150,130,120,${.24 * a})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
}

/* la lumière qui balaie, une seule fois par photo */
function balaye(b, k, a) {
  const u = sat(.10, .92, k);
  const cxx = b.x - b.l * .55 + u * (b.l * 2.1);
  cx.save();
  cx.beginPath(); cx.rect(b.x, b.y, b.l, b.h); cx.clip();
  cx.globalCompositeOperation = 'screen';
  cx.globalAlpha = a * Math.sin(sat(0, 1, u) * Math.PI) * .95;
  const larg = Math.max(90, b.l * .22);
  const g = cx.createLinearGradient(cxx - larg, b.y - b.h * .3, cxx + larg, b.y + b.h * 1.3);
  g.addColorStop(0, 'rgba(255,236,208,0)');
  g.addColorStop(.42, 'rgba(255,240,214,.16)');
  g.addColorStop(.5, 'rgba(255,246,228,.34)');
  g.addColorStop(.58, 'rgba(255,240,214,.16)');
  g.addColorStop(1, 'rgba(255,236,208,0)');
  cx.fillStyle = g; cx.fillRect(b.x, b.y, b.l, b.h);
  cx.restore();
}

function photo(im, cad, alpha, k) {
  if (!im || !im.naturalWidth || alpha <= 0) return;
  const b = boite(im, cad.e);
  /* une dérive très douce, pour que l'image ne soit jamais figée */
  const dx = cad.x * b.l * .05, dy = cad.y * b.h * .05;
  const x = b.x + dx, y = b.y + dy;

  cx.globalAlpha = alpha;
  halo(b, alpha);

  /* l'ombre portée : le tirage flotte */
  cx.save();
  cx.shadowColor = 'rgba(0,0,0,.85)';
  cx.shadowBlur = Math.max(30, b.h * .10);
  cx.shadowOffsetY = 14;
  cx.fillStyle = '#0b0a0d';
  cx.fillRect(x, y, b.l, b.h);
  cx.restore();

  cx.drawImage(im, x, y, b.l, b.h);

  balaye({ ...b, x, y }, k, alpha);

  /* un filet clair sur le bord, comme la marge d'un tirage */
  cx.strokeStyle = `rgba(232,214,190,${.20 * alpha})`;
  cx.lineWidth = 1;
  cx.strokeRect(x + .5, y + .5, b.l - 1, b.h - 1);
  cx.globalAlpha = 1;
}
const entre = (a, b, k) => ({ e: lerp(a.e, b.e, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

/* ---- la poussière qui flotte dans le faisceau ---- */
const POUSS = Array.from({ length: 60 }, () => ({
  x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.6,
  v: .004 + Math.random() * .012, p: Math.random() * 6.3
}));
function poussiere(now) {
  for (const d of POUSS) {
    const y = ((d.y - now * d.v * .00004) % 1.1 + 1.1) % 1.1 - .05;
    const x = d.x + Math.sin(now * .0004 + d.p) * .02;
    cx.globalAlpha = .10 + .16 * (.5 + .5 * Math.sin(now * .0013 + d.p));
    cx.fillStyle = '#ffeed6';
    cx.beginPath(); cx.arc(x * W, y * H, d.r, 0, 6.3); cx.fill();
  }
  cx.globalAlpha = 1;
}

/* ============ PROJECTION ============ */
let t = 0, joue = false, der = 0, finie = false;

function dessine(now) {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  /* la pièce sombre : pas un noir plat, un fond qui a du fond */
  const f = cx.createRadialGradient(W / 2, H * .46, 40, W / 2, H * .5, Math.max(W, H) * .78);
  f.addColorStop(0, '#16131a'); f.addColorStop(.55, '#0c0a10'); f.addColorStop(1, '#050408');
  cx.fillStyle = f; cx.fillRect(0, 0, W, H);
  poussiere(now);

  for (const o of plan) {
    if (t < o.a - FONDU || t > o.b + .05) continue;
    const k = clamp((t - o.a) / (o.b - o.a), 0, 1);
    /* fondu d'entrée sur le plan précédent, fondu de sortie à la fin */
    const entree = sat(o.a - FONDU, o.a + FONDU * .15, t);
    const sortie = 1 - sat(o.b - FONDU * .15, o.b, t);
    const a = Math.min(entree, sortie);
    if (a <= 0) continue;
    /* le travelling continue pendant le fondu, sans à-coup */
    photo(images[o.p.f], entre(o.p.de, o.p.vers, doux(clamp(k, 0, 1))), a, k);
  }

  /* le tout premier noir, et le dernier */
  const nOuv = 1 - sat(0, OUVERTURE, t);
  const nFin = sat(DUREE - 1.6, DUREE, t);
  const noir = Math.max(nOuv, nFin);
  if (noir > 0) { cx.globalAlpha = noir; cx.fillStyle = '#050408'; cx.fillRect(0, 0, W, H); cx.globalAlpha = 1; }
}

function majCarton() {
  const o = plan.find(x => t >= x.a + .5 && t < x.b - .5 && x.p.txt);
  const el = $('#soustitre');
  const veut = o ? o.p.txt : '';
  if (el.dataset.txt !== veut) {
    el.dataset.txt = veut;
    el.classList.remove('vu');
    if (veut) setTimeout(() => {
      if (el.dataset.txt !== veut) return;
      el.textContent = veut; el.classList.add('vu');
    }, 340);
  }
}

function boucle(now) {
  requestAnimationFrame(boucle);
  const dt = Math.min(.06, (now - der) / 1000 || 0);
  der = now;
  if (joue) {
    t += dt;
    if (t >= DUREE && !finie) termine();
  }
  dessine(now);
  majCarton();
  $('#avance').style.width = clamp(t / DUREE, 0, 1) * 100 + '%';
}
requestAnimationFrame(boucle);

/* ============ COMMANDES ============ */
function lance() {
  t = 0; finie = false;
  $('#e-debut').classList.remove('on');
  $('#e-fin').classList.remove('on');
  document.body.classList.add('projection');
  $('#commandes').hidden = false;
  joue = true;
  if (chansonOk()) {
    try { yt.seekTo(0, true); yt.setVolume(sonCoupe ? 0 : 85); yt.playVideo(); } catch (e) {}
  }
  reveille();
}
$('#b-jouer').addEventListener('click', lance);
$('#b-revoir').addEventListener('click', lance);

function termine() {
  finie = true; joue = false;
  document.body.classList.remove('projection');
  $('#commandes').hidden = true;
  $('#soustitre').classList.remove('vu');
  if (chansonOk()) {
    let v = 85;
    const f = setInterval(() => {
      v -= 5;
      try { yt.setVolume(Math.max(0, v)); } catch (e) {}
      if (v <= 0) { clearInterval(f); try { yt.pauseVideo(); } catch (e) {} }
    }, 120);
  }
  $('#mot-fin').innerHTML = JOURS > 0
    ? 'Encore ' + JOURS + ' jour' + (JOURS > 1 ? 's' : '') + '.<br>Je t\'aime, Stacy.'
    : 'C\'est aujourd\'hui.<br>Je t\'aime, Stacy.';
  $('#e-fin').classList.add('on');
}

$('#b-pause').addEventListener('click', () => {
  joue = !joue;
  $('#b-pause').textContent = joue ? 'II' : '▶';
  if (chansonOk()) { try { joue ? yt.playVideo() : yt.pauseVideo(); } catch (e) {} }
});
$('#b-son').addEventListener('click', () => {
  sonCoupe = !sonCoupe;
  $('#b-son').classList.toggle('eteint', sonCoupe);
  if (chansonOk()) { try { yt.setVolume(sonCoupe ? 0 : 85); } catch (e) {} }
});

let sommeil = null;
function reveille() {
  document.body.classList.add('montre-commandes');
  clearTimeout(sommeil);
  sommeil = setTimeout(() => document.body.classList.remove('montre-commandes'), 2800);
}
window.addEventListener('pointermove', reveille);
window.addEventListener('pointerdown', reveille);

/* ============ DÉPART ============ */
calcule();
$('#b-jouer').disabled = true;
$('#charge').textContent = 'chargement des photos…';
chargeImages(() => {
  $('#b-jouer').disabled = false;
  $('#charge').textContent = '';
  const P = new URLSearchParams(location.search);
  if (P.has('t')) {
    document.body.classList.add('sans-transition');
    lance();
    t = clamp(parseFloat(P.get('t')) || 0, 0, DUREE - .5);
  }
});
