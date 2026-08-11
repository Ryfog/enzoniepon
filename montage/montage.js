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
  /* c'est là que tout a commencé : leur toute première rencontre, en jeu */
  { f: 'ensemble', poids: 1.35, de: { e: 1.06, x: 0, y: .10 },     vers: { e: 1.00, x: 0, y: -.08 },
    txt: 'Tout a commencé là. Un jeu, un chien, et toi.' },
  /* la capture des messages est petite (319 px) : on la grossit à peine */
  { f: 'messages', poids: 1.05, de: { e: 1.04, x: -.06, y: -.10 }, vers: { e: 1.00, x: .04, y: .10 },
    txt: 'Puis les messages, tard le soir.' },
  /* la photo a été recadrée sur son visage : la vignette de musique incrustée
     dans la story d'origine tombait en plein milieu */
  { f: 'stacy',    poids: 1.25, de: { e: 1.14, x: .05, y: .08 },  vers: { e: 1.00, x: -.03, y: -.06 },
    txt: 'Et puis il y a eu toi. Pour de vrai.' },
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
    txt: '…on retourne là où tout a commencé.' },
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

/* ============ ÉTAT DE LA PROJECTION ============ */
let t = 0, joue = false, der = 0, finie = false;

/* ---------------------------------------------------------
   LE MUR
   Les photos sont accrochées côte à côte dans une salle
   sombre. On avance le long du mur, et une lampe chaude
   passe de l'une à l'autre, de droite à gauche.
   --------------------------------------------------------- */
const HAUT_PHOTO = .46;        /* hauteur d'un tirage, en part d'écran */
const TRANSIT = 1.9;           /* le temps que met la lampe d'une photo à l'autre */
const espace = () => Math.max(W * 1.02, H * .95);

/* la position de la caméra : elle s'arrête sur chaque photo, puis glisse */
function avancee() {
  for (let i = 0; i < plan.length; i++) {
    const o = plan[i];
    if (t < o.a) return i > 0 ? i - 1 + doux(sat(plan[i - 1].b - TRANSIT, plan[i - 1].b, t)) : 0;
    if (t < o.b - TRANSIT) return i;
    if (t < o.b) return i + doux(sat(o.b - TRANSIT, o.b, t));
  }
  return plan.length - 1;
}

/* la taille d'un tirage, à l'échelle du mur */
function tirage(im) {
  const rc = im.naturalWidth / im.naturalHeight;
  let h = H * HAUT_PHOTO, l = h * rc;
  const lMax = W * .52;
  if (l > lMax) { l = lMax; h = l / rc; }
  return { l, h };
}

/* ---------- le décor ---------- */
const ETOILES = (function () {
  let g = 4271;
  const r = () => (g = (g * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: 150 }, () => ({ x: r() * 60, y: r() * .55, r: .4 + r() * 1.5, p: r() * 6.3 }));
})();
const GRAINS = (function () {
  let g = 8821;
  const r = () => (g = (g * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: 70 }, () => ({ x: r(), y: r(), r: .5 + r() * 1.7, v: .3 + r() * .9, p: r() * 6.3 }));
})();

