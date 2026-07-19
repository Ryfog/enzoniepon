/* ============ Pour Stacy 💕 — petit jeu fait main ============ */

const $ = (id) => document.getElementById(id);
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0 });
}

/* ---------- compteur d'amour ---------- */
let love = 0;
function addLove(n) {
  love += n;
  $('love-n').textContent = love;
  const c = $('love-counter');
  c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
}

/* ---------- confettis de cœurs ---------- */
function confetti(n = 40) {
  const glyphs = ['💗', '💖', '💕', '💘', '🩷', '✨'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.fontSize = (14 + Math.random() * 18) + 'px';
    s.style.animationDuration = (2.2 + Math.random() * 2.5) + 's';
    s.style.animationDelay = (Math.random() * .8) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 6000);
  }
}

/* ============ 0-1. intro & lettre ============ */
$('btn-open').onclick = () => { addLove(5); show('screen-letter'); };
$('envelope').onclick = () => $('btn-open').click();
$('btn-start').onclick = () => { startQuiz(); show('screen-quiz'); };

/* ============ 2. quiz nous deux ============ */
/* Chaque réponse a sa petite réaction — il n'y a pas de mauvaise réponse 💕 */
const QUIZ = [
  {
    q: 'Qui a craqué en premier pour l\'autre ?',
    opts: [
      { t: 'Moi, évidemment 😌', r: 'Enzo confirme… mais il jure qu\'il t\'avait repérée bien avant 👀' },
      { t: 'Enzo, ça se voyait trop', r: 'Exact. Il paraît qu\'il souriait bêtement à son téléphone 📱😁' },
      { t: 'Les deux en même temps 💥', r: 'Coup de foudre synchronisé — la meilleure réponse 💘' },
    ],
  },
  {
    q: 'C\'est quoi le mieux chez Enzo ?',
    opts: [
      { t: 'Son humour (parfois douteux)', r: 'Il prend, même le « parfois douteux » 😂' },
      { t: 'Son sourire', r: 'Celui qu\'il a QUE quand c\'est toi. Bien vu 😊' },
      { t: 'Tout, je ne peux pas choisir', r: 'Réponse acceptée. Enzo rougit d\'ici ☺️' },
    ],
  },
  {
    q: 'Qui envoie le premier message le matin ?',
    opts: [
      { t: 'Moi 🌅', r: 'Et ça illumine sa journée à chaque fois, il me l\'a dit 🥹' },
      { t: 'Lui ⏰', r: 'Il se réveille et il pense à toi. Direct. Chaque matin 💙' },
      { t: 'Ça dépend qui se lève en premier 😴', r: 'L\'important c\'est que ça finit toujours par arriver 💌' },
    ],
  },
  {
    q: 'Le plus beau duo du monde, c\'est…',
    opts: [
      { t: 'Nous deux 💑', r: 'Bonne réponse ! (c\'était la seule d\'ailleurs)' },
      { t: 'Nous deux + Milo 🐾', r: 'LA vraie bonne réponse. Le trio de légende 🐶💕' },
      { t: 'Stacy & Milo, désolée Enzo', r: 'Aïe 😂 Enzo demande officiellement à rejoindre l\'équipe' },
    ],
  },
  {
    q: 'Qui supporte le moins la distance ?',
    opts: [
      { t: 'Moi 🥺', r: 'Tiens bon. Il compte les jours aussi, promis 🤞' },
      { t: 'Enzo, il le cache mal', r: 'Il le cache TRÈS mal oui 😅 tu lui manques tout le temps' },
      { t: 'Égalité parfaite', r: 'Deux cœurs qui tirent sur le même élastique 🧲💞' },
    ],
  },
  {
    q: 'Notre premier « je t\'aime », il était comment ?',
    opts: [
      { t: 'Parfait 🥹', r: 'Il s\'en souvient par cœur. Chaque mot 💙' },
      { t: 'Maladroit mais mignon', r: 'Comme les meilleures choses : vraies et pas répétées ✨' },
      { t: 'Je m\'en souviens plus… 😳', r: 'Pas grave — Enzo s\'en souvient pour deux 😌' },
    ],
  },
  {
    q: 'Si Enzo était là, maintenant, il ferait quoi ?',
    opts: [
      { t: 'Un câlin de 3 heures minimum', r: 'Minimum. Avec option prolongation illimitée 🫂' },
      { t: 'Des blagues pour me faire rire', r: 'Et il serait trop fier à chaque fois que tu ris 😁' },
      { t: 'Rien, juste être avec moi', r: 'C\'est exactement ça. Juste être là. C\'est tout ce qu\'il veut 💙' },
    ],
  },
  {
    q: 'Dans 10 ans, on est où ?',
    opts: [
      { t: 'Mariés 💍', r: 'Il n\'a pas dit non. Il n\'a PAS dit non 👀💍' },
      { t: 'En voyage quelque part', r: 'Toi, lui, une valise et zéro kilomètre de distance ✈️' },
      { t: 'Dans notre maison avec Milo (et les autres)', r: '« Les autres » ?? Combien d\'animaux tu prévois exactement ? 😂🐾' },
    ],
  },
];

