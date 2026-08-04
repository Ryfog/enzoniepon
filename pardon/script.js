/* =========================================================
   POUR TOI — petite page tendre
   ========================================================= */
const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);

/* ============ LES PETITS NOMS ============ */
const NOMS = [
  ['mon bébé d\'amour', '🤍', 'Celui-là, c\'est le vrai. C\'est celui que je pense sans le dire assez.'],
  ['mon petit cœur', '💞', 'Pour les matins où tu es toute décoiffée et où tu ne veux pas te lever.'],
  ['mon cœur', '💗', 'Parce que ce n\'est pas une image. C\'est vraiment là que tu es.'],
  ['ma princesse', '👑', 'Et tu n\'as rien à faire pour le mériter. C\'est déjà acquis.'],
  ['mon chat', '🐱', 'Pour quand tu viens te coller contre moi sans rien dire.'],
  ['mon trésor', '✨', 'J\'ai de la chance. Je le sais. J\'oublie juste de le montrer.']
];

/* ============ LES PROMESSES ============ */
const PROMESSES = [
  'Te dire bonne nuit tous les soirs. Vraiment tous.',
  'T\'envoyer un message le matin sans que tu aies à le demander.',
  'Te dire que tu es belle quand je le pense — donc beaucoup plus souvent.',
  'Te demander comment s\'est passée ta journée, et écouter la réponse en entier.',
  'Arrêter de croire que tu sais déjà ce que je ressens.',
  'Te faire rire au moins une fois par jour.',
  'M\'excuser tout de suite quand je me trompe, au lieu de laisser passer.',
  'Te le dire avec ma voix, pas seulement par écrit.'
];

/* ============ ÉTAT ============ */
const CLE = 'pardon_stacy';
/* on lit les paramètres UNE fois : ?reset nettoie l'URL juste après,
   sinon les vérifications suivantes ne verraient plus rien */
const PARAMS = location.search;
let trouves = [];
try { trouves = JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { trouves = []; }
const sauve = () => { try { localStorage.setItem(CLE, JSON.stringify(trouves)); } catch (e) {} };
/* on jette les index devenus invalides si la liste des noms a changé */
trouves = trouves.filter(i => Number.isInteger(i) && i >= 0 && i < NOMS.length);

/* ?tout : ouvre directement la fin, pour relire sans tout retoucher */
if (/[?&]tout/.test(PARAMS)) trouves = NOMS.map((_, i) => i);
if (/[?&]reset/.test(PARAMS)) {
  trouves = [];
  try { localStorage.removeItem(CLE); } catch (e) {}
  history.replaceState(null, '', location.pathname);
}

/* ============ FENÊTRE ============ */
const pop = $('#pop');
function fenetre(titre, texte, emo) {
  $('#pop-t').textContent = titre;
  $('#pop-p').textContent = texte;
  $('#pop-e').textContent = emo;
  pop.hidden = false;
}
const ferme = () => { pop.hidden = true; };
$('#pop-x').addEventListener('click', ferme);
$('#pop-ok').addEventListener('click', ferme);
pop.addEventListener('click', e => { if (e.target === pop) ferme(); });

/* ============ CŒURS QUI MONTENT ============ */
const cv = $('#coeurs'), cx = cv.getContext('2d');
let bulles = [], anime = false;
const taille = () => { cv.width = innerWidth; cv.height = innerHeight; };
taille(); addEventListener('resize', taille);
const TEINTES = ['#e8899e', '#ffb59c', '#c4a8e0', '#f2c66b', '#ffffff'];

function coeur(g, x, y, s, col, a) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, 5);
  g.bezierCurveTo(-11, -4, -7, -13, 0, -7);
  g.bezierCurveTo(7, -13, 11, -4, 0, 5);
  g.fill(); g.restore();
}