function salle(now, cam) {
  /* le ciel de la salle : très sombre, un peu de bleu nuit */
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#080810');
  g.addColorStop(.52, '#0d0b14');
  g.addColorStop(.72, '#100c12');
  g.addColorStop(1, '#060509');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  /* les étoiles, très loin : elles bougent à peine quand on avance */
  const par = cam * .06;
  for (const e of ETOILES) {
    const x = ((e.x * W * .3 - par) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * .15;
    cx.globalAlpha = (.18 + .35 * (.5 + .5 * Math.sin(now * .0012 + e.p)));
    cx.fillStyle = '#dfe4f0';
    cx.beginPath(); cx.arc(x, e.y * H * .62, e.r, 0, 6.3); cx.fill();
  }
  cx.globalAlpha = 1;

  /* le sol : une bande sombre et brillante qui reflète */
  const sol = H * .82;
  const s = cx.createLinearGradient(0, sol - 20, 0, H);
  s.addColorStop(0, 'rgba(30,26,36,.9)');
  s.addColorStop(1, 'rgba(6,5,9,1)');
  cx.fillStyle = s; cx.fillRect(0, sol - 20, W, H - sol + 20);
  cx.strokeStyle = 'rgba(190,170,150,.10)'; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(0, sol); cx.lineTo(W, sol); cx.stroke();
  return sol;
}

/* ---------- la lampe : un cône chaud, au centre ---------- */
function lampe(now, force) {
  const lx = W * .5, ly = -H * .12;
  cx.save();
  cx.globalCompositeOperation = 'screen';
  const large = W * .40;
  const g = cx.createLinearGradient(0, ly, 0, H * .95);
  g.addColorStop(0, `rgba(255,232,196,${.20 * force})`);
  g.addColorStop(.55, `rgba(255,224,180,${.075 * force})`);
  g.addColorStop(1, 'rgba(255,220,175,0)');
  cx.fillStyle = g;
  cx.beginPath();
  cx.moveTo(lx - 26, ly); cx.lineTo(lx - large, H * 1.02);
  cx.lineTo(lx + large, H * 1.02); cx.lineTo(lx + 26, ly);
  cx.closePath(); cx.fill();
  /* la poussière qui danse dedans */
  for (const d of GRAINS) {
    const y = ((d.y - now * d.v * .000018) % 1.1 + 1.1) % 1.1 - .05;
    const x = .5 + (d.x - .5) * .62 + Math.sin(now * .0005 + d.p) * .035;
    cx.globalAlpha = (.12 + .22 * (.5 + .5 * Math.sin(now * .0016 + d.p))) * force;
    cx.fillStyle = '#fff0d6';
    cx.beginPath(); cx.arc(x * W, y * H, d.r, 0, 6.3); cx.fill();
  }
  cx.restore();
}

/* ---------- un tirage accroché au mur ---------- */
function accroche(im, ecx, sol, eclat, alpha) {
  if (!im || !im.naturalWidth) return;
  const b = tirage(im);
  const marge = Math.max(9, b.h * .035);        /* la marge blanche du tirage */
  const x = ecx - b.l / 2, y = H * .46 - b.h / 2;

  cx.save();
  cx.globalAlpha = alpha;

  /* le fil d'accrochage */
  cx.strokeStyle = `rgba(180,160,140,${.16 + .3 * eclat})`; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(ecx, y - marge); cx.lineTo(ecx, H * .06); cx.stroke();

  /* l'ombre portée sur le mur */
  cx.save();
  cx.shadowColor = 'rgba(0,0,0,.9)';
  cx.shadowBlur = 34 + eclat * 26; cx.shadowOffsetY = 16;
  cx.fillStyle = '#efe7dc';
  cx.fillRect(x - marge, y - marge, b.l + marge * 2, b.h + marge * 2);
  cx.restore();

  /* le papier, puis l'image */
  cx.fillStyle = '#efe7dc';
  cx.fillRect(x - marge, y - marge, b.l + marge * 2, b.h + marge * 2);
  cx.drawImage(im, x, y, b.l, b.h);

  /* ce qui n'est pas dans la lampe reste dans l'ombre */
  const ombre = 1 - eclat;
  if (ombre > .01) {
    cx.fillStyle = `rgba(4,4,9,${.90 * ombre})`;
    cx.fillRect(x - marge, y - marge, b.l + marge * 2, b.h + marge * 2);
  }

  /* le reflet sur le sol */
  const hRef = Math.min(b.h * .34, sol * .22);
  cx.save();
  cx.translate(0, sol * 2 + b.h * .0);
  cx.scale(1, -1);
  cx.globalAlpha = alpha * (.10 + .16 * eclat);
  cx.beginPath(); cx.rect(x, sol * 2 - sol - hRef, b.l, hRef); cx.clip();
  cx.drawImage(im, x, y, b.l, b.h);
  cx.restore();

  cx.globalAlpha = 1;
  cx.restore();
}

function dessine(now) {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);

  const av = avancee();
  const sol = salle(now, av * espace());

  /* on ne dessine que les tirages proches : les autres sont hors champ */
  const ESP = espace();
  for (let i = 0; i < plan.length; i++) {
    const d = i - av;
    if (Math.abs(d) > 1.6) continue;
    const ecx = W / 2 + d * ESP;
    /* la lampe est au centre : plus on s'en éloigne, plus on est dans le noir */
    const eclat = Math.pow(clamp(1 - Math.abs(d) / .62, 0, 1), .8);
    accroche(images[plan[i].p.f], ecx, sol, eclat, 1);
  }

  lampe(now, 1);

  /* noir d'ouverture et de fin */
  const noir = Math.max(1 - sat(0, OUVERTURE, t), sat(DUREE - 1.8, DUREE, t));
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
