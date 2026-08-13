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

/* ============ FEUX ET MARQUAGE AU SOL ============ */
$('#sol-liste').innerHTML = SOL.map(g => `
  <div class="bloc-cat">
    <h2>${g.groupe}</h2>
    <p class="regle-cat">${g.intro}</p>
    <div class="gal">${g.items.map(i => `
      <figure class="vignette">
        <img src="photos/${i.img}" alt="${i.titre}" loading="lazy">
        <figcaption><b>${i.titre}</b>${i.txt}</figcaption>
      </figure>`).join('')}</div>
  </div>`).join('');

/* ============ VOYANTS DU TABLEAU DE BORD ============ */
$('#voyants-liste').innerHTML = VOYANTS.map(g => `
  <div class="bloc-voy ${g.ton}">
    <div class="barre"></div>
    <div class="tete"><h2>${g.groupe}</h2></div>
    <p class="regle-cat">${g.intro}</p>
    <div class="grille-voy">${g.items.map(v => `
      <div class="voy">
        <div class="icone"><img src="voy/${v.id}.svg" alt="Voyant ${v.nom}" loading="lazy" width="42" height="42"></div>
        <div class="txt">
          <b>${v.nom}</b>
          <p class="quoi">${v.quoi}</p>
          <p class="faire">${v.faire}</p>
        </div>
      </div>`).join('')}</div>
  </div>`).join('');

$('#credits-voyants').textContent = CREDITS_VOYANTS;

/* Questions de quiz construites à partir des voyants eux-mêmes :
   on montre le pictogramme et on demande ce qu'il faut faire. */
