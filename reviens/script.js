/* =========================================================
   POUR STACY
   Rien ne démarre tant qu'elle n'a pas ouvert l'enveloppe :
   c'est ce clic qui autorise le son (les navigateurs bloquent
   toute musique lancée sans geste de l'utilisateur).
   ========================================================= */
'use strict';

/* ---------------------------------------------------------
   LA LETTRE — une ligne = un paragraphe.
   Change ce que tu veux : c'est toi qu'elle doit entendre.
   --------------------------------------------------------- */
const LETTRE = [
  "Stacy,",
  "Je vais pas tourner autour. Je t'écris pas pour te faire changer d'avis, et je vais pas te sortir des excuses — t'en as assez entendu, et de toute façon elles servent surtout à me protéger moi.",
  "Je t'écris parce qu'il y a des choses que je t'ai jamais dites correctement, et que je veux pas les garder pour moi.",
  "Ce que j'ai compris, c'est que j'ai passé beaucoup trop de temps à me défendre et pas assez à t'écouter. Quand tu me disais que quelque chose te faisait mal, je répondais au lieu d'entendre. Je me suis occupé d'avoir raison pendant que toi t'allais mal.",
  "Je te promets rien, parce que les promesses je t'en ai déjà fait. Ce que je peux dire, c'est que j'ai commencé à changer ça, et je préfère que tu le voies avec le temps plutôt que je te l'écrive ici.",
  "Je te demande rien. Ni une réponse, ni un délai, ni une seconde chance. Si c'est non, c'est non, et je te laisserai tranquille.",
  "Je voulais juste que tu l'entendes une fois, en entier."
];

/* la chanson (identifiant YouTube) */
const CHANSON = 'WikAeXGsmHY';
/* --------------------------------------------------------- */

const $ = s => document.querySelector(s);

/* ============ 1. OUVERTURE DE L'ENVELOPPE ============ */
let ouverte = false;
$('#env').addEventListener('click', ouvrir);

function ouvrir() {
  if (ouverte) return;
  ouverte = true;
  document.body.classList.add('ouvert');
  $('#invite').textContent = '';
  lanceMusique();

  /* l'enveloppe s'écarte, la lettre prend sa place */
  setTimeout(() => {
    $('#scene').classList.add('parti');
    document.body.classList.remove('verrouille');
    $('#papier').hidden = false;
    requestAnimationFrame(() => $('#papier').classList.add('la'));
    ecrisLettre();
  }, 1500);
}

/* ============ 2. LES MOTS, UN PAR UN ============ */
function ecrisLettre() {
  const boite = $('#mots');

  /* La cadence s'adapte à la longueur : la lettre finit de se poser en
     7 s environ, qu'elle fasse 40 mots ou 300. Sans ça, un texte long
     la laisserait attendre devant un écran presque vide. */
  const nbMots = LETTRE.join(' ').split(/\s+/).filter(Boolean).length;
  const parMot = Math.min(110, Math.max(38, Math.round(6500 / Math.max(1, nbMots))));
  const entreParagraphes = Math.round(parMot * 3.2);

  let retard = 250;
  LETTRE.forEach(ligne => {
    const p = document.createElement('p');
    for (const mot of ligne.split(' ')) {
      const s = document.createElement('span');
      s.textContent = mot + ' ';
      s.style.animationDelay = retard + 'ms';
      retard += parMot;
      p.appendChild(s);
    }
    boite.appendChild(p);
    retard += entreParagraphes;
  });

  /* la signature et la suite arrivent une fois les mots posés */
  const fin = retard + 500;
  montrerApres('#signe', fin);
  montrerApres('#suite', fin + 700);

  /* filet : si les animations ne partent pas, tout reste lisible */
  setTimeout(() => boite.classList.add('tout-vu'), fin + 2500);
}

function montrerApres(sel, ms) {
  setTimeout(() => {
    const el = $(sel);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('la'));
  }, ms);
}

/* ============ 3. L'HISTOIRE ============ */
$('#suite').addEventListener('click', () => {
  const h = $('#histoire');
  h.hidden = false;
  reveille();
  h.scrollIntoView({ behavior: 'smooth' });
  $('#suite').hidden = true;
});

