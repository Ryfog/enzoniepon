/* =========================================================
   NOTRE MONDE — une carte entière à explorer du doigt.
   ---------------------------------------------------------
   Tout est dessiné : deux terres (la sienne au nord, la
   sienne à lui au sud), la mer entre les deux, et chaque
   cadeau déjà offert existe ici comme un lieu à découvrir.
   Le bateau au milieu avance RÉELLEMENT chaque jour jusqu'au
   16 septembre. Le ciel suit l'heure vraie.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const dist2 = (a, b, c, d) => Math.hypot(a - c, b - d);

/* le monde fait 2400 × 1800 ; l'écran est une fenêtre dessus */
const MW = 2400, MH = 1800;

/* ---- le voyage du bateau : du 21 juillet au 16 septembre ---- */
const DEPART = new Date(2026, 6, 21, 0, 0, 0);
const ARRIVEE = new Date(2026, 8, 16, 0, 0, 0);

/* =========================================================
   LES DIX LIEUX
   ========================================================= */
const LIEUX = [
  { id: 'phare', x: 1520, y: 320, r: 120, emoji: '🗼', nom: 'Ton phare',
    txt: 'Le nord du monde, c\'est chez toi. J\'ai mis un phare pour te retrouver de n\'importe où : il s\'allume dès qu\'il fait nuit, et il ne s\'éteint jamais vraiment. Comme moi qui pense à toi.' },
  { id: 'dune', x: 830, y: 1500, r: 120, emoji: '🏖', nom: 'Ma dune',
    txt: 'Le sud, c\'est moi. La plage, les pins, l\'océan. C\'est loin de chez toi — trop loin. Mais regarde bien la mer entre nous deux : il y a un bateau, et il n\'attend pas.' },
  { id: 'bateau', x: 0, y: 0, r: 140, emoji: '⛵', nom: 'Le bateau', dynamique: true,
    txt: '' },   /* rempli à l'ouverture, selon le jour */
  { id: 'chapiteau', x: 500, y: 620, r: 110, emoji: '🎪', nom: 'Le Petit Cirque',
    txt: 'Tu le reconnais ? C\'est notre chapiteau. Le trapèze, le funambule, les assiettes… Il est planté ici pour toujours. La prochaine représentation, c\'est quand tu veux.' },
  { id: 'pont', x: 1180, y: 900, r: 110, emoji: '🌉', nom: 'Le Pont',
    txt: 'Deux rives, deux lanternes, et des planches posées une à une. On l\'a construit en se devinant l\'un l\'autre. Il tient toujours — et il tiendra.' },
  { id: 'chateau', x: 1900, y: 700, r: 130, emoji: '🏰', nom: 'Ton château',
    txt: 'Ton château rose, avec ton nom dans les nuages. Toute princesse a le sien : voilà le tien, posé dans notre monde, drapeaux au vent.' },
  { id: 'lanternes', x: 1750, y: 1250, r: 110, emoji: '🏮', nom: 'Le champ de lanternes',
    txt: 'Les neuf lanternes qu\'on a lâchées ensemble. Elles ne sont jamais redescendues : elles flottent ici, au-dessus du champ, avec nos vœux dedans.' },
  { id: 'roseraie', x: 420, y: 1080, r: 105, emoji: '🌹', nom: 'La roseraie',
    txt: 'Les douze roses de ton bouquet, replantées. Elles ne fanent pas — c\'était le principe. Elles poussent ici et le jardinier ne prend jamais de vacances.' },
  { id: 'musique', x: 2050, y: 1550, r: 105, emoji: '🎶', nom: 'La boîte à musique',
    txt: 'La mélodie que j\'ai écrite pour toi tourne encore ici. Si tu tends l\'oreille un soir très calme, je suis sûr qu\'elle s\'entend depuis chez toi.' },
  { id: 'etoile', x: 1280, y: 190, r: 100, emoji: '⭐', nom: 'Notre étoile',
    txt: 'Elle brille au-dessus de tout le reste. C\'est la première chose que j\'ai accrochée dans ce monde, avant même les terres et la mer. Tant qu\'elle est là, tout va bien.' }
];

