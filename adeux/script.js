'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- réglages retenus d'une fois sur l'autre ---------- */
const CLE = 'adeux_v1';
let etat = { noms: ['Enzo', 'Stacy'], actifs: ['doux', 'nous', 'drole', 'futur'], vus: {} };
try { Object.assign(etat, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) {}
const garde = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };

$('#n1').value = etat.noms[0] || 'Enzo';
$('#n2').value = etat.noms[1] || 'Stacy';

/* ---------- les cases de thèmes ---------- */
const cats = $('#cats');
for (const [id, j] of Object.entries(JEUX)) {
  const b = document.createElement('button');
  b.className = 'cat' + (j.chaud ? ' chaud' : '');
  b.dataset.id = id;
  b.style.setProperty('--c', j.couleur);
  b.innerHTML = `<i>${j.emoji}</i><b>${j.nom}</b><small>${j.q.length}</small>`;
  b.addEventListener('click', () => {
    const k = etat.actifs.indexOf(id);
    if (k >= 0) etat.actifs.splice(k, 1); else etat.actifs.push(id);
    majCats(); garde();
  });
  cats.appendChild(b);
}
function majCats() {
  let n = 0;
  for (const b of cats.children) {
    const on = etat.actifs.includes(b.dataset.id);
    b.classList.toggle('on', on);
    if (on) n += JEUX[b.dataset.id].q.length;
  }
  $('#compte').textContent = n ? n + ' questions dans le paquet' : 'Choisis au moins un thème';
  $('#demarrer').disabled = n === 0;
}
majCats();

/* ---------- le paquet ---------- */
let paquet = [], i = 0, tour = 0;

function fabriquePaquet() {
  const tout = [];
  for (const id of etat.actifs) {
    const j = JEUX[id];
    if (!j) continue;
    j.q.forEach((q, k) => tout.push({ id, q, k, duo: !!j.duo }));
  }
  /* on écarte ce qui a déjà été vu, sauf si tout a été vu */
  const vus = etat.vus || {};
  let frais = tout.filter(x => !(vus[x.id] || []).includes(x.k));
  if (frais.length < 3) { etat.vus = {}; frais = tout; }
  return melange(frais);
}
const melange = a => { const b = [...a]; for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [b[k], b[j]] = [b[j], b[k]]; } return b; };

/* ---------- écrans ---------- */
const vue = id => $$('.vue').forEach(v => v.classList.toggle('on', v.id === id));

$('#demarrer').addEventListener('click', () => {
  etat.noms = [$('#n1').value.trim() || 'Toi', $('#n2').value.trim() || 'Elle'];
  garde();
  paquet = fabriquePaquet();
  i = 0; tour = 0;
  if (!paquet.length) return;
  vue('v-jeu');
  montre();
});

$('#quitter').addEventListener('click', () => vue('v-accueil'));

/* ---------- afficher une question ---------- */
function montre() {
  if (i >= paquet.length) { paquet = fabriquePaquet(); i = 0; }
  const c = paquet[i];
  const j = JEUX[c.id];

  /* on retient qu'elle a été vue */
  (etat.vus[c.id] = etat.vus[c.id] || []).push(c.k);
  garde();

  const carte = $('#carte');
  carte.classList.remove('entre');
  void carte.offsetWidth;              /* relance l'animation */
  carte.classList.add('entre');
  carte.style.setProperty('--c', j.couleur);

  $('#pastille').textContent = j.emoji + ' ' + j.nom;
  $('#pastille').style.setProperty('--c', j.couleur);
  $('#cat-nom').textContent = j.nom;
  $('#question').textContent = c.q;
  $('#avance').textContent = (i + 1);

  const duo = c.duo;
  $('#qui').hidden = !duo;
  if (duo) {
    $('#q1').textContent = etat.noms[0];
    $('#q2').textContent = etat.noms[1];
    $$('.choix').forEach(b => b.classList.remove('pris'));
    $('#tour').textContent = 'Comptez à trois et montrez du doigt.';
  } else {
    /* pour les questions ouvertes, on alterne qui commence */
    $('#tour').textContent = etat.noms[tour % 2] + ' répond en premier';
  }
}

$('#suivante').addEventListener('click', () => { i++; tour++; montre(); });

/* les deux boutons « qui » servent juste à trancher ensemble */
$$('.choix').forEach(b => b.addEventListener('click', () => {
  $$('.choix').forEach(x => x.classList.toggle('pris', x === b));
  $('#tour').textContent = b.textContent + ' — d\'accord tous les deux ?';
}));

/* ---------- défi ---------- */
$('#defi').addEventListener('click', () => {
  const d = DEFIS[Math.floor(Math.random() * DEFIS.length)];
  $('#cat-nom').textContent = 'Petit défi';
  $('#question').textContent = d;
  $('#qui').hidden = true;
  $('#tour').textContent = 'À faire tous les deux, maintenant.';
  const carte = $('#carte');
  carte.style.setProperty('--c', '#f7c873');
  carte.classList.remove('entre'); void carte.offsetWidth; carte.classList.add('entre');
});

/* barre d'espace et flèche droite pour enchaîner */
document.addEventListener('keydown', e => {
  if (!$('#v-jeu').classList.contains('on')) return;
  if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); $('#suivante').click(); }
});
