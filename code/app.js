/* =========================================================
   LE CODE — l'application
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const melange = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const img = p => `<img src="pan/${p.id}.svg" alt="Panneau ${p.nom}" loading="lazy" width="120" height="120">`;
const sansAccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ============ NAVIGATION ============ */
function vue(nom) {
  $$('.vue').forEach(v => v.classList.toggle('on', v.id === 'v-' + nom));
  $$('.onglet').forEach(o => o.classList.toggle('actif', o.dataset.vue === nom));
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (nom === 'cartes' && !carteEnCours) carteSuivante();
}
$$('[data-vue]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); vue(b.dataset.vue); }));

/* ============ LES PANNEAUX ============ */
let filtre = 'tous', recherche = '';

function affichePanneaux() {
  const g = $('#grille-panneaux');
  const q = sansAccent(recherche.trim());
  let total = 0;
  g.innerHTML = CATEGORIES.map(c => {
    if (filtre !== 'tous' && filtre !== c.id) return '';
    const liste = PANNEAUX.filter(p => p.cat === c.id &&
      (!q || sansAccent(p.nom).includes(q) || sansAccent(p.quoi).includes(q)));
    if (!liste.length) return '';
    total += liste.length;
    return `<div class="bloc-cat">
      <h2>${c.nom}</h2>
      <p class="regle-cat"><b>${c.forme}.</b> ${c.regle}</p>
      <div class="grille">${liste.map(p =>
        `<div class="panneau" data-id="${p.id}" tabindex="0">${img(p)}<b>${p.nom}</b></div>`).join('')}</div>
    </div>`;
  }).join('');
  $('#rien').hidden = total > 0;
}

$('#filtres').innerHTML = `<button class="filtre actif" data-f="tous">Tous</button>` +
  CATEGORIES.map(c => `<button class="filtre" data-f="${c.id}">${c.nom}</button>`).join('');
$('#filtres').addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  filtre = b.dataset.f;
  $$('.filtre').forEach(f => f.classList.toggle('actif', f === b));
  affichePanneaux();
});
$('#chercher').addEventListener('input', e => { recherche = e.target.value; affichePanneaux(); });

/* --- la fiche d'un panneau --- */
function ouvre(id) {
  const p = PANNEAUX.find(x => x.id === id); if (!p) return;
  const c = CATEGORIES.find(x => x.id === p.cat);
  $('#f-svg').innerHTML = img(p);
  $('#f-cat').textContent = c ? c.nom : '';
  $('#f-nom').textContent = p.nom;
  $('#f-quoi').textContent = p.quoi;
  $('#f-faire').textContent = p.faire;
  $('#fenetre').hidden = false;
}
document.addEventListener('click', e => {
  const p = e.target.closest('.panneau');
  if (p) ouvre(p.dataset.id);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $('#fenetre').hidden = true;
  const p = document.activeElement && document.activeElement.closest('.panneau');
  if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ouvre(p.dataset.id); }
});
$('#fermer').addEventListener('click', () => { $('#fenetre').hidden = true; });
$('#fenetre-fond').addEventListener('click', () => { $('#fenetre').hidden = true; });

/* ============ LES FICHES DE RÈGLES ============ */
$('#fiches').innerHTML = FICHES.map(f => `
  <div class="fiche">
    <h2><span>${f.emoji}</span>${f.titre}</h2>
    <table>${f.lignes.map(([g, v, d]) =>
      `<tr><td>${g}</td><td><b class="val">${v}</b><span class="det">${d}</span></td></tr>`).join('')}</table>
    <p class="note">${f.note}</p>
  </div>`).join('');

/* ============ RÉVISION ============ */
let carteEnCours = null, vues = 0, paquet = [];

function carteSuivante() {
  if (!paquet.length) paquet = melange(PANNEAUX);
  carteEnCours = paquet.pop();
  $('#carte').classList.remove('tournee');
  /* on attend la fin de la rotation avant de changer le contenu */
  setTimeout(() => {
    $('#c-svg').innerHTML = img(carteEnCours);
    $('#c-nom').textContent = carteEnCours.nom;
    $('#c-quoi').textContent = carteEnCours.quoi;
    $('#c-faire').textContent = carteEnCours.faire;
  }, 180);
  vues++;
  $('#c-compte').textContent = vues + ' panneau' + (vues > 1 ? 'x' : '') + ' vu' + (vues > 1 ? 's' : '') +
    ' · ' + paquet.length + ' restant' + (paquet.length > 1 ? 's' : '') + ' dans le paquet';
}
$('#c-retourner').addEventListener('click', () => $('#carte').classList.toggle('tournee'));
$('#carte').addEventListener('click', () => $('#carte').classList.toggle('tournee'));
$('#c-suivant').addEventListener('click', e => { e.stopPropagation(); carteSuivante(); });