/* ============ ÉTAT ============ */
const CLE = 'monde_coeurs';
let trouves = [];
try { trouves = JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { trouves = []; }
trouves = Array.isArray(trouves) ? trouves.filter(i => LIEUX.some(l => l.id === i)) : [];
const sauve = () => { try { localStorage.setItem(CLE, JSON.stringify(trouves)); } catch (e) {} };

const PARAMS = new URLSearchParams(location.search);
if (PARAMS.has('reset')) {
  trouves = []; sauve();
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
}

let cam = { x: 0, y: 0 };            /* coin haut-gauche de la fenêtre, en coordonnées monde */
let zoom = 1;
let entre = false, finaleVue = trouves.length >= LIEUX.length;

/* ---- où est le bateau aujourd'hui ---- */
function avancement() {
  return clamp((Date.now() - DEPART) / (ARRIVEE - DEPART), 0, 1);
}
function posBateau() {
  const k = avancement();
  /* il remonte la mer en diagonale douce, de la dune vers le phare */
  const x = lerp(880, 1470, k) + Math.sin(k * 9) * 60;
  const y = lerp(1380, 430, k);
  return { x, y, k };
}
function joursRestants() {
  return Math.max(0, Math.ceil((ARRIVEE - Date.now()) / 86400000));
}

/* le texte du bateau dépend du jour où elle l'ouvre */
function texteBateau() {
  const j = joursRestants(), k = Math.round(avancement() * 100);
  if (j <= 0) return 'Il a accosté. On y est. Plus besoin de bateau : je suis là.';
  return 'Ce bateau, c\'est moi. Il avance un peu chaque jour, sans jamais s\'arrêter — il a déjà fait <b>' + k + '%</b> du chemin.<br><br>Reviens le voir demain : il aura bougé. Dans <b>' + j + ' jour' + (j > 1 ? 's' : '') + '</b>, il accoste chez toi.';
}

/* =========================================================
   CANVAS & CAMÉRA
   ========================================================= */
const cv = $('#cv'), cx = cv.getContext('2d');
let W = 0, H = 0, dpr = 1;
function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  zoom = Math.max(W / MW, H / MH, 0.62);       /* on ne dézoome jamais au point de sortir du monde */
  borne();
}
function borne() {
  cam.x = clamp(cam.x, 0, MW - W / zoom);
  cam.y = clamp(cam.y, 0, MH - H / zoom);
}
window.addEventListener('resize', taille);
taille();

