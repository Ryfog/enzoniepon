/* La vallée des rêves oubliés — pour Stacy */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------------------------------------------------------- textes */

const RONCES = [
  { x: 15, y: 20, t: "J'ai merdé. Je ne vais pas tourner autour." },
  { x: 39, y: 11, t: "Je ne cherche pas d'excuse. Je cherche à réparer." },
  { x: 62, y: 24, t: "Je sais ce que je t'ai fait ressentir, et ça me rend malade." },
  { x: 82, y: 14, t: "Tu ne méritais pas ça. Surtout pas venant de moi." },
  { x: 22, y: 62, t: "J'ai laissé le silence faire le travail à ma place. Plus jamais." },
  { x: 50, y: 78, t: "Je ne te demande pas d'oublier. Juste de me laisser faire mieux." },
  { x: 77, y: 60, t: "Je t'aime. Ça, ça n'a pas bougé d'un millimètre." }
];

const PORTES = [
  { s: '💬', t: "<b>16 février 2025.</b><br>« c mes clips sur l'ecran ». Tout est parti d'un message ridicule — et tu as répondu." },
  { s: '💗', t: "<b>Aujourd'hui.</b><br>Des milliers de messages plus tard, tu es toujours la première personne à qui je veux raconter ma journée." },
  { s: '✈️', t: "" } /* rempli en JS : compte à rebours du 16 septembre */
];

const ETOILES = [
  "Je t'écoute jusqu'au bout, même quand ça pique.",
  "Je te dis les choses avant qu'elles pourrissent.",
  "Je ne te laisse plus dans le flou.",
  "Je ne te fais plus douter de ta place.",
  "Je réponds, même quand j'ai tort.",
  "Je te choisis. Encore, et tous les jours."
];

/* ------------------------------------------------------------ progression */

let nRonces = 0, nPortes = 0, nEtoiles = 0;
const fenetres = $$('.chateau .f');

function majMagie() {
  const m = Math.min(1, (nRonces / 7) * .55 + (nPortes / 3) * .2 + (nEtoiles / 6) * .25);
  document.documentElement.style.setProperty('--magie', m.toFixed(3));
  const allumees = Math.round(m * fenetres.length);
  fenetres.forEach((f, i) => f.classList.toggle('on', i < allumees));
}

/* ------------------------------------------------------------------ scènes */

function va(id) {
  const courant = $('.ecran:not([hidden])');
  const cible = document.getElementById(id);
  if (!cible || cible === courant) return;
  if (courant) { courant.hidden = true; courant.classList.remove('actif'); }
  cible.hidden = false;
  void cible.offsetWidth;
  cible.classList.add('actif');
  window.scrollTo(0, 0);
  if (id === 'ronces')  poseRonces();
  if (id === 'portes')  preparePortes();
  if (id === 'etoiles') lanceEtoiles();
  if (id === 'lettre')  { nRonces = 7; nPortes = 3; nEtoiles = 6; majMagie(); }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) va(b.dataset.go);
});