let qi = 0;
function startQuiz() { qi = 0; renderQuiz(); }
function renderQuiz() {
  const item = QUIZ[qi];
  $('q-text').textContent = item.q;
  $('quiz-fill').style.width = (qi / QUIZ.length * 100) + '%';
  $('reaction').classList.add('hidden');
  const box = $('opts');
  box.innerHTML = '';
  item.opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = o.t;
    b.onclick = () => {
      addLove(10);
      box.querySelectorAll('.opt').forEach(x => x.disabled = true);
      const r = $('reaction');
      r.textContent = o.r;
      r.classList.remove('hidden');
      setTimeout(() => {
        qi++;
        if (qi >= QUIZ.length) { $('quiz-fill').style.width = '100%'; setTimeout(() => show('screen-catch'), 300); }
        else renderQuiz();
      }, 2100);
    };
    box.appendChild(b);
  });
}

/* ============ 3. attrape-cœurs (avec Milo 🐾) ============ */
let catchScore = 0, catchTimer = null, spawner = null, miloSpawner = null, timeLeft = 20;

$('btn-catch-start').onclick = () => {
  $('btn-catch-start').classList.add('hidden');
  $('catch-intro').classList.add('hidden');
  $('catch-end').classList.add('hidden');
  $('catch-hud').classList.remove('hidden');
  $('catch-zone').classList.remove('hidden');
  catchScore = 0; timeLeft = 20;
  updHud();
  spawner = setInterval(spawnHeart, 480);
  miloSpawner = setInterval(spawnMilo, 5200);
  setTimeout(spawnMilo, 1800);
  catchTimer = setInterval(() => {
    timeLeft--;
    updHud();
    if (timeLeft <= 0) endCatch();
  }, 1000);
};

function updHud() {
  $('catch-score').textContent = '💗 ' + catchScore;
  $('catch-time').textContent = '⏱ ' + timeLeft + 's';
}

function plusAt(zone, x, y, txt) {
  const p = document.createElement('span');
  p.className = 'floating-plus';
  p.textContent = txt;
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  zone.appendChild(p);
  setTimeout(() => p.remove(), 700);
}

function spawnHeart() {
  const zone = $('catch-zone');
  const glyphs = ['💗', '💖', '💕', '🩷', '💘'];
  const h = document.createElement('span');
  h.className = 'fly';
  h.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
  h.style.left = (8 + Math.random() * 80) + '%';
  h.style.animationDuration = (2.6 + Math.random() * 2.2) + 's';
  const tap = (e) => {
    e.preventDefault();
    if (h.classList.contains('pop')) return;
    h.classList.add('pop');
    catchScore++;
    addLove(1);
    updHud();
    plusAt(zone, h.offsetLeft, h.offsetTop, '+1');
    setTimeout(() => h.remove(), 300);
  };
  h.addEventListener('pointerdown', tap);
  zone.appendChild(h);
  setTimeout(() => h.remove(), 5200);
}

function spawnMilo() {
  const zone = $('catch-zone');
  const m = document.createElement('span');
  m.className = 'milo';
  const fromLeft = Math.random() < .5;
  const w = zone.clientWidth;
  m.textContent = fromLeft ? '🐕' : '🐕‍🦺';
  m.style.top = (30 + Math.random() * (zone.clientHeight - 110)) + 'px';
  m.style.left = fromLeft ? '-52px' : (w + 8) + 'px';
  m.style.setProperty('--dist', (fromLeft ? 1 : -1) * (w + 70) + 'px');
  m.style.animationDuration = '3.4s';
  let caught = false;
  m.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (caught) return;
    caught = true;
    catchScore += 5;
    addLove(5);
    updHud();
    const r = m.getBoundingClientRect(), z = zone.getBoundingClientRect();
    plusAt(zone, r.left - z.left, r.top - z.top, '+5 🐾 Milo !');
    m.textContent = '🐾';
    setTimeout(() => m.remove(), 250);
  });
  zone.appendChild(m);
  setTimeout(() => m.remove(), 3600);
}