/* ---- glisser pour explorer, avec inertie ---- */
let doigt = null, vx = 0, vy = 0, aBouge = false;
cv.addEventListener('pointerdown', e => {
  doigt = { x: e.clientX, y: e.clientY }; vx = vy = 0; aBouge = false;
  cv.classList.add('tire');
  cv.setPointerCapture?.(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (!doigt) return;
  const dx = (e.clientX - doigt.x) / zoom, dy = (e.clientY - doigt.y) / zoom;
  if (Math.abs(e.clientX - doigt.x) + Math.abs(e.clientY - doigt.y) > 6) aBouge = true;
  cam.x -= dx; cam.y -= dy; borne();
  vx = -dx; vy = -dy;
  doigt = { x: e.clientX, y: e.clientY };
  $('#astuce').classList.add('efface');
});
const lache = e => {
  if (doigt && !aBouge && entre) clic(e.clientX, e.clientY);
  doigt = null;
  cv.classList.remove('tire');
};
cv.addEventListener('pointerup', lache);
cv.addEventListener('pointercancel', () => { doigt = null; cv.classList.remove('tire'); });

function clic(sx, sy) {
  const mx = cam.x + sx / zoom, my = cam.y + sy / zoom;
  for (const l of LIEUX) {
    const p = l.dynamique ? posBateau() : l;
    if (dist2(mx, my, p.x, p.y) < l.r) { ouvreLieu(l); return; }
  }
}

/* la boussole emmène vers le prochain cœur non trouvé */
$('#boussole').addEventListener('click', () => {
  const l = prochain();
  if (!l) return;
  const p = l.dynamique ? posBateau() : l;
  vole = { x0: cam.x, y0: cam.y, x1: clamp(p.x - W / zoom / 2, 0, MW - W / zoom), y1: clamp(p.y - H / zoom / 2, 0, MH - H / zoom), t: 0 };
});
let vole = null;

function prochain() {
  let best = null, bd = 1e9;
  const cx0 = cam.x + W / zoom / 2, cy0 = cam.y + H / zoom / 2;
  for (const l of LIEUX) {
    if (trouves.includes(l.id)) continue;
    const p = l.dynamique ? posBateau() : l;
    const d = dist2(cx0, cy0, p.x, p.y);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}

/* =========================================================
   OUVERTURE / FICHES
   ========================================================= */
$('#b-entrer').addEventListener('click', () => {
  $('#ouverture').classList.add('partie');
  $('#hud').hidden = false;
  entre = true;
  /* on démarre sur sa dune à lui, en bas — le voyage remonte vers elle */
  cam.x = clamp(830 - W / zoom / 2, 0, MW - W / zoom);
  cam.y = clamp(1450 - H / zoom / 2, 0, MH - H / zoom);
  majCompte();
});

function ouvreLieu(l) {
  $('#f-emoji').textContent = l.emoji;
  $('#f-nom').textContent = l.nom;
  $('#f-txt').innerHTML = l.dynamique ? texteBateau() : l.txt;
  $('#fiche').hidden = false;
  if (!trouves.includes(l.id)) {
    trouves.push(l.id); sauve(); majCompte();
    eclate(l.dynamique ? posBateau() : l);
  }
}
$('#b-fermer').addEventListener('click', () => {
  $('#fiche').hidden = true;
  if (trouves.length >= LIEUX.length && !finaleVue) {
    finaleVue = true;
    setTimeout(() => { $('#final').hidden = false; }, 500);
  }
});
$('#b-final-fermer').addEventListener('click', () => { $('#final').hidden = true; });

function majCompte() { $('#compte').textContent = '💗 ' + trouves.length + ' / ' + LIEUX.length; }

/* =========================================================
   LE DESSIN DU MONDE
   =========================================================
   Tout ce qui ne bouge pas est pré-dessiné une fois dans un
   grand canvas hors écran ; chaque image ne recopie que la
   fenêtre visible. */
const fondCv = document.createElement('canvas');
fondCv.width = MW; fondCv.height = MH;
const fx = fondCv.getContext('2d');

/* petit bruit stable pour éparpiller arbres et fleurs */
const bruit = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };

function peintMonde() {
  /* la mer */
  const mer = fx.createLinearGradient(0, 0, 0, MH);
  mer.addColorStop(0, '#2e6d9e'); mer.addColorStop(.5, '#2a80ab'); mer.addColorStop(1, '#2e6d9e');
  fx.fillStyle = mer; fx.fillRect(0, 0, MW, MH);

  /* --- la terre du nord (elle) et celle du sud (lui) --- */
  const ile = (pts, sable, herbe) => {
    fx.beginPath();
    pts.forEach(([x, y], i) => i ? fx.lineTo(x, y) : fx.moveTo(x, y));
    fx.closePath();
    fx.fillStyle = sable; fx.save(); fx.lineWidth = 46; fx.strokeStyle = sable; fx.stroke(); fx.fill(); fx.restore();
    fx.save(); fx.clip();
    fx.fillStyle = herbe; fx.fill();
    fx.restore();
  };
  /* nord : sa côte à elle */
  const nord = [];
  for (let i = 0; i <= 30; i++) {
    const x = i / 30 * MW;
    nord.push([x, 430 + Math.sin(i * .9) * 55 + bruit(i, 1) * 60 - (Math.abs(x - 1520) < 300 ? 70 : 0)]);
  }
  nord.push([MW, 0], [0, 0]);
  ile(nord, '#e8d5a3', '#7fbf6a');
  /* sud : sa côte à lui */
  const sud = [];
  for (let i = 0; i <= 30; i++) {
    const x = i / 30 * MW;
    sud.push([x, 1330 - Math.sin(i * 1.1) * 50 - bruit(i, 2) * 60 + (Math.abs(x - 830) < 300 ? 60 : 0)]);
  }
  sud.push([MW, MH], [0, MH]);
  ile(sud, '#eedcab', '#8ec773');

  /* l'écume le long des côtes */
  fx.strokeStyle = 'rgba(255,255,255,.5)'; fx.lineWidth = 5; fx.setLineDash([26, 20]);
  fx.beginPath(); nord.slice(0, 31).forEach(([x, y], i) => i ? fx.lineTo(x, y + 30) : fx.moveTo(x, y + 30)); fx.stroke();
  fx.beginPath(); sud.slice(0, 31).forEach(([x, y], i) => i ? fx.lineTo(x, y - 30) : fx.moveTo(x, y - 30)); fx.stroke();
  fx.setLineDash([]);

  /* --- le trait entre les deux : la route du bateau --- */
  fx.strokeStyle = 'rgba(253,246,236,.4)'; fx.lineWidth = 4; fx.setLineDash([2, 22]); fx.lineCap = 'round';
  fx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = i / 40, x = lerp(880, 1470, k) + Math.sin(k * 9) * 60, y = lerp(1380, 430, k);
    i ? fx.lineTo(x, y) : fx.moveTo(x, y);
  }
  fx.stroke(); fx.setLineDash([]);

  /* --- arbres, fleurs, rochers éparpillés --- */
  const arbre = (x, y, t, pin) => {
    fx.fillStyle = '#6b4a2e'; fx.fillRect(x - t * .08, y - t * .1, t * .16, t * .5);
    fx.fillStyle = pin ? '#2f7a4f' : '#3f9e5c';
    if (pin) {
      for (let e = 0; e < 3; e++) {
        fx.beginPath();
        fx.moveTo(x, y - t * (1.15 - e * .28));
        fx.lineTo(x - t * (.5 - e * .1), y - t * (.35 - e * .22));
        fx.lineTo(x + t * (.5 - e * .1), y - t * (.35 - e * .22));
        fx.closePath(); fx.fill();
      }
    } else {
      fx.beginPath(); fx.arc(x, y - t * .58, t * .48, 0, 6.3);
      fx.arc(x - t * .3, y - t * .34, t * .34, 0, 6.3);
      fx.arc(x + t * .3, y - t * .34, t * .34, 0, 6.3); fx.fill();
    }
  };
  for (let i = 0; i < 90; i++) {
    const nordien = i % 2 === 0;
    const x = bruit(i, 3) * MW;
    const y = nordien ? bruit(i, 4) * 300 : 1420 + bruit(i, 5) * 330;
    const pres = LIEUX.some(l => !l.dynamique && dist2(x, y, l.x, l.y) < l.r + 60);
    if (!pres) arbre(x, y, 26 + bruit(i, 6) * 26, !nordien);
  }
  for (let i = 0; i < 130; i++) {
    const nordien = i % 2 === 0;
    const x = bruit(i, 7) * MW;
    const y = nordien ? bruit(i, 8) * 340 : 1400 + bruit(i, 9) * 360;
    fx.fillStyle = ['#ff9fbf', '#fff', '#f5c96d', '#ffb37c'][i % 4];
    fx.beginPath(); fx.arc(x, y, 4 + bruit(i, 10) * 3, 0, 6.3); fx.fill();
  }

  /* --- les lieux, dessinés une fois --- */
  peintPhare(1520, 320);
  peintDune(830, 1500);
  peintChapiteau(500, 620);
  peintPont(1180, 900);
  peintChateau(1900, 700);
  peintLanternes(1750, 1250);
  peintRoseraie(420, 1080);
  peintMusique(2050, 1550);
  peintEtoileSocle(1280, 190);

  /* les initiales gravées dans le sable */
  fx.font = '700 60px Caveat, cursive';
  fx.fillStyle = 'rgba(107,74,46,.4)'; fx.textAlign = 'center';
  fx.fillText('E + S', 2150, 1440);
}