function montreBouton(el) {
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function dis(el, texte) {
  el.hidden = false;
  el.innerHTML = texte;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

/* ------------------------------------------------------- 1. les ronces */

const SVG_RONCE = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <path class="epine" d="M50 6 L58 30 L82 22 L64 42 L92 52 L64 60 L80 82 L56 70 L50 96 L42 70 L20 84 L34 60 L8 52 L34 42 L18 20 L42 30 Z"/>
  <circle class="corps" cx="50" cy="51" r="21"/>
</svg>`;

let roncesPosees = false;

function poseRonces() {
  if (roncesPosees) return;
  roncesPosees = true;
  const zone = $('#zoneRonces');
  RONCES.forEach((r, i) => {
    const b = document.createElement('button');
    b.className = 'ronce';
    b.style.left = r.x + '%';
    b.style.top = r.y + '%';
    b.style.animationDelay = (i * .12) + 's';
    b.setAttribute('aria-label', 'Enlever une ronce');
    b.innerHTML = SVG_RONCE;
    zone.appendChild(b);
    accrocheRonce(b, r.t);
  });
}

function accrocheRonce(el, texte) {
  let raf = null, debut = 0, fini = false;
  const DUREE = 850;

  const boucle = ts => {
    if (!debut) debut = ts;
    const p = Math.min(100, (ts - debut) / DUREE * 100);
    el.style.setProperty('--p', p);
    if (p >= 100) { arrache(); return; }
    raf = requestAnimationFrame(boucle);
  };

  const demarre = e => {
    if (fini) return;
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('pousse');
    el.style.setProperty('--o', 1);
    debut = 0;
    raf = requestAnimationFrame(boucle);
  };

  const stop = () => {
    if (fini) return;
    cancelAnimationFrame(raf);
    el.classList.remove('pousse');
    el.style.setProperty('--o', 0);
    el.style.setProperty('--p', 0);
  };

  const arrache = () => {
    fini = true;
    cancelAnimationFrame(raf);
    el.classList.remove('pousse');
    el.style.setProperty('--o', 0);
    el.classList.add('partie');
    lucioles(el);
    nRonces++;
    majMagie();
    $('#jaugeFill').style.width = (nRonces / 7 * 100) + '%';
    $('#jaugeTxt').textContent = nRonces + ' / 7';
    dis($('#ditRonce'), texte);
    if (nRonces === 7) {
      setTimeout(() => montreBouton($('#suiteRonces')), 900);
    }
  };

  el.addEventListener('pointerdown', demarre);
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('pointerleave', stop);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

function lucioles(source) {
  const zone = $('#zoneRonces');
  const r = source.getBoundingClientRect(), z = zone.getBoundingClientRect();
  const cx = r.left - z.left + r.width / 2;
  const cy = r.top - z.top + r.height / 2;
  for (let i = 0; i < 9; i++) {
    const l = document.createElement('i');
    l.className = 'luciole';
    l.style.left = cx + 'px';
    l.style.top = cy + 'px';
    l.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
    l.style.animationDelay = (Math.random() * .35) + 's';
    zone.appendChild(l);
    setTimeout(() => l.remove(), 2200);
  }
}

/* -------------------------------------------------------- 2. les portes */

function joursAvant() {
  const cible = new Date(2026, 8, 16);          // 16 septembre 2026
  const now = new Date();
  const j = Math.ceil((cible - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  return j;
}

function preparePortes() {
  const j = joursAvant();
  PORTES[2].t = j > 0
    ? `<b>Le 16 septembre.</b><br>Dans ${j} jour${j > 1 ? 's' : ''}, je ne t'écris plus : je te regarde.`
    : `<b>Le 16 septembre.</b><br>C'est maintenant. Et je ne compte pas le rater.`;
  $$('.porte-c').forEach(p => {
    $('.dedans', p).innerHTML = `<span>${PORTES[+p.dataset.p].s}</span>`;
  });
}

$$('.porte-c').forEach(p => {
  p.addEventListener('click', () => {
    if (p.classList.contains('ouverte')) return;
    p.classList.add('ouverte');
    nPortes++;
    majMagie();
    dis($('#ditPorte'), PORTES[+p.dataset.p].t);
    if (nPortes === 3) setTimeout(() => montreBouton($('#suitePortes')), 1000);
  });
});

/* ------------------------------------------------------- 3. les étoiles */

const SVG_ETOILE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5l2.9 6.4 6.9.8-5.1 4.7 1.4 6.9L12 16.9 5.9 20.3l1.4-6.9-5.1-4.7 6.9-.8z"/></svg>`;

let minuteurEtoiles = null;

function lanceEtoiles() {
  if (minuteurEtoiles) return;
  const zone = $('#zoneEtoiles');
  const pond = () => {
    if (nEtoiles >= 6) return;
    const w = zone.clientWidth, h = zone.clientHeight;
    const versDroite = Math.random() > .45;
    const x1 = versDroite ? -40 : w + 40;
    const y1 = Math.random() * h * .55;
    const dx = versDroite ? w + 80 : -(w + 80);
    const dy = h * (.35 + Math.random() * .5);
    const duree = 3200 + Math.random() * 1600;

    const s = document.createElement('button');
    s.className = 'filante';
    s.innerHTML = SVG_ETOILE;
    s.style.left = x1 + 'px';
    s.style.top = y1 + 'px';
    if (!versDroite) s.style.transform = 'translate(-50%,-50%) scaleX(-1)';
    zone.appendChild(s);

    const anim = s.animate(
      [{ transform: s.style.transform || 'translate(-50%,-50%)' },
       { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))${versDroite ? '' : ' scaleX(-1)'}` }],
      { duration: duree, easing: 'linear', fill: 'forwards' }
    );
    anim.onfinish = () => s.remove();

    s.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (s.classList.contains('prise')) return;
      anim.commitStyles?.();
      anim.cancel();
      s.classList.add('prise');
      setTimeout(() => s.remove(), 600);
      attrape();
    });
  };

  pond();
  minuteurEtoiles = setInterval(() => {
    if (nEtoiles >= 6) { clearInterval(minuteurEtoiles); return; }
    pond();
  }, 820);
}

function attrape() {
  dis($('#ditEtoile'), ETOILES[nEtoiles] || '');
  nEtoiles++;
  majMagie();
  $('#scoreEt').textContent = nEtoiles;
  if (nEtoiles >= 6) {
    clearInterval(minuteurEtoiles);
    $$('.filante').forEach(f => f.remove());
    setTimeout(() => montreBouton($('#suiteEtoiles')), 900);
  }
}

/* -------------------------------------------------------- 4. le cadeau */

$('#boite').addEventListener('click', () => {
  const b = $('#boite');
  if (b.classList.contains('ouverte')) return;
  b.classList.add('ouverte');
  document.body.classList.add('finale');
  lanternesOn = true;
  setTimeout(() => {
    $('#revele').hidden = false;
    $('#genieFig').hidden = false;
    $('#revele').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 850);
});

const shot = $('#shot');
function shotRate() {
  shot.style.display = 'none';
  $('#secours').hidden = false;
}
shot.addEventListener('error', shotRate);
if (shot.complete && shot.naturalWidth === 0) shotRate();

/* ------------------------------------------------------------ le ciel */

const cv = $('#ciel'), ctx = cv.getContext('2d');
let W = 0, H = 0, etoilesFond = [], lanternes = [], lanternesOn = false;

function taille() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
  etoilesFond = [];
  const n = Math.min(150, Math.round(W * H / 9000));
  for (let i = 0; i < n; i++) {
    etoilesFond.push({
      x: Math.random() * W,
      y: Math.random() * H * .8,
      r: Math.random() * 1.4 + .3,
      p: Math.random() * Math.PI * 2,
      v: .6 + Math.random() * 1.6
    });
  }
}
addEventListener('resize', taille);
taille();

function nouvelleLanterne() {
  return {
    x: Math.random() * W,
    y: H + 40 + Math.random() * 200,
    t: 8 + Math.random() * 10,
    v: .25 + Math.random() * .5,
    o: .5 + Math.random() * .5,
    d: Math.random() * Math.PI * 2
  };
}

let t = 0;
function boucle() {
  t += .016;
  ctx.clearRect(0, 0, W, H);

  const magie = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--magie')) || 0;

  for (const e of etoilesFond) {
    const a = (.28 + .5 * magie) * (.55 + .45 * Math.sin(t * e.v + e.p));
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, 6.283);
    ctx.fill();
  }

  if (lanternesOn) {
    if (lanternes.length < 22 && Math.random() < .06) lanternes.push(nouvelleLanterne());
    for (let i = lanternes.length - 1; i >= 0; i--) {
      const l = lanternes[i];
      l.y -= l.v;
      l.x += Math.sin(t * .5 + l.d) * .25;
      if (l.y < -60) { lanternes.splice(i, 1); continue; }
      ctx.globalAlpha = l.o;
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.t * 2.6);
      g.addColorStop(0, 'rgba(255,224,150,.95)');
      g.addColorStop(.35, 'rgba(255,190,110,.45)');
      g.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.t * 2.6, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,236,190,.95)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(l.x - l.t / 2, l.y - l.t / 2, l.t, l.t * 1.25, 3);
        ctx.fill();
      } else {
        ctx.fillRect(l.x - l.t / 2, l.y - l.t / 2, l.t, l.t * 1.25);
      }
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(boucle);
}
boucle();
majMagie();
