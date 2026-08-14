/* =========================================================
   DOUZE PETITS CADEAUX
   Les mots sont dans CADEAUX : une ligne à changer et c'est fait.
   Ce qui est ouvert est retenu, elle peut revenir plus tard.
   ========================================================= */
'use strict';

const CADEAUX = [
  { e: '🌹', t: 'Des roses',        m: 'Pas celles qu\'on offre à tout le monde. Celles-là sont pour toi, et il y en a autant que tu veux.' },
  { e: '🧁', t: 'Des macarons',     m: 'Une boîte entière. Et je te laisse même les prendre en premier, alors que tu prends toujours celui que je voulais.' },
  { e: '🐶', t: 'Milo',             m: 'Il dort. Il ronfle. Il prend toute la place. Il te ressemble un peu quand tu fais la sieste.' },
  { e: '🐱', t: 'Tigrou',           m: 'Lui il s\'en fout de tout, sauf de manger. On dirait moi devant un frigo à deux heures du matin.' },
  { e: '🧸', t: 'Un nounours',      m: 'Pour les nuits où je peux pas être là. Serre-le fort, fais comme si.' },
  { e: '🧥', t: 'Un pull à moi',    m: 'Celui que tu me piques toujours. Garde-le, il te va mieux qu\'à moi de toute façon.' },
  { e: '🍓', t: 'Des fraises',      m: 'Les grosses. Celles qu\'on mange debout dans la cuisine sans même les couper.' },
  { e: '🌙', t: 'Une bonne nuit',   m: 'Dors bien, fais de beaux rêves. Je te l\'ai déjà dit 177 fois. Ça en fait 178.' },
  { e: '🎵', t: 'Une chanson',      m: 'La nôtre. Celle qui te fait tourner la tête vers moi dès les premières notes.' },
  { e: '⭐', t: 'Une étoile',       m: 'Je l\'ai regardée en pensant à toi. Maintenant elle est à toi, tu peux lui demander ce que tu veux.' },
  { e: '📷', t: 'Une photo',        m: 'Celle que tu détestes et que je trouve magnifique. Je la garde quand même.' },
  { e: '💌', t: 'Le dernier',       m: 'Celui-là c\'est juste : tu me manques. Voilà, c\'est tout, c\'est dit.' }
];

const $ = s => document.querySelector(s);
const CLE = 'cadeaux_ouverts';

let ouverts = new Set();
try { ouverts = new Set(JSON.parse(localStorage.getItem(CLE) || '[]')); } catch (e) {}
const garde = () => { try { localStorage.setItem(CLE, JSON.stringify([...ouverts])); } catch (e) {} };

/* ---------- construction de la grille ---------- */
const grille = $('#grille');
$('#total').textContent = CADEAUX.length;

CADEAUX.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'cadeau';
  b.dataset.i = i;
  b.style.setProperty('--d', (i * 70) + 'ms');
  b.setAttribute('aria-label', 'Ouvrir le cadeau ' + (i + 1));
  b.innerHTML =
    '<span class="boite">' +
      '<span class="couvercle"></span>' +
      '<span class="ruban-v"></span>' +
      '<span class="ruban-h"></span>' +
      '<span class="noeud">🎀</span>' +
      '<span class="dedans">' + c.e + '</span>' +
    '</span>' +
    '<span class="num">' + (i + 1) + '</span>';
  b.addEventListener('click', () => ouvre(i));
  grille.appendChild(b);
});

/* ---------- ouverture ---------- */
function ouvre(i) {
  const c = CADEAUX[i];
  const b = grille.children[i];
  b.classList.add('ouvert');
  if (!ouverts.has(i)) { ouverts.add(i); garde(); majScore(); confettis(b); }

  $('#c-dessin').textContent = c.e;
  $('#c-titre').textContent = c.t;
  $('#c-mot').textContent = c.m;
  const v = $('#voile');
  v.hidden = false;
  requestAnimationFrame(() => v.classList.add('la'));
  $('#fermer').focus();
}

function ferme() {
  const v = $('#voile');
  v.classList.remove('la');
  setTimeout(() => { v.hidden = true; }, 320);
}
$('#fermer').addEventListener('click', ferme);
$('#voile').addEventListener('click', e => { if (e.target === $('#voile')) ferme(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#voile').hidden) ferme(); });

/* ---------- score et fin ---------- */
function majScore() {
  $('#fait').textContent = ouverts.size;
  const fini = ouverts.size >= CADEAUX.length;
  $('#final').hidden = !fini;
  $('#rejouer').hidden = !fini;
  if (fini) setTimeout(() => $('#final').classList.add('la'), 60);
}

/* ---------- petits cœurs qui s'envolent ---------- */
function confettis(source) {
  const r = source.getBoundingClientRect();
  const signes = ['🤍', '💗', '✨', '🌸', '💫'];
  for (let k = 0; k < 9; k++) {
    const s = document.createElement('span');
    s.className = 'envol';
    s.textContent = signes[Math.floor(Math.random() * signes.length)];
    s.style.left = (r.left + r.width / 2) + 'px';
    s.style.top = (r.top + r.height / 2) + 'px';
    s.style.setProperty('--x', (Math.random() * 180 - 90) + 'px');
    s.style.setProperty('--y', (-70 - Math.random() * 110) + 'px');
    s.style.setProperty('--r', (Math.random() * 90 - 45) + 'deg');
    s.style.animationDelay = (k * 45) + 'ms';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2200);
  }
}

$('#rejouer').addEventListener('click', () => {
  ouverts.clear(); garde();
  [...grille.children].forEach(b => b.classList.remove('ouvert'));
  $('#final').classList.remove('la');
  majScore();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* on rouvre ce qui l'avait déjà été */
ouverts.forEach(i => { if (grille.children[i]) grille.children[i].classList.add('ouvert'); });
majScore();