function endCatch() {
  clearInterval(spawner); clearInterval(miloSpawner); clearInterval(catchTimer);
  $('catch-zone').classList.add('hidden');
  $('catch-zone').innerHTML = '';
  $('catch-hud').classList.add('hidden');
  const end = $('catch-end');
  const msg = catchScore >= 25 ? 'Record absolu 😱 Milo est impressionné.'
            : catchScore >= 15 ? 'Très joli score ! Enzo applaudit des deux mains 👏'
            : 'Peu importe le score… ils étaient tous à toi de toute façon 💘';
  end.innerHTML = 'Tu as attrapé <b>' + catchScore + ' cœurs</b> !<br>' + msg +
    '<br><button class="btn btn-love" id="btn-catch-next">La suite ➜</button>';
  end.classList.remove('hidden');
  $('btn-catch-next').onclick = () => show('screen-question');
  confetti(20);
}

/* ============ 4. la question (le Non s'enfuit) ============ */
let dodges = 0;
const TAUNTS = [
  'Le bouton « Non » a peur, on dirait 😳',
  'Il court vite ce bouton…',
  'Il rétrécit ?? Bizarre 🤔',
  'Bon. Il y a visiblement qu\'une seule réponse possible 😌',
];
function dodge() {
  const zone = $('yn-zone');
  const no = $('btn-no');
  const zw = zone.clientWidth, zh = Math.max(zone.clientHeight, 190);
  no.style.position = 'absolute';
  no.style.left = Math.random() * Math.max(10, zw - no.offsetWidth - 10) + 'px';
  no.style.top = Math.random() * Math.max(10, zh - no.offsetHeight - 10) + 'px';
  dodges++;
  const scale = Math.max(.35, 1 - dodges * .16);
  no.style.transform = 'scale(' + scale + ')';
  $('no-taunt').textContent = TAUNTS[Math.min(dodges - 1, TAUNTS.length - 1)];
  if (dodges >= 6) { no.style.display = 'none'; $('no-taunt').textContent = 'Le bouton « Non » a démissionné. 🏳️'; }
}
$('btn-no').addEventListener('pointerenter', dodge);
$('btn-no').addEventListener('pointerdown', (e) => { e.preventDefault(); dodge(); });
$('btn-yes').onclick = () => {
  addLove(100);
  confetti(60);
  setTimeout(() => { buildReasons(); show('screen-reasons'); }, 900);
};

/* ============ 5. les 10 raisons ============ */
const REASONS = [
  'Ton sourire. Même à travers un écran, il me met KO.',
  'Ta façon de rire à mes blagues (même les nulles — surtout les nulles).',
  'Nos appels qui durent des heures et qui passent en 5 minutes.',
  'Ta voix quand tu dis mon prénom.',
  'Le courage qu\'on a, tous les deux, de tenir malgré les kilomètres.',
  'Tes yeux. J\'ai pas d\'autre explication, juste : tes yeux.',
  'Ta douceur avec Milo 🐾 (et avec moi).',
  'Tous les projets qu\'on se raconte pour « quand on sera ensemble ».',
  'Tu me donnes envie d\'être une meilleure version de moi.',
  'Parce que c\'est toi. Tout simplement. Et ça suffit largement.',
];
let revealed = 0;
function buildReasons() {
  const grid = $('reasons-grid');
  grid.innerHTML = '';
  revealed = 0;
  $('btn-final').classList.add('hidden');
  REASONS.forEach((txt, i) => {
    const c = document.createElement('div');
    c.className = 'reason hiddenface';
    c.textContent = '💗';
    c.onclick = () => {
      if (c.classList.contains('revealed')) return;
      c.classList.remove('hiddenface');
      c.classList.add('revealed');
      c.textContent = (i + 1) + '. ' + txt;
      addLove(10);
      revealed++;
      if (revealed >= REASONS.length) $('btn-final').classList.remove('hidden');
    };
    grid.appendChild(c);
  });
}
$('btn-final').onclick = () => {
  confetti(80);
  show('screen-final');
  setTimeout(() => confetti(40), 1500);
};

/* ============ 6. rejouer ============ */
$('btn-replay').onclick = () => {
  love = 0; addLove(0);
  dodges = 0;
  const no = $('btn-no');
  no.style.display = ''; no.style.position = ''; no.style.left = ''; no.style.top = ''; no.style.transform = '';
  $('no-taunt').textContent = '';
  $('btn-catch-start').classList.remove('hidden');
  $('catch-intro').classList.remove('hidden');
  $('catch-end').classList.add('hidden');
  show('screen-intro');
};

/* ---------- cœurs flottants du fond ---------- */
(function hearts() {
  const box = document.querySelector('.hearts-bg');
  const glyphs = ['💗', '💕', '💖', '🩷', '💞', '❤️'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = (Math.random() * 98) + 'vw';
    s.style.fontSize = (14 + Math.random() * 20) + 'px';
    s.style.animationDuration = (9 + Math.random() * 12) + 's';
    s.style.animationDelay = (-Math.random() * 18) + 's';
    box.appendChild(s);
  }
})();
