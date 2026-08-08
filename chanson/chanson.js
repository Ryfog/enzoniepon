/* =========================================================
   ÉCOUTE ÇA — la chanson tourne, ses mots à lui passent dessus.
   La musique vient du lecteur YouTube officiel : rien n'est copié,
   c'est la vraie vidéo qui joue, en fond.
   ========================================================= */
'use strict';

const VIDEO = 'WikAeXGsmHY';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;

/* ---------------------------------------------------------
   TES MOTS.
   t : la seconde à laquelle la ligne apparaît (null = réparti
   automatiquement sur la longueur du morceau).
   Pour les caler toi-même : ouvre la page avec ?regler
   --------------------------------------------------------- */
const LIGNES = [
  { t: null, txt: 'J\'ai mis cette chanson pour toi.' },
  { t: null, txt: 'Écoute-la jusqu\'au bout.' },
  { t: null, txt: 'Merci d\'être dans ma vie.' },
  { t: null, txt: 'Tu fais chavirer mon cœur' },
  { t: null, txt: 'à chaque fois que tu rigoles.' },
  { t: null, txt: 'Je n\'arrête pas de compter les jours.' },
  { t: null, txt: 'Ça me paraît tellement loin' },
  { t: null, txt: 'avant d\'être dans tes bras.' },
  { t: null, txt: 'T\'es une fille en or.', fort: 1 },
  { t: null, txt: 'Et je veux pas te perdre.' },
  { t: null, txt: 'Jamais.', fort: 1 },
  { t: null, txt: 'Alors viens là.' },
  { t: null, txt: 'Pour le câlin.' },
  { t: null, txt: 'Je t\'aime. 💗', fort: 1 }
];

const PARAMS = new URLSearchParams(location.search);
const REGLER = PARAMS.has('regler');

/* ============ ÉTAT ============ */
let lecteur = null, pret = false, joue = false, duree = 0;
let horloge = 0;                 /* secondes écoulées dans le morceau */
let iLigne = -1, tempsCales = [];
let secours = false, tSecours = 0;   /* si la vidéo refuse de s'incruster */
let enScene = false;                 /* vrai pendant le défilé des phrases */

function ecran(id) { document.querySelectorAll('.ec').forEach(s => s.classList.toggle('on', s.id === id)); }

/* ============ LE LECTEUR YOUTUBE ============ */
function chargeAPI() {
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}
window.onYouTubeIframeAPIReady = () => {
  lecteur = new YT.Player('lecteur', {
    videoId: VIDEO,
    playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { pret = true; },
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) joue = true;
        if (e.data === YT.PlayerState.PAUSED) joue = false;
        if (e.data === YT.PlayerState.ENDED) fin();
      },
      onError: () => passeEnSecours('La vidéo ne veut pas se lancer ici.')
    }
  });
};
chargeAPI();

/* si YouTube bloque l'intégration, on garde le texte et on propose le lien */
function passeEnSecours(pourquoi) {
  if (secours) return;
  secours = true; duree = 150; tSecours = performance.now() / 1000;
  $('#note-debut').innerHTML = pourquoi +
    ' Les mots défilent quand même — tu peux <a href="https://www.youtube.com/watch?v=' + VIDEO +
    '" target="_blank" rel="noopener">ouvrir la chanson ici</a> et revenir.';
}

/* ============ LANCEMENT ============ */
$('#b-lancer').addEventListener('click', () => {
  ecran('e-show');
  iLigne = -1; tempsCales = [];
  if (REGLER) $('#reglage').hidden = false;
  if (pret && lecteur) {
    try { lecteur.seekTo(0, true); lecteur.playVideo(); joue = true; }
    catch (e) { passeEnSecours('Impossible de démarrer la vidéo.'); }
    setTimeout(() => { if (!duree && lecteur.getDuration) duree = lecteur.getDuration() || 0; }, 900);
  } else {
    passeEnSecours('Le lecteur n\'a pas répondu.');
    tSecours = performance.now() / 1000;
  }
});

$('#b-pause').addEventListener('click', () => {
  if (secours) return;
  if (joue) { lecteur.pauseVideo(); $('#b-pause').textContent = '▶'; }
  else { lecteur.playVideo(); $('#b-pause').textContent = '⏸'; }
});

$('#b-rejouer').addEventListener('click', () => {
  ecran('e-show'); iLigne = -1;
  if (!secours && lecteur) { lecteur.seekTo(0, true); lecteur.playVideo(); joue = true; }
  else tSecours = performance.now() / 1000;
});