/* ---------- chaque lieu ---------- */
function peintPhare(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = 'rgba(0,0,0,.14)'; fx.beginPath(); fx.ellipse(0, 96, 70, 16, 0, 0, 6.3); fx.fill();
  for (let i = 0; i < 5; i++) {
    fx.fillStyle = i % 2 ? '#e5487b' : '#fdf6ec';
    const w = 44 - i * 6;
    fx.fillRect(-w / 2, 60 - (i + 1) * 30, w, 30);
  }
  fx.fillStyle = '#3a3358'; fx.fillRect(-14, -100, 28, 22);
  fx.fillStyle = '#ffe9a8'; fx.fillRect(-10, -96, 20, 14);
  fx.fillStyle = '#e5487b';
  fx.beginPath(); fx.moveTo(-16, -100); fx.lineTo(0, -122); fx.lineTo(16, -100); fx.closePath(); fx.fill();
  fx.restore();
}
function peintDune(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = '#f3e3b2';
  fx.beginPath(); fx.ellipse(0, 30, 150, 46, 0, 0, 6.3); fx.fill();
  fx.strokeStyle = 'rgba(107,74,46,.25)'; fx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    fx.beginPath(); fx.moveTo(-110 + i * 18, 12 + i * 12);
    fx.quadraticCurveTo(0, 2 + i * 12, 110 - i * 14, 16 + i * 12); fx.stroke();
  }
  /* le parasol */
  fx.strokeStyle = '#6b4a2e'; fx.lineWidth = 5;
  fx.beginPath(); fx.moveTo(46, 26); fx.lineTo(56, -44); fx.stroke();
  fx.fillStyle = '#e5487b';
  fx.beginPath(); fx.arc(56, -44, 42, Math.PI, 0); fx.fill();
  fx.fillStyle = '#fdf6ec';
  for (let i = 0; i < 3; i++) { fx.beginPath(); fx.arc(56, -44, 42, Math.PI + (i * 2 + 1) * Math.PI / 6, Math.PI + (i * 2 + 2) * Math.PI / 6); fx.lineTo(56, -44); fx.fill(); }
  fx.restore();
}
/* une petite île sous un lieu posé en mer */
function ilot(x, y, rx, ry) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = '#e8d5a3';
  fx.beginPath(); fx.ellipse(0, 0, rx + 26, ry + 14, 0, 0, 6.3); fx.fill();
  fx.fillStyle = '#8ec773';
  fx.beginPath(); fx.ellipse(0, -4, rx, ry, 0, 0, 6.3); fx.fill();
  fx.strokeStyle = 'rgba(255,255,255,.5)'; fx.lineWidth = 4; fx.setLineDash([18, 14]);
  fx.beginPath(); fx.ellipse(0, 0, rx + 40, ry + 24, 0, 0, 6.3); fx.stroke();
  fx.setLineDash([]);
  fx.restore();
}