const Q_VOYANTS = [
  ['huile', 'Ce voyant s\'allume en roulant. Que faites-vous ?',
   ['Je me range dès que possible et je coupe le moteur', 'Je continue jusqu\'au prochain garage', 'Je rajoute de l\'essence', 'Rien, il s\'éteint tout seul'], 0,
   'Pression d\'huile : le moteur n\'est plus lubrifié. Rouge, donc arrêt immédiat — quelques minutes suffisent à le casser.'],
  ['batterie', 'Que signale ce voyant rouge ?',
   ['L\'alternateur ne recharge plus la batterie', 'La batterie est pleine', 'Le démarreur est neuf', 'Les phares sont allumés'], 0,
   'Le moteur s\'arrêtera une fois la batterie vide. On coupe les consommateurs et on rejoint un garage.'],
  ['moteur', 'Ce voyant se met à CLIGNOTER en roulant. Que faites-vous ?',
   ['Je ralentis tout de suite', 'Je peux rouler normalement', 'J\'accélère pour le faire passer', 'Je mets les feux de détresse et je continue'], 0,
   'Fixe, il autorise à rejoindre un garage doucement. Clignotant, le catalyseur est en train de se détruire : on ralentit immédiatement.'],
  ['abs', 'Ce voyant est allumé. Qu\'est-ce que cela change pour vous ?',
   ['Les roues peuvent se bloquer au freinage d\'urgence', 'La voiture ne freine plus du tout', 'Le moteur va caler', 'Rien du tout'], 0,
   'ABS hors service : la voiture freine encore, mais roues bloquées vous perdez la direction. On allonge les distances de sécurité.'],
  ['frein-parking', 'Ce voyant reste allumé alors que le frein à main est desserré. Que faites-vous ?',
   ['Je m\'arrête : le freinage n\'est plus garanti', 'Je continue, c\'est juste le frein à main', 'Je regonfle les pneus', 'J\'attends qu\'il s\'éteigne'], 0,
   'Il signale aussi un niveau de liquide de frein trop bas. C\'est le voyant rouge le plus dangereux à ignorer.'],
  ['feux-route', 'De quelle couleur est le voyant des feux de route ?',
   ['Bleu', 'Vert', 'Orange', 'Rouge'], 0,
   'C\'est le seul voyant bleu du tableau de bord. Il rappelle de repasser en codes dès qu\'un véhicule apparaît.'],
  ['brouillard-arriere', 'Ce voyant orange est allumé alors qu\'il pleut simplement. Est-ce correct ?',
   ['Non : le feu de brouillard arrière est interdit sous la pluie', 'Oui, c\'est obligatoire sous la pluie', 'Oui, si je roule à plus de 80 km/h', 'Peu importe, c\'est un simple témoin'], 0,
   'Le feu de brouillard arrière n\'est autorisé que par brouillard ou chute de neige. Sous la pluie il éblouit celui qui vous suit.'],
  ['pression-pneus', 'Que signale ce voyant ?',
   ['Au moins un pneu est sous-gonflé', 'Les plaquettes sont usées', 'Le niveau d\'huile est bas', 'Une roue est crevée à coup sûr'], 0,
   'On contrôle à froid, aux pressions de l\'étiquette de portière. Un pneu sous-gonflé chauffe, s\'use et allonge les distances de freinage.'],
  ['esp2', 'Ce voyant CLIGNOTE pendant que vous roulez. Cela veut dire :',
   ['Le système corrige : vous êtes en train de glisser', 'Le système est en panne', 'Le régulateur est actif', 'Les pneus sont neufs'], 0,
   'Clignotant, l\'ESP travaille et vous perdez de l\'adhérence : on lève le pied. Fixe, il signale une panne du système.'],
  ['airbag', 'Ce voyant rouge est allumé en permanence. Que faut-il en conclure ?',
   ['Les airbags risquent de ne pas se déclencher', 'Les airbags viennent d\'être changés', 'Il faut boucler sa ceinture', 'C\'est le témoin de la porte'], 0,
   'C\'est un défaut du système de retenue. Une sécurité hors service se répare, elle ne s\'ignore pas.'],
  ['prechauffage', 'Ce voyant s\'allume au contact sur un diesel. Que faites-vous ?',
   ['J\'attends qu\'il s\'éteigne avant de démarrer', 'Je démarre tout de suite', 'Je fais le plein', 'Je coupe le contact'], 0,
   'Ce sont les bougies de préchauffage. Par grand froid, l\'attente est un peu plus longue.'],
  ['carburant', 'Ce voyant vient de s\'allumer sur l\'autoroute. Que faites-vous ?',
   ['Je prends la prochaine aire de service', 'Je continue, il reste 200 km', 'Je roule sur la bande d\'arrêt d\'urgence pour économiser', 'Je coupe le moteur dans les descentes'], 0,
   'Il reste en général 50 à 80 km. La panne sèche sur autoroute est une immobilisation dangereuse, et elle est verbalisable.'],
  ['freins', 'Ce voyant est VERT. Qu\'est-ce que cela indique ?',
   ['Une information : il faut appuyer sur la pédale de frein', 'Une panne du circuit de freinage', 'Une usure des plaquettes', 'Un excès de vitesse'], 0,
   'Vert ou bleu, c\'est toujours une information. Ici, sur boîte automatique, le frein est nécessaire pour quitter la position P.'],
  ['plaquettes', 'Que signale ce voyant orange ?',
   ['Les plaquettes de frein arrivent en fin de vie', 'Le frein à main est serré', 'Un pneu est crevé', 'L\'ABS est en panne'], 0,
   'On prend rendez-vous rapidement : rouler jusqu\'au métal abîme les disques et coûte bien plus cher.'],
  ['direction', 'Ce voyant s\'allume : à quoi devez-vous vous attendre ?',
   ['Le volant va devenir très dur, surtout à basse vitesse', 'La voiture va freiner seule', 'Le moteur va s\'emballer', 'Les phares vont s\'éteindre'], 0,
   'C\'est la direction assistée. En orange le défaut est partiel, en rouge on s\'arrête : une manœuvre devient très physique.']
].map(([pic, q, r, b, e]) => ({ pic, q, r, b, e }));

QUESTIONS.push(...Q_VOYANTS);

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
  const zi = $('#q-image');
  zi.hidden = !q.pic;
  zi.innerHTML = q.pic ? `<img src="voy/${q.pic}.svg" alt="Voyant à identifier">` : '';
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