function fin() { joue = false; ecran('e-fin'); }

/* ---- à quelle seconde chaque ligne s'affiche ---- */
function momentDe(i) {
  const l = LIGNES[i];
  if (l.t !== null && l.t !== undefined) return l.t;
  /* réparties sur le morceau, avec une intro et une fin tranquilles */
  const d = duree || 150;
  const debut = Math.min(6, d * 0.05), fin2 = d * 0.94;
  return debut + (fin2 - debut) * (i / Math.max(1, LIGNES.length - 1));
}

function majLignes() {
  let cible = -1;
  for (let i = 0; i < LIGNES.length; i++) if (horloge >= momentDe(i)) cible = i;
  if (cible === iLigne) return;
  iLigne = cible;
  const el = $('#ligne');
  el.classList.remove('vue');
  if (cible < 0) { el.textContent = ''; return; }
  setTimeout(() => {
    el.textContent = LIGNES[cible].txt;
    el.classList.toggle('forte', !!LIGNES[cible].fort);
    el.classList.add('vue');
  }, 260);
  eclat();
}

/* ============ MODE RÉGLAGE ============ */
if (REGLER) {
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (tempsCales.length >= LIGNES.length) return;
    tempsCales.push(+horloge.toFixed(1));
    if (tempsCales.length >= LIGNES.length) {
      $('#reglage').textContent = 'Copie ça dans chanson.js :\n' +
        LIGNES.map((l, i) => `  { t: ${tempsCales[i]}, txt: '${l.txt.replace(/'/g, "\\'")}'${l.fort ? ', fort: 1' : ''} },`).join('\n');
    }
  });
}
function majReglage() {
  if (!REGLER || tempsCales.length >= LIGNES.length) return;
  const n = tempsCales.length;
  $('#reglage').textContent =
    `RÉGLAGE — ${horloge.toFixed(1)} s / ${(duree || 0).toFixed(0)} s\n` +
    `Espace au bon moment pour caler la ligne ${n + 1} / ${LIGNES.length} :\n` +
    `« ${LIGNES[n] ? LIGNES[n].txt : ''} »`;
}

/* =========================================================
   LE DÉCOR
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

function dessineCoeur(x, y, t, col, ang, flou) {
  cx.save(); cx.translate(x, y); cx.rotate(ang || 0); cx.scale(t / 20, t / 20);
  if (flou) { cx.shadowColor = col; cx.shadowBlur = flou; }
  cx.fillStyle = col;
  cx.beginPath();
  cx.moveTo(0, 7);
  cx.bezierCurveTo(-14, -6, -9, -19, 0, -11);
  cx.bezierCurveTo(9, -19, 14, -6, 0, 7);
  cx.closePath(); cx.fill();
  cx.restore();
}

/* trois plans de cœurs : les gros devant, flous ; les petits au fond */
const PLANS = [
  { n: 9,  t: [46, 90], v: [7, 14],  a: .10, flou: 26 },
  { n: 16, t: [22, 44], v: [12, 22], a: .26, flou: 12 },
  { n: 26, t: [7, 18],  v: [20, 34], a: .5,  flou: 5 }
];
let vole = [];
function peuple() {
  vole = [];
  PLANS.forEach((p, pi) => {
    for (let i = 0; i < p.n; i++) vole.push({
      pi, x: Math.random(), y: Math.random(),
      t: lerp(p.t[0], p.t[1], Math.random()),
      v: lerp(p.v[0], p.v[1], Math.random()) / 1000,
      p: Math.random() * 6.3, d: Math.random() * 6.3
    });
  });
}
peuple();

const ORBES = Array.from({ length: 9 }, (_, i) => ({
  x: Math.random(), y: Math.random(), r: 90 + Math.random() * 220, p: i * 1.4
}));