function peintChapiteau(x, y) {
  ilot(x, y + 46, 150, 62);
  fx.save(); fx.translate(x, y);
  fx.fillStyle = 'rgba(0,0,0,.14)'; fx.beginPath(); fx.ellipse(0, 74, 110, 20, 0, 0, 6.3); fx.fill();
  fx.fillStyle = '#c8384a';
  fx.beginPath(); fx.moveTo(-95, 70); fx.lineTo(-70, -6); fx.lineTo(70, -6); fx.lineTo(95, 70); fx.closePath(); fx.fill();
  fx.fillStyle = '#fdf6ec';
  for (let i = 0; i < 4; i++) { fx.beginPath(); fx.moveTo(-95 + i * 48, 70); fx.lineTo(-70 + i * 38, -6); fx.lineTo(-70 + (i + .5) * 38, -6); fx.lineTo(-95 + (i + .5) * 48, 70); fx.fill(); }
  fx.fillStyle = '#e5487b';
  fx.beginPath(); fx.moveTo(-74, -6); fx.quadraticCurveTo(0, -66, 74, -6); fx.closePath(); fx.fill();
  fx.strokeStyle = '#6b4a2e'; fx.lineWidth = 4;
  fx.beginPath(); fx.moveTo(0, -50); fx.lineTo(0, -84); fx.stroke();
  fx.fillStyle = '#f5c96d';
  fx.beginPath(); fx.moveTo(0, -84); fx.lineTo(26, -76); fx.lineTo(0, -68); fx.closePath(); fx.fill();
  fx.fillStyle = '#3a2440'; fx.beginPath(); fx.moveTo(-16, 70); fx.lineTo(0, 26); fx.lineTo(16, 70); fx.closePath(); fx.fill();
  fx.restore();
}
function peintPont(x, y) {
  fx.save(); fx.translate(x, y);
  /* un bras de rivière qui coupe la mer ? non : un îlot double */
  fx.fillStyle = '#8ec773';
  fx.beginPath(); fx.ellipse(-95, 20, 60, 34, 0, 0, 6.3); fx.fill();
  fx.beginPath(); fx.ellipse(95, 20, 60, 34, 0, 0, 6.3); fx.fill();
  fx.strokeStyle = '#8a5a3a'; fx.lineWidth = 10; fx.lineCap = 'round';
  fx.beginPath(); fx.moveTo(-70, 6); fx.quadraticCurveTo(0, -34, 70, 6); fx.stroke();
  fx.strokeStyle = '#b98a5e'; fx.lineWidth = 3;
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, px = lerp(-70, 70, k), py = 6 - Math.sin(k * Math.PI) * 38 * .95;
    fx.beginPath(); fx.moveTo(px, py); fx.lineTo(px, py + 16); fx.stroke();
  }
  /* les deux lanternes du pont */
  for (const [lx, c] of [[-95, '#ff8fb0'], [95, '#7fb0d8']]) {
    fx.strokeStyle = '#6b4a2e'; fx.lineWidth = 4;
    fx.beginPath(); fx.moveTo(lx, 10); fx.lineTo(lx, -30); fx.stroke();
    fx.fillStyle = c; fx.beginPath(); fx.arc(lx, -36, 9, 0, 6.3); fx.fill();
  }
  fx.restore();
}
function peintChateau(x, y) {
  ilot(x, y + 66, 165, 68);
  fx.save(); fx.translate(x, y);
  fx.fillStyle = 'rgba(0,0,0,.14)'; fx.beginPath(); fx.ellipse(0, 92, 120, 20, 0, 0, 6.3); fx.fill();
  const tour = (tx, th, tw) => {
    fx.fillStyle = '#ffd9e6'; fx.fillRect(tx - tw / 2, 90 - th, tw, th);
    fx.fillStyle = '#e5487b';
    fx.beginPath(); fx.moveTo(tx - tw / 2 - 8, 90 - th); fx.lineTo(tx, 90 - th - tw * 1.1); fx.lineTo(tx + tw / 2 + 8, 90 - th); fx.closePath(); fx.fill();
    fx.strokeStyle = '#6b4a2e'; fx.lineWidth = 3;
    fx.beginPath(); fx.moveTo(tx, 90 - th - tw * 1.1); fx.lineTo(tx, 90 - th - tw * 1.1 - 18); fx.stroke();
    fx.fillStyle = '#ff8fb0';
    fx.beginPath(); fx.moveTo(tx, 90 - th - tw * 1.1 - 18); fx.lineTo(tx + 16, 90 - th - tw * 1.1 - 12); fx.lineTo(tx, 90 - th - tw * 1.1 - 6); fx.closePath(); fx.fill();
    fx.fillStyle = '#b06880'; fx.fillRect(tx - 5, 90 - th + 12, 10, 14);
  };
  tour(-70, 110, 44); tour(70, 110, 44); tour(0, 150, 56);
  fx.fillStyle = '#ffd9e6'; fx.fillRect(-70, 40, 140, 50);
  fx.fillStyle = '#b06880';
  fx.beginPath(); fx.arc(0, 90, 22, Math.PI, 0); fx.fill(); fx.fillRect(-22, 90, 44, 1);
  fx.restore();
}
function peintLanternes(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = '#8ec773';
  fx.beginPath(); fx.ellipse(0, 60, 110, 34, 0, 0, 6.3); fx.fill();
  for (let i = 0; i < 9; i++) {
    const lx = -80 + (i % 3) * 80 + bruit(i, 11) * 30, ly = -20 - Math.floor(i / 3) * 52 - bruit(i, 12) * 22;
    fx.fillStyle = 'rgba(245,201,109,.28)';
    fx.beginPath(); fx.arc(lx, ly, 26, 0, 6.3); fx.fill();
    fx.fillStyle = '#f5c96d';
    fx.beginPath(); fx.roundRect(lx - 11, ly - 16, 22, 30, 8); fx.fill();
    fx.fillStyle = '#e08a3c'; fx.fillRect(lx - 7, ly - 19, 14, 4); fx.fillRect(lx - 7, ly + 13, 14, 3);
  }
  fx.restore();
}
function peintRoseraie(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = '#8ec773';
  fx.beginPath(); fx.ellipse(0, 44, 100, 30, 0, 0, 6.3); fx.fill();
  fx.strokeStyle = '#fdf6ec'; fx.lineWidth = 5;
  fx.strokeRect(-84, -34, 168, 84);
  for (let i = 0; i < 12; i++) {
    const rx = -66 + (i % 4) * 44, ry = -14 + Math.floor(i / 4) * 30;
    fx.strokeStyle = '#3f7a3c'; fx.lineWidth = 3;
    fx.beginPath(); fx.moveTo(rx, ry + 14); fx.lineTo(rx, ry); fx.stroke();
    fx.fillStyle = i % 3 ? '#e5487b' : '#ff8fb0';
    fx.beginPath(); fx.arc(rx, ry - 5, 8, 0, 6.3); fx.fill();
    fx.fillStyle = 'rgba(255,255,255,.5)';
    fx.beginPath(); fx.arc(rx - 2.5, ry - 7.5, 2.6, 0, 6.3); fx.fill();
  }
  fx.restore();
}
function peintMusique(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = 'rgba(0,0,0,.14)'; fx.beginPath(); fx.ellipse(0, 56, 76, 14, 0, 0, 6.3); fx.fill();
  fx.fillStyle = '#8a5a3a'; fx.beginPath(); fx.roundRect(-60, -10, 120, 62, 8); fx.fill();
  fx.fillStyle = '#a06e48'; fx.beginPath(); fx.roundRect(-60, -30, 120, 26, 8); fx.fill();
  fx.fillStyle = '#f5c96d'; fx.fillRect(-60, -8, 120, 6);
  /* la ballerine-cœur */
  fx.strokeStyle = '#e5487b'; fx.lineWidth = 3;
  fx.beginPath(); fx.moveTo(0, -30); fx.lineTo(0, -52); fx.stroke();
  fx.fillStyle = '#e5487b';
  fx.beginPath();
  fx.moveTo(0, -46); fx.bezierCurveTo(-12, -58, -6, -68, 0, -60);
  fx.bezierCurveTo(6, -68, 12, -58, 0, -46); fx.fill();
  fx.restore();
}
function peintEtoileSocle(x, y) {
  fx.save(); fx.translate(x, y);
  fx.fillStyle = '#d8c9a0';
  fx.beginPath(); fx.ellipse(0, 66, 46, 14, 0, 0, 6.3); fx.fill();
  fx.fillStyle = '#c9b391'; fx.fillRect(-8, 20, 16, 46);
  fx.restore();
}