function reveille() {
  const sections = document.querySelectorAll('[data-vue]');
  document.body.classList.add('js');
  const tout = () => sections.forEach(s => { s.classList.add('la'); compte(s); });
  setTimeout(tout, 4000);                 /* filet de sécurité */

  /* la première section est montrée tout de suite : elle est déjà à l'écran,
     inutile d'attendre que l'observateur se réveille */
  if (sections[0]) { sections[0].classList.add('la'); compte(sections[0]); }

  if (!('IntersectionObserver' in window)) return tout();
  const oeil = new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('la');
      compte(e.target);
      oeil.unobserve(e.target);
    }
  }, { threshold: 0.2 });
  sections.forEach(s => oeil.observe(s));
}

/* les compteurs montent. La vraie valeur est déjà dans le HTML :
   si rien ne s'anime, elle voit les chiffres, jamais des zéros. */
function compte(section) {
  for (const el of section.querySelectorAll('[data-vers]')) {
    if (el.dataset.fait) continue;
    el.dataset.fait = '1';
    const cible = parseInt(el.dataset.vers, 10);
    if (!Number.isFinite(cible)) continue;
    const final = cible.toLocaleString('fr-FR'), duree = 1800;
    setTimeout(() => { el.textContent = final; }, duree + 500);
    el.textContent = '0';
    const t0 = performance.now();
    const pas = t => {
      const p = Math.min(1, (t - t0) / duree);
      el.textContent = Math.round(cible * (1 - Math.pow(1 - p, 3))).toLocaleString('fr-FR');
      if (p < 1) requestAnimationFrame(pas); else el.textContent = final;
    };
    requestAnimationFrame(pas);
  }
}

/* ============ 4. LA MUSIQUE ============
   D'abord le vrai morceau via le lecteur officiel YouTube.
   S'il ne se charge pas, un fond au piano de secours, pour que
   le silence ne casse pas le moment. */
let lecteur = null, secours = null, sonActif = true;

function lanceMusique() {
  $('#son').hidden = false;
  const t = document.createElement('script');
  t.src = 'https://www.youtube.com/iframe_api';
  t.onerror = fondDeSecours;
  document.head.appendChild(t);
  /* si l'API met trop longtemps, on ne laisse pas le silence */
  setTimeout(() => { if (!lecteur) fondDeSecours(); }, 4000);
}

window.onYouTubeIframeAPIReady = function () {
  lecteur = new YT.Player('yt', {
    videoId: CHANSON,
    playerVars: { autoplay: 1, controls: 0, playsinline: 1, loop: 1, playlist: CHANSON },
    events: {
      onReady: e => { e.target.setVolume(38); e.target.playVideo(); arreteSecours(); },
      onError: fondDeSecours
    }
  });
};

/* nappe de piano synthétisée : aucune dépendance, aucun fichier */
function fondDeSecours() {
  if (secours || !sonActif) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const sortie = ac.createGain();
    sortie.gain.value = 0;
    sortie.gain.linearRampToValueAtTime(0.12, ac.currentTime + 3);
    sortie.connect(ac.destination);
    const accords = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [164.8, 207.7, 246.9]];
    let i = 0;
    const jouer = () => {
      if (!sonActif) return;
      for (const f of accords[i % accords.length]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime);
        g.gain.linearRampToValueAtTime(0.2, ac.currentTime + 1.2);
        g.gain.linearRampToValueAtTime(0, ac.currentTime + 5.5);
        o.connect(g); g.connect(sortie); o.start(); o.stop(ac.currentTime + 5.6);
      }
      i++;
    };
    jouer();
    secours = setInterval(jouer, 5000);
  } catch (e) { /* pas de son : la page reste entière */ }
}
function arreteSecours() { if (secours) { clearInterval(secours); secours = null; } }

$('#son').addEventListener('click', () => {
  sonActif = !sonActif;
  $('#son').textContent = sonActif ? '♪' : '♪̸';
  $('#son').classList.toggle('coupe', !sonActif);
  if (lecteur) sonActif ? lecteur.playVideo() : lecteur.pauseVideo();
  if (!sonActif) arreteSecours();
});
