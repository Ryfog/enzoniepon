/* =========================================================
   Cinéma Enzo & Stacy — second écran de la séance
   ========================================================= */
const $ = s => document.querySelector(s);

const DUREE = 74 * 60;          // duree approx du film, en secondes
const KEY   = 'cine_es';

/* ---------- les petits mots, à la minute où ils tombent ---------- */
const MOTS = [
  [0.3, 'Ça y est. On regarde la même chose, en même temps. C\'est déjà beaucoup, tu sais.'],
  [7,   'Si tu t\'endors avant la fin, je ne dirai rien. Enfin si. Un peu.'],
  [15,  'Petit rappel, au cas où tu l\'aurais oublié depuis ce matin : tu es la meilleure partie de ma journée.'],
  [24,  'Tu veux du popcorn ? Moi oui. On en partagera un vrai le 16 septembre.'],
  [33,  'Regarde-moi deux secondes au lieu de regarder l\'écran. Voilà. Merci.'],
  [42,  'Encore quelques semaines et on n\'aura plus besoin d\'un partage d\'écran pour faire ça.'],
  [51,  'Je t\'aime. C\'était tout le message. Tu peux revenir au film.'],
  [60,  'La fin approche. Moi je ne suis pas pressé du tout.'],
  [68,  'Reste avec moi après le générique, d\'accord ?']
];
const FIN = 'Voilà. Notre première séance à 873 km. La prochaine, tu seras contre moi. 🤍';

/* ---------- état ---------- */
let S = { t0: null, pause: null, cumul: 0, vus: [] };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* ---------- rideau ---------- */
const curtain = $('#curtain'), hall = $('#hall');
$('#enter').addEventListener('click', () => {
  curtain.classList.add('open');
  hall.classList.add('in');
  setTimeout(() => { curtain.classList.add('gone'); }, 1200);
  setTimeout(() => { curtain.style.display = 'none'; }, 2000);
});

/* ---------- panneaux ---------- */
const PANES = ['#pane-set', '#pane-play', '#pane-end'];
function show(id) {
  PANES.forEach(p => { $(p).hidden = (p !== id); });
}

/* ---------- le petit mot ---------- */
const note = $('#note'), noteTxt = $('#note-txt');
let noteTimer = null;
function mot(txt, duree = 13000) {
  noteTxt.textContent = txt;
  note.hidden = false;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { note.hidden = true; }, duree);
}
$('#note-x').addEventListener('click', () => { clearTimeout(noteTimer); note.hidden = true; });

/* ---------- chrono ---------- */
function ecoule() {
  if (!S.t0) return 0;
  const gel = S.pause ? (Date.now() - S.pause) : 0;
  return Math.max(0, (Date.now() - S.t0 - S.cumul - gel) / 1000);
}
function hms(s) {
  s = Math.floor(s);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const x = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${x}`;
}

let boucle = null;
function tick() {
  const e = ecoule();
  $('#tc').textContent = hms(e);
  $('#th-tc').textContent = hms(e);
  $('#bar-fill').style.width = Math.min(100, (e / DUREE) * 100).toFixed(2) + '%';

  MOTS.forEach(([min, txt], i) => {
    if (!S.vus.includes(i) && e >= min * 60) {
      S.vus.push(i); save();
      if (!S.pause) mot(txt);
    }
  });

  if (e >= DUREE) fin();
}

function lancer(reprise) {
  if (!reprise) { S = { t0: Date.now(), pause: null, cumul: 0, vus: [] }; save(); }
  show('#pane-play');
  $('#pause').textContent = S.pause ? 'Reprendre' : 'Pause';
  $('#screen').classList.toggle('paused', !!S.pause);
  $('#play-kick').textContent = S.pause ? 'Séance en pause' : 'Séance en cours';
  clearInterval(boucle);
  boucle = setInterval(tick, 250);
  tick();
}

function fin() {
  clearInterval(boucle);
  note.hidden = true;
  $('#end-txt').textContent = FIN;
  show('#pane-end');
  S.t0 = null; save();
}

/* ---------- boutons ---------- */
$('#start').addEventListener('click', () => lancer(false));

$('#pause').addEventListener('click', () => {
  if (S.pause) { S.cumul += Date.now() - S.pause; S.pause = null; }
  else { S.pause = Date.now(); }
  save();
  $('#pause').textContent = S.pause ? 'Reprendre' : 'Pause';
  $('#screen').classList.toggle('paused', !!S.pause);
  $('#play-kick').textContent = S.pause ? 'Séance en pause' : 'Séance en cours';
  $('#play-sub').textContent = S.pause
    ? 'On reprend quand tu veux. Je bouge pas.'
    : 'Bon film. Je suis juste là. 🤍';
});

$('#stop').addEventListener('click', fin);

$('#again').addEventListener('click', () => {
  S = { t0: null, pause: null, cumul: 0, vus: [] }; save();
  show('#pane-set');
});

/* ---------- mode salle : le decor derriere la fenetre du film ---------- */
const theatre = $('#theatre'), thHint = $('#th-hint');
let hintTimer = null;

function modeSalle(on) {
  theatre.hidden = !on;
  document.body.style.overflow = on ? 'hidden' : '';
  if (on) {
    thHint.classList.remove('off');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => thHint.classList.add('off'), 9000);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}
$('#salle-btn').addEventListener('click', () => modeSalle(true));
$('#th-x').addEventListener('click', () => modeSalle(false));
addEventListener('keydown', e => { if (e.key === 'Escape' && !theatre.hidden) modeSalle(false); });

/* ---------- reprise après un rafraîchissement ---------- */
function ouvrirDirect() {
  curtain.classList.add('open', 'gone');
  curtain.style.display = 'none';
  hall.classList.add('in');
}
if (S.t0) {
  ouvrirDirect();
  lancer(true);
} else {
  show('#pane-set');
  if (/[?&]salle/.test(location.search)) ouvrirDirect();   // apercu sans le rideau
}