peintMonde();

/* =========================================================
   CE QUI VIT (dessiné à chaque image par-dessus le fond)
   ========================================================= */

/* le ciel selon l'heure vraie */
function lumiere() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  /* 0 = plein jour, 1 = pleine nuit */
  if (h >= 8 && h < 19) return 0;
  if (h >= 22 || h < 6) return 1;
  if (h >= 19 && h < 22) return (h - 19) / 3;
  return 1 - (h - 6) / 2;
}

function etoileVive(x, y, r, now) {
  const b = 1 + Math.sin(now * 0.003) * 0.12;
  cx.save(); cx.translate(x, y); cx.rotate(Math.sin(now * 0.0008) * 0.1); cx.scale(b, b);
  const g = cx.createRadialGradient(0, 0, 2, 0, 0, r * 2.4);
  g.addColorStop(0, 'rgba(255,233,168,.8)'); g.addColorStop(1, 'rgba(255,233,168,0)');
  cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, r * 2.4, 0, 6.3); cx.fill();
  cx.fillStyle = '#ffe9a8';
  cx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r;
    cx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  cx.closePath(); cx.fill();
  cx.restore();
}

let eclats = [];
function eclate(p) {
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * 6.3, v = 1.5 + Math.random() * 4;
    eclats.push({ x: p.x, y: p.y - 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, vie: 1, t: 9 + Math.random() * 12 });
  }
}
function coeurV(x, y, t, col, a) {
  cx.save(); cx.translate(x, y); cx.rotate(a || 0); cx.scale(t / 20, t / 20);
  cx.fillStyle = col;
  cx.beginPath(); cx.moveTo(0, 7);
  cx.bezierCurveTo(-14, -6, -9, -19, 0, -11);
  cx.bezierCurveTo(9, -19, 14, -6, 0, 7); cx.fill();
  cx.restore();
}