/* ============ QUIZ ============ */
const PAR_QUIZ = 10;
let série = [], n = 0, bonnes = 0, ratees = [], repondu = false;

const CLE = 'code_meilleur';
let meilleur = 0;
try { meilleur = parseInt(localStorage.getItem(CLE) || '0', 10) || 0; } catch (e) {}
function majPasse() {
  $('#q-passe').textContent = meilleur ? 'Ton meilleur score : ' + meilleur + ' / ' + PAR_QUIZ : '';
}
majPasse();

$('#q-demarrer').addEventListener('click', demarre);
$('#q-rejouer').addEventListener('click', demarre);

function demarre() {
  série = melange(QUESTIONS).slice(0, PAR_QUIZ);
  n = 0; bonnes = 0; ratees = [];
  $('#q-accueil').hidden = true;
  $('#q-fin').hidden = true;
  $('#q-jeu').hidden = false;
  pose();
}

function pose() {
  const q = série[n];
  repondu = false;
  $('#q-num').textContent = (n + 1) + ' / ' + PAR_QUIZ;
  $('#q-score').textContent = bonnes + ' bonne' + (bonnes > 1 ? 's' : '');
  $('#q-avance').style.width = (n / PAR_QUIZ) * 100 + '%';
  $('#q-texte').textContent = q.q;
  $('#q-explication').hidden = true;
  /* on mélange l'ordre des réponses, mais on garde la trace de la bonne */
  const ordre = melange(q.r.map((txt, i) => ({ txt, i })));
  $('#q-reponses').innerHTML = ordre.map(o =>
    `<button class="rep" data-i="${o.i}">${o.txt}</button>`).join('');
}

$('#q-reponses').addEventListener('click', e => {
  const b = e.target.closest('.rep');
  if (!b || repondu) return;
  repondu = true;
  const q = série[n], choix = +b.dataset.i, juste = choix === q.b;
  if (juste) bonnes++; else ratees.push({ q: q.q, bonne: q.r[q.b], e: q.e });

  $$('#q-reponses .rep').forEach(r => {
    r.disabled = true;
    const i = +r.dataset.i;
    if (i === q.b) { r.classList.add('bonne'); r.innerHTML += '<span class="marque-rep">✓</span>'; }
    else if (r === b) { r.classList.add('mauvaise'); r.innerHTML += '<span class="marque-rep">✕</span>'; }
  });
  $('#q-score').textContent = bonnes + ' bonne' + (bonnes > 1 ? 's' : '');
  $('#q-exp-txt').textContent = q.e;
  $('#q-explication').hidden = false;
  $('#q-suivante').textContent = n + 1 >= PAR_QUIZ ? 'Voir le résultat' : 'Question suivante';
});

$('#q-suivante').addEventListener('click', () => {
  if (n + 1 >= PAR_QUIZ) return termine();
  n++; pose();
});

function termine() {
  $('#q-jeu').hidden = true;
  $('#q-fin').hidden = false;
  $('#q-avance').style.width = '100%';
  const reussi = bonnes >= 8;
  $('#q-note').textContent = bonnes + '/' + PAR_QUIZ;
  $('#q-note').className = 'note ' + (reussi ? 'ok' : 'ko');
  $('#q-verdict').textContent = reussi ? 'Ça passe.' : 'Pas encore.';
  $('#q-detail').textContent = reussi
    ? 'À l\'examen, il faut 35 bonnes réponses sur 40 — soit le même niveau d\'exigence.'
    : 'Il faut 8 bonnes réponses sur 10 pour être au niveau de l\'examen. Revois les questions ci-dessous.';
  $('#q-revoir').innerHTML = ratees.map(r =>
    `<div class="rate"><b>${r.q}</b><span>Bonne réponse : ${r.bonne} — ${r.e}</span></div>`).join('');
  if (bonnes > meilleur) {
    meilleur = bonnes;
    try { localStorage.setItem(CLE, String(meilleur)); } catch (e) {}
  }
  majPasse();
  $('#q-accueil').hidden = false;
}

/* ============ DÉPART ============ */
affichePanneaux();