function decor(now) {
  /* Le château est derrière, en CSS. On ne pose qu'un voile : assez
     léger pour le laisser voir, assez sombre au centre pour que les
     phrases en blanc restent lisibles par-dessus le ciel clair. */
  const k = 0.5 + 0.5 * Math.sin(now * 0.00007);
  const g = cx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, `rgba(${lerp(30, 52, k) | 0},${lerp(8, 12, k) | 0},${lerp(48, 64, k) | 0},.34)`);
  g.addColorStop(.55, `rgba(${lerp(70, 96, k) | 0},${lerp(18, 24, k) | 0},${lerp(78, 88, k) | 0},.26)`);
  g.addColorStop(1, `rgba(${lerp(34, 52, k) | 0},${lerp(10, 14, k) | 0},${lerp(50, 60, k) | 0},.40)`);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  /* un voile plus dense derrière le texte, dégradé pour rester doux */
  if (enScene) {
    const t = cx.createRadialGradient(W / 2, H * .5, 10, W / 2, H * .5, Math.max(W, H) * .58);
    t.addColorStop(0, 'rgba(24,8,34,.52)');
    t.addColorStop(.55, 'rgba(24,8,34,.30)');
    t.addColorStop(1, 'rgba(24,8,34,0)');
    cx.fillStyle = t; cx.fillRect(0, 0, W, H);
  }

  /* des halos qui respirent */
  for (const o of ORBES) {
    const x = (o.x + Math.sin(now * 0.00013 + o.p) * .08) * W;
    const y = (o.y + Math.cos(now * 0.00011 + o.p) * .08) * H;
    const r = o.r * (1 + Math.sin(now * 0.0004 + o.p) * .12);
    const rg = cx.createRadialGradient(x, y, 1, x, y, r);
    rg.addColorStop(0, 'rgba(232,70,124,.13)'); rg.addColorStop(1, 'rgba(232,70,124,0)');
    cx.fillStyle = rg; cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.fill();
  }

  /* le grand cœur qui bat au centre, très discret */
  const bat = 1 + Math.pow(Math.max(0, Math.sin(now * 0.0018)), 6) * 0.10;
  cx.globalAlpha = 0.13;
  dessineCoeur(W / 2, H * 0.5, Math.min(W, H) * 0.42 * bat, '#ff8fb4', 0, 70);
  cx.globalAlpha = 1;

  /* les cœurs qui montent */
  for (const f of vole) {
    const P = PLANS[f.pi];
    const y = ((f.y - now * f.v * 0.0001) % 1.25 + 1.25) % 1.25 - 0.12;
    const x = f.x * W + Math.sin(now * 0.0006 + f.p) * (34 + f.pi * 14);
    cx.globalAlpha = P.a * (0.6 + 0.4 * Math.sin(now * 0.001 + f.d));
    dessineCoeur(x, y * (H + 180) - 90, f.t, '#ff8fb4', Math.sin(now * 0.0007 + f.d) * .35, P.flou);
    cx.globalAlpha = 1;
  }
}

/* ---- une bouffée de cœurs à chaque nouvelle phrase ---- */
let etincelles = [];
function eclat() {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * 6.3, v = 2 + Math.random() * 5;
    etincelles.push({
      x: W / 2, y: H * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1,
      t: 8 + Math.random() * 16, vie: 1, ang: Math.random() * 6.3
    });
  }
  if (etincelles.length > 300) etincelles = etincelles.slice(-300);
}
function majEtincelles() {
  for (const e of etincelles) {
    e.x += e.vx; e.y += e.vy; e.vy += 0.04; e.vx *= 0.985; e.vy *= 0.985;
    e.vie -= 0.011; e.ang += 0.02;
  }
  etincelles = etincelles.filter(e => e.vie > 0);
  for (const e of etincelles) {
    cx.globalAlpha = clamp(e.vie, 0, 1) * .8;
    dessineCoeur(e.x, e.y, e.t, '#f4c98a', e.ang, 10);
  }
  cx.globalAlpha = 1;
}

/* =========================================================
   BOUCLE
   ========================================================= */
function boucle(now) {
  requestAnimationFrame(boucle);

  /* où en est la chanson */
  if (secours) {
    if ($('#e-show').classList.contains('on')) horloge = performance.now() / 1000 - tSecours;
    if (horloge > duree) { horloge = duree; fin(); }
  } else if (lecteur && lecteur.getCurrentTime) {
    try {
      horloge = lecteur.getCurrentTime() || 0;
      if (!duree && lecteur.getDuration) duree = lecteur.getDuration() || 0;
    } catch (e) {}
  }

  enScene = $('#e-show').classList.contains('on');
  if (enScene) {
    majLignes();
    majReglage();
    $('#jauge-in').style.width = (duree ? clamp(horloge / duree, 0, 1) * 100 : 0) + '%';
  }

  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  decor(now);
  majEtincelles();
}
requestAnimationFrame(boucle);