/* Milo court dans le monde */
const milo = { x: 1000, y: 1560, cible: null };
function majMilo(now) {
  if (!milo.cible || dist2(milo.x, milo.y, milo.cible.x, milo.cible.y) < 20) {
    milo.cible = { x: 300 + bruit(now | 0, 13) * 1800, y: 1420 + bruit(now | 0, 14) * 300 };
  }
  const d = dist2(milo.x, milo.y, milo.cible.x, milo.cible.y);
  milo.x += (milo.cible.x - milo.x) / d * 1.4;
  milo.y += (milo.cible.y - milo.y) / d * 1.4;
  const dir = milo.cible.x > milo.x ? 1 : -1;
  const bond = Math.abs(Math.sin(now * 0.012)) * 7;
  cx.save(); cx.translate(milo.x, milo.y - bond); cx.scale(dir, 1);
  cx.fillStyle = 'rgba(0,0,0,.18)'; cx.beginPath(); cx.ellipse(0, 12 + bond, 16, 4, 0, 0, 6.3); cx.fill();
  cx.fillStyle = '#8a5a3a';
  cx.beginPath(); cx.ellipse(0, 0, 15, 9, 0, 0, 6.3); cx.fill();          /* corps */
  cx.beginPath(); cx.arc(13, -7, 8, 0, 6.3); cx.fill();                    /* tête */
  cx.beginPath(); cx.ellipse(16, -13, 3.4, 5, .5, 0, 6.3); cx.fill();      /* oreille */
  cx.strokeStyle = '#8a5a3a'; cx.lineWidth = 3; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-13, 2); cx.quadraticCurveTo(-20, -6 + Math.sin(now * .02) * 4, -24, -2); cx.stroke();
  cx.fillStyle = '#3a2440'; cx.beginPath(); cx.arc(20, -8, 1.8, 0, 6.3); cx.fill();
  cx.restore();
}

/* les nuages */
const NUAGES = Array.from({ length: 7 }, (_, i) => ({
  y: 150 + bruit(i, 15) * 1400, v: 0.06 + bruit(i, 16) * 0.1, t: .7 + bruit(i, 17) * .8, d: bruit(i, 18) * MW
}));