/* quelques cœurs qui montent doucement, en fond */
function souffle(n, ox, oy) {
  const x = ox === undefined ? rnd(0, innerWidth) : ox;
  const y = oy === undefined ? innerHeight + 20 : oy;
  for (let i = 0; i < n; i++) bulles.push({
    x: x + rnd(-24, 24), y: y + rnd(-14, 14),
    vx: rnd(-.5, .5), vy: rnd(-1.9, -.7),
    s: rnd(.55, 1.35), c: pick(TEINTES), v: 1, os: rnd(0, 6.3)
  });
  if (bulles.length > 160) bulles.splice(0, bulles.length - 160);
  if (!anime) tourne();
}
function tourne() {
  anime = true;
  (function pas() {
    cx.clearRect(0, 0, cv.width, cv.height);
    bulles = bulles.filter(b => b.v > 0 && b.y > -40);
    bulles.forEach(b => {
      b.os += .04;
      b.x += b.vx + Math.sin(b.os) * .5;
      b.y += b.vy;
      b.v -= .0032;
      coeur(cx, b.x, b.y, b.s, b.c, Math.max(0, b.v) * .75);
    });
    if (bulles.length) requestAnimationFrame(pas);
    else { cx.clearRect(0, 0, cv.width, cv.height); anime = false; }
  })();
}
setInterval(() => { if (!document.hidden) souffle(1); }, 1100);

/* ============ ENTRÉE ============ */
$('#pli-btn').addEventListener('click', () => {
  $('#pli').classList.add('parti');
  souffle(26, innerWidth / 2, innerHeight * .7);
  setTimeout(() => { $('#pli').style.display = 'none'; }, 850);
});
/* ?ouvert : saute le mot plié (pratique pour relire la page) */
if (/[?&]ouvert/.test(PARAMS)) $('#pli').style.display = 'none';

/* ============ LES PETITS NOMS ============ */
(function petitsNoms() {
  const box = $('#noms');
  NOMS.forEach(([nom, emo, mot], i) => {
    const b = document.createElement('button');
    b.className = 'nom';
    b.textContent = nom;
    if (trouves.includes(i)) b.classList.add('on');
    b.addEventListener('click', () => {
      if (!b.classList.contains('on')) {
        b.classList.add('on');
        if (!trouves.includes(i)) { trouves.push(i); sauve(); }
        const r = b.getBoundingClientRect();
        souffle(12, r.left + r.width / 2, r.top + r.height / 2);
        majCompteur();
      }
      fenetre(nom, mot, emo);
    });
    box.appendChild(b);
  });
  majCompteur();
})();

function majCompteur() {
  const n = trouves.length;
  $('#compteur').textContent = `${n} / ${NOMS.length}`;
  const reste = NOMS.length - n;
  if (n >= NOMS.length) {
    $('#final').classList.add('ouvert');
    $('#cad-l').textContent = '';
  } else {
    $('#cad-l').textContent = reste === 1
      ? 'Il te manque encore un petit nom.'
      : `Touche les ${reste} petits noms qui restent.`;
  }
}

/* ============ LES PROMESSES ============ */
(function promesses() {
  const ul = $('#promesses');
  PROMESSES.forEach((p, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = (i * .06) + 's';
    li.innerHTML = `<b>${i + 1}</b><span></span>`;
    li.querySelector('span').textContent = p;
    ul.appendChild(li);
  });
})();

/* ============ LE FINAL ============ */
const REPONSES = [
  'Alors viens. Je t\'attends. 🤍',
  'Je décroche dans deux secondes.',
  'C\'est la meilleure nouvelle de ma journée.',
  'Vite. J\'ai des trucs à te dire.'
];
$('#oui').addEventListener('click', () => {
  souffle(70, innerWidth / 2, innerHeight * .55);
  $('#f-note').textContent = pick(REPONSES);
  fenetre('À tout de suite mon chat 🐱',
    'Appelle-moi. Ou laisse-moi t\'appeler. Peu importe qui commence, du moment qu\'on s\'entend.',
    '📞');
});