function boucle(now) {
  requestAnimationFrame(boucle);

  /* inertie du glisser */
  if (!doigt && (Math.abs(vx) > .05 || Math.abs(vy) > .05)) {
    cam.x += vx; cam.y += vy; vx *= .93; vy *= .93; borne();
  }
  /* vol de boussole */
  if (vole) {
    vole.t += 0.026;
    const k = vole.t < .5 ? 2 * vole.t * vole.t : 1 - Math.pow(-2 * vole.t + 2, 2) / 2;
    cam.x = lerp(vole.x0, vole.x1, Math.min(1, k));
    cam.y = lerp(vole.y0, vole.y1, Math.min(1, k));
    if (vole.t >= 1) vole = null;
    borne();
  }

  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.save();
  cx.scale(zoom, zoom);
  cx.translate(-cam.x, -cam.y);

  /* le fond pré-dessiné */
  cx.drawImage(fondCv, 0, 0);

  /* les vagues qui scintillent */
  for (let i = 0; i < 40; i++) {
    const wx = (bruit(i, 19) * MW + now * 0.02 * (1 + bruit(i, 20))) % MW;
    const wy = 500 + bruit(i, 21) * 780;
    cx.globalAlpha = .25 + .25 * Math.sin(now * 0.002 + i);
    cx.strokeStyle = '#cfe9f5'; cx.lineWidth = 3; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(wx, wy); cx.lineTo(wx + 26, wy); cx.stroke();
  }
  cx.globalAlpha = 1;

  /* les nuages */
  for (const n of NUAGES) {
    const nx = (n.d + now * n.v * 0.06) % (MW + 400) - 200;
    cx.globalAlpha = .5;
    cx.fillStyle = '#fff';
    cx.beginPath();
    cx.arc(nx, n.y, 34 * n.t, 0, 6.3); cx.arc(nx + 30 * n.t, n.y - 12 * n.t, 26 * n.t, 0, 6.3);
    cx.arc(nx + 58 * n.t, n.y, 30 * n.t, 0, 6.3); cx.fill();
    cx.globalAlpha = 1;
  }

  /* le bateau, à sa position du jour */
  const b = posBateau();
  const roulis = Math.sin(now * 0.0016) * 0.06;
  cx.save(); cx.translate(b.x, b.y + Math.sin(now * 0.0022) * 4); cx.rotate(roulis);
  cx.fillStyle = 'rgba(0,0,0,.2)'; cx.beginPath(); cx.ellipse(0, 26, 42, 8, 0, 0, 6.3); cx.fill();
  cx.fillStyle = '#8a5a3a';
  cx.beginPath(); cx.moveTo(-44, 6); cx.lineTo(44, 6); cx.lineTo(28, 26); cx.lineTo(-28, 26); cx.closePath(); cx.fill();
  cx.strokeStyle = '#6b4a2e'; cx.lineWidth = 5;
  cx.beginPath(); cx.moveTo(0, 6); cx.lineTo(0, -58); cx.stroke();
  cx.fillStyle = '#fdf6ec';
  cx.beginPath(); cx.moveTo(2, -56); cx.quadraticCurveTo(40, -36, 2, -12); cx.closePath(); cx.fill();
  coeurV(14, -34, 11, '#e5487b', 0);
  cx.restore();
  /* son sillage */
  cx.strokeStyle = 'rgba(255,255,255,.4)'; cx.lineWidth = 3;
  cx.beginPath(); cx.moveTo(b.x - 20, b.y + 30); cx.quadraticCurveTo(b.x - 60, b.y + 40 + Math.sin(now * .003) * 6, b.x - 100, b.y + 34); cx.stroke();

  /* l'étoile vivante + le phare qui balaie la nuit */
  etoileVive(1280, 150, 34, now);
  const nuit = lumiere();
  if (nuit > 0.05) {
    const a = now * 0.0011;
    cx.save(); cx.translate(1520, 320 - 90);
    cx.globalAlpha = nuit * .5;
    const fais = cx.createLinearGradient(0, 0, Math.cos(a) * 500, Math.sin(a) * 500);
    fais.addColorStop(0, 'rgba(255,233,168,.8)'); fais.addColorStop(1, 'rgba(255,233,168,0)');
    cx.fillStyle = fais;
    cx.beginPath(); cx.moveTo(0, 0);
    cx.arc(0, 0, 520, a - 0.09, a + 0.09);
    cx.closePath(); cx.fill();
    cx.restore(); cx.globalAlpha = 1;
  }

  /* Milo */
  majMilo(now);

  /* les cœurs au-dessus des lieux pas encore trouvés */
  if (entre) for (const l of LIEUX) {
    if (trouves.includes(l.id)) continue;
    const p = l.dynamique ? posBateau() : l;
    const fl = Math.sin(now * 0.004 + p.x) * 6;
    coeurV(p.x, p.y - l.r + 4 + fl, 15, '#e5487b', 0);
    cx.globalAlpha = .35;
    coeurV(p.x, p.y - l.r + 4 + fl, 22, '#ff8fb0', 0);
    cx.globalAlpha = 1;
  }

  /* les éclats de découverte */
  for (const e of eclats) { e.x += e.vx; e.y += e.vy; e.vy += .12; e.vie -= .014; }
  eclats = eclats.filter(e => e.vie > 0);
  for (const e of eclats) {
    cx.globalAlpha = clamp(e.vie, 0, 1);
    coeurV(e.x, e.y, e.t, '#f5c96d', e.vie * 3);
  }
  cx.globalAlpha = 1;

  /* la nuit tombe sur le monde entier */
  if (nuit > 0.02) {
    cx.fillStyle = `rgba(10,14,40,${nuit * 0.5})`;
    cx.fillRect(cam.x - 50, cam.y - 50, W / zoom + 100, H / zoom + 100);
    /* les fenêtres et lanternes s'allument */
    cx.globalAlpha = nuit;
    for (const [px, py] of [[1520, 224], [1900, 640], [1893, 812], [1750, 1190], [2050, 1516]]) {
      const g = cx.createRadialGradient(px, py, 2, px, py, 46);
      g.addColorStop(0, 'rgba(255,233,168,.7)'); g.addColorStop(1, 'rgba(255,233,168,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(px, py, 46, 0, 6.3); cx.fill();
    }
    cx.globalAlpha = 1;
  }

  cx.restore();

  /* ---- HUD ---- */
  if (entre) {
    const l = prochain();
    if (l) {
      const p = l.dynamique ? posBateau() : l;
      const ang = Math.atan2(p.y - (cam.y + H / zoom / 2), p.x - (cam.x + W / zoom / 2));
      $('#aiguille').style.transform = 'rotate(' + (ang * 180 / Math.PI) + 'deg)';
    } else {
      $('#aiguille').textContent = '💗';
      $('#aiguille').style.transform = 'none';
    }
    const d = new Date();
    $('#heure').textContent =
      (nuit > 0.5 ? '🌙 ' : nuit > 0.05 ? '🌆 ' : '☀️ ') +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') +
      ' · J−' + joursRestants();
  }
}
requestAnimationFrame(boucle);

/* pour lui : ?reset efface les cœurs · ?carte[=x,y] saute l'ouverture */
if (PARAMS.has('carte')) {
  $('#ouverture').classList.add('partie');
  $('#ouverture').style.display = 'none';
  $('#hud').hidden = false;
  entre = true;
  const v = (PARAMS.get('carte') || '').split(',').map(Number);
  const cx0 = v.length === 2 && !isNaN(v[0]) ? v[0] : 830;
  const cy0 = v.length === 2 && !isNaN(v[1]) ? v[1] : 1450;
  cam.x = clamp(cx0 - W / zoom / 2, 0, MW - W / zoom);
  cam.y = clamp(cy0 - H / zoom / 2, 0, MH - H / zoom);
  majCompte();
}
