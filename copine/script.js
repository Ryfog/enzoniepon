/* =========================================================
   1er août — Journée de la copine · logique des jeux
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ============ ÉTAT / TAMPONS ============ */
const GAMES = [
  { id: 'scratch', emo: '🎫' },
  { id: 'hearts',  emo: '💗' },
  { id: 'memory',  emo: '🧠' },
  { id: 'milo',    emo: '🐶' },
  { id: 'wheel',   emo: '🎡' },
  { id: 'quiz',    emo: '🧩' },
  { id: 'bouquet', emo: '💐' }
];
const KEY = 'jdc2026';
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }

function saveState() {
  try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
}

const stampsEl = $('#stamps');
GAMES.forEach(g => {
  const d = document.createElement('div');
  d.className = 'stamp';
  d.dataset.id = g.id;
  d.textContent = g.emo;
  d.title = g.id;
  stampsEl.appendChild(d);
});

function refreshStamps() {
  let n = 0;
  GAMES.forEach(g => {
    const el = stampsEl.querySelector(`[data-id="${g.id}"]`);
    if (done[g.id]) { el.classList.add('on'); n++; }
  });
  $('#stamps-count').textContent = `${n} / ${GAMES.length}`;
  const left = GAMES.length - n;
  if (left === 0) {
    $('#final').classList.add('open');
  } else {
    $('#lock-left').textContent =
      left === 1 ? 'Il ne t\'en manque plus qu\'un. Courage 🤏' : `Il t'en manque ${left}.`;
  }
  return n;
}

function win(id, title, text, emo = '🎉') {
  const first = !done[id];
  done[id] = true;
  saveState();
  const n = refreshStamps();
  burst(90);
  if (first) popup(title, text, emo);
  if (n === GAMES.length && first) {
    setTimeout(() => {
      burst(240);
      $('#final').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 900);
  }
}

/* ============ POPUP ============ */
const pop = $('#pop');
function popup(title, text, emo = '🎉') {
  $('#pop-title').textContent = title;
  $('#pop-text').textContent = text;
  $('#pop-emoji').textContent = emo;
  pop.hidden = false;
}
const closePop = () => { pop.hidden = true; };
$('#pop-x').addEventListener('click', closePop);
$('#pop-ok').addEventListener('click', closePop);
pop.addEventListener('click', e => { if (e.target === pop) closePop(); });

/* ============ CONFETTIS ============ */
const cv = $('#confetti'), cx = cv.getContext('2d');
let parts = [];
function sizeCv() { cv.width = innerWidth; cv.height = innerHeight; }
sizeCv();
addEventListener('resize', sizeCv);

const COLS = ['#ff7a6b', '#ffc75a', '#5fd3b2', '#7ab8ff', '#c9a8ff', '#ff9ec4', '#fff'];
function burst(n = 120, ox = null, oy = null) {
  const x = ox === null ? innerWidth / 2 : ox;
  const y = oy === null ? innerHeight * 0.35 : oy;
  for (let i = 0; i < n; i++) {
    parts.push({
      x, y,
      vx: rnd(-9, 9), vy: rnd(-15, 2),
      w: rnd(6, 12), h: rnd(8, 15),
      c: pick(COLS), a: rnd(0, 6.3), va: rnd(-.25, .25), l: 1
    });
  }
  if (parts.length) loop();
}
let running = false;
function loop() {
  if (running) return;
  running = true;
  (function step() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.l > 0 && p.y < cv.height + 60);
    parts.forEach(p => {
      p.vy += 0.42; p.vx *= 0.995;
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      p.l -= 0.004;
      cx.save();
      cx.translate(p.x, p.y); cx.rotate(p.a);
      cx.globalAlpha = Math.max(0, Math.min(1, p.l));
      cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
    });
    if (parts.length) requestAnimationFrame(step);
    else { cx.clearRect(0, 0, cv.width, cv.height); running = false; }
  })();
}

/* ============ ENTRÉE ============ */
$('#gate-btn').addEventListener('click', () => {
  $('#gate').classList.add('gone');
  burst(200);
  setTimeout(() => { $('#gate').style.display = 'none'; }, 750);
});
if (/[?&]nogate/.test(location.search)) {
  $('#gate').style.display = 'none';
}
// apercu : ?tout remplit les 7 tampons (pour verifier le mot de la fin)
if (/[?&]tout/.test(location.search)) {
  GAMES.forEach(g => { done[g.id] = true; });
}

/* =========================================================
   1 · TICKET À GRATTER
   ========================================================= */
(function scratch() {
  const c = $('#scratch'), g = c.getContext('2d');
  const W = c.width, H = c.height;

  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#c9b8a8');
  grad.addColorStop(.5, '#e2d3c3');
  grad.addColorStop(1, '#bfae9d');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 260; i++) g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 3), rnd(1, 3));
  g.fillStyle = 'rgba(90,70,60,.5)';
  g.font = '600 30px Quicksand, sans-serif';
  g.textAlign = 'center';
  g.fillText('gratte-moi ✨', W / 2, H / 2 + 10);

  g.globalCompositeOperation = 'destination-out';
  let drawing = false, over = false;

  const pos = e => {
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (W / r.width), y: (t.clientY - r.top) * (H / r.height) };
  };
  const dot = p => { g.beginPath(); g.arc(p.x, p.y, 30, 0, 7); g.fill(); };

  function check() {
    if (over) return;
    const d = g.getImageData(0, 0, W, H).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4 * 40) if (d[i] < 40) clear++;
    if (clear / (d.length / (4 * 40)) > 0.52) {
      over = true;
      c.classList.add('done');
      $('#scratch-hint').textContent = 'Et c\'est vrai, en plus. 💛';
      win('scratch', 'Premier tampon !', 'Tu as trouvé le message caché. Il y en a six autres à débloquer.', '🎫');
    }
  }

  const start = e => { drawing = true; dot(pos(e)); };
  const move = e => { if (!drawing) return; e.preventDefault(); dot(pos(e)); };
  const end = () => { if (drawing) { drawing = false; check(); } };

  c.addEventListener('mousedown', start);
  c.addEventListener('mousemove', move);
  addEventListener('mouseup', end);
  c.addEventListener('touchstart', start, { passive: true });
  c.addEventListener('touchmove', move, { passive: false });
  c.addEventListener('touchend', end);
})();

/* =========================================================
   2 · ATTRAPE LES CŒURS
   ========================================================= */
(function hearts() {
  const arena = $('#arena'), btn = $('#h-start');
  const sEl = $('#h-score'), tEl = $('#h-time'), msg = $('#h-msg');
  const GOAL = 15, DUR = 20;
  let items = [], score = 0, t = DUR, raf = null, spawner = null, timer = null, on = false;

  function spawn() {
    const bomb = Math.random() < 0.22;
    const el = document.createElement('div');
    el.className = 'falling';
    el.textContent = bomb ? '💣' : pick(['❤️', '💗', '💖', '💘', '🩷']);
    const x = rnd(4, 86);
    el.style.left = x + '%';
    el.style.top = '-40px';
    arena.appendChild(el);
    const o = { el, y: -40, v: rnd(1.6, 3.4), bomb };
    el.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (!on || o.hit) return;
      o.hit = true;
      el.classList.add('pop');
      if (bomb) { score = Math.max(0, score - 3); arena.animate(
        [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }],
        { duration: 220 }); }
      else score++;
      sEl.textContent = score;
      setTimeout(() => el.remove(), 300);
    });
    items.push(o);
  }

  function frame() {
    const h = arena.clientHeight;
    items = items.filter(o => {
      if (!o.el.isConnected) return false;
      o.y += o.v;
      o.el.style.transform = `translateY(${o.y + 40}px)`;
      if (o.y > h + 20) { o.el.remove(); return false; }
      return true;
    });
    if (on) raf = requestAnimationFrame(frame);
  }

  function stop() {
    on = false;
    clearInterval(spawner); clearInterval(timer); cancelAnimationFrame(raf);
    items.forEach(o => o.el.remove()); items = [];
    btn.style.display = '';
    btn.textContent = 'Rejouer 🔁';
    if (score >= GOAL) {
      msg.textContent = `${score} cœurs attrapés — impressionnant.`;
      win('hearts', 'Attrapés !', `${score} cœurs. Tu as des réflexes, je note ça pour le 16 septembre.`, '💗');
    } else {
      msg.textContent = `${score} cœurs… il en fallait ${GOAL}. Allez, encore une 🙃`;
    }
  }

  btn.addEventListener('click', () => {
    score = 0; t = DUR; on = true;
    sEl.textContent = '0'; tEl.textContent = DUR + 's';
    msg.textContent = 'Vas-y vas-y vas-y !';
    btn.style.display = 'none';
    spawner = setInterval(spawn, 380);
    timer = setInterval(() => { t--; tEl.textContent = t + 's'; if (t <= 0) stop(); }, 1000);
    frame();
  });
})();

/* =========================================================
   3 · MEMORY
   ========================================================= */
(function memory() {
  // [fichier, legende, emoji de la popup]
  const PAIRS = [
    ['memo/milo.jpg',   'Milo. Le chien le plus gâté de France.', '🐶'],
    ['memo/toi.jpg',    'Toi. Mon sujet préféré, et de très loin.', '📸'],
    ['memo/bague.jpg',  'Un jour. Pas de pression. Mais un jour.', '💍'],
    ['memo/trajet.jpg', '873 km, 8h43 de route. Ça les vaut largement.', '🚗'],
    ['memo/soleil.jpg', 'Tu es de meilleure humeur que le soleil.', '🌼'],
    ['memo/tigrou.jpg', 'Nos messages à 2h du matin. Tigrou n\'est pas content.', '🐱']
  ];
  const grid = $('#memo'), msg = $('#memo-msg');
  let deck = [];
  PAIRS.forEach((p, i) => { deck.push(i); deck.push(i); });
  deck.sort(() => Math.random() - .5);

  let up = [], lock = false, hits = 0, moves = 0;

  deck.forEach(i => {
    const b = document.createElement('button');
    b.className = 'mcard';
    b.dataset.i = i;
    const im = document.createElement('img');
    im.src = PAIRS[i][0];
    im.alt = '';
    im.loading = 'lazy';
    b.appendChild(im);
    b.addEventListener('click', () => {
      if (lock || b.classList.contains('up') || b.classList.contains('ok')) return;
      b.classList.add('up');
      up.push(b);
      if (up.length === 2) {
        moves++;
        msg.textContent = `Coups : ${moves}`;
        lock = true;
        const [a, z] = up;
        if (a.dataset.i === z.dataset.i) {
          setTimeout(() => {
            a.classList.add('ok'); z.classList.add('ok');
            a.classList.remove('up'); z.classList.remove('up');
            up = []; lock = false; hits++;
            const p = PAIRS[+a.dataset.i];
            popup('Une paire !', p[1], p[2]);
            if (hits === PAIRS.length) {
              msg.textContent = `Terminé en ${moves} coups 🧠`;
              setTimeout(() => win('memory', 'Memory bouclé !',
                `${moves} coups. Tu retiens tout, c'est bien ce que je disais.`, '🧠'), 400);
            }
          }, 500);
        } else {
          setTimeout(() => {
            a.classList.remove('up'); z.classList.remove('up');
            up = []; lock = false;
          }, 850);
        }
      }
    });
    grid.appendChild(b);
  });
})();

/* =========================================================
   4 · OÙ EST MILO
   ========================================================= */
(function milo() {
  const grid = $('#milo-grid'), msg = $('#milo-msg');
  const MILO = ['dog/milo1.jpg', 'dog/milo2.jpg'];
  const AUTRES = ['dog/a.jpg', 'dog/b.jpg'];
  const ROUNDS = [
    { deco: [AUTRES[0]], milo: MILO[0], txt: 'Manche 1 / 3 — échauffement' },
    { deco: [AUTRES[1]], milo: MILO[1], txt: 'Manche 2 / 3 — ça se corse' },
    { deco: AUTRES,      milo: null,    txt: 'Manche 3 / 3 — bonne chance 😈' }
  ];
  let r = 0;

  function build() {
    const R = ROUNDS[r];
    const milo = R.milo || pick(MILO);
    grid.innerHTML = '';
    const N = 25, target = Math.floor(Math.random() * N);
    msg.textContent = R.txt;
    for (let i = 0; i < N; i++) {
      const b = document.createElement('button');
      b.className = 'milo-cell';
      const im = document.createElement('img');
      im.src = i === target ? milo : R.deco[i % R.deco.length];
      im.alt = '';
      b.appendChild(im);
      b.addEventListener('click', () => {
        if (i === target) {
          b.classList.add('found');
          r++;
          if (r >= ROUNDS.length) {
            msg.textContent = 'Milo est rentré. Il boude un peu. 🐾';
            win('milo', 'Milo retrouvé !',
              'Trois fois de suite. Officiellement, tu es sa personne préférée. Moi je suis deuxième et ça me va.', '🐶');
          } else {
            msg.textContent = 'Trouvé ! Il repart se cacher…';
            setTimeout(build, 800);
          }
        } else {
          b.classList.add('bad');
          setTimeout(() => b.classList.remove('bad'), 350);
        }
      });
      grid.appendChild(b);
    }
  }
  build();
})();

/* =========================================================
   12 CHOSES QUE J'AIME CHEZ TOI
   ========================================================= */
(function flips() {
  const LIST = [
    ['😄', 'Ton rire. Celui que tu essaies de retenir et qui sort quand même.'],
    ['🗣️', 'Ta façon de raconter les choses, avec tous les détails inutiles. J\'adore les détails inutiles.'],
    ['🐾', 'Comment tu es avec Milo. Ça dit tout de toi.'],
    ['💪', 'Ta force. Tu encaisses des trucs sans jamais t\'en vanter.'],
    ['🌙', 'Tes messages tard le soir, quand tu devrais dormir.'],
    ['👀', 'Ton regard quand tu es concentrée sur autre chose.'],
    ['🤝', 'Ta patience avec moi. Franchement, il en faut.'],
    ['🎵', 'Tes musiques. Même celles que je fais semblant de ne pas aimer.'],
    ['🧠', 'Que tu me dises quand je me trompe. Personne d\'autre ne le fait.'],
    ['🫶', 'Ta manière de prendre soin des gens sans le dire.'],
    ['✨', 'Ce truc que tu as et que je n\'arrive pas à nommer. C\'est ça, en fait.'],
    ['🏠', 'Le fait qu\'avec toi, même à distance, je me sens chez moi.']
  ];
  const box = $('#flips');
  LIST.forEach((it, i) => {
    const b = document.createElement('button');
    b.className = 'flip';
    b.innerHTML = `<span class="flip-in">
        <span class="flip-f">${it[0]}<small>n°&nbsp;${i + 1}</small></span>
        <span class="flip-b">${it[1]}</span>
      </span>`;
    b.addEventListener('click', () => {
      b.classList.toggle('on');
      if (b.classList.contains('on')) {
        const r = b.getBoundingClientRect();
        burst(14, r.left + r.width / 2, r.top + r.height / 2);
      }
    });
    box.appendChild(b);
  });
})();

/* =========================================================
   5 · LA ROUE DES « BONS POUR »
   ========================================================= */
(function wheel() {
  const PRIZES = [
    ['🎮', 'Une soirée à jouer à tout ce que tu veux, jusqu\'à plus d\'heure.'],
    ['🎬', 'Tu choisis le film. Même le pire. Je ne dirai rien.'],
    ['🎧', 'Une playlist faite rien que pour toi, dans la semaine.'],
    ['🎙️', 'Un vocal de 5 minutes, juste pour t\'endormir.'],
    ['🤡', 'Une photo de moi complètement ridicule, sur demande.'],
    ['🤐', 'Je réponds à 3 questions. Honnêtement. Sans esquiver.'],
    ['🖍️', 'Un dessin de Milo, fait par moi. Désolé d\'avance.'],
    ['📸', 'Une vraie séance photo rien que pour toi, le 16 septembre.'],
    ['🍽️', 'Tu choisis notre tout premier repas du 16 septembre.'],
    ['💛', 'Un compliment par heure pendant 24h. Prépare ton téléphone.']
  ];
  const w = $('#wheel'), btn = $('#wheel-btn'), out = $('#wheel-prize');
  const N = PRIZES.length, seg = 360 / N;
  const cols = ['#ff9a8b', '#ffd27a', '#8fe0c6', '#9ecbff', '#d9bcff'];

  const stops = PRIZES.map((_, i) =>
    `${cols[i % cols.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
  w.style.background = `conic-gradient(${stops})`;

  PRIZES.forEach((p, i) => {
    const s = document.createElement('span');
    s.textContent = p[0];
    s.style.cssText = `position:absolute;inset:0;display:flex;justify-content:center;
      align-items:flex-start;padding-top:7%;font-size:1.4rem;pointer-events:none;
      transform:rotate(${(i + .5) * seg}deg);`;
    w.appendChild(s);
  });

  let angle = 0, spinning = false;
  btn.addEventListener('click', () => {
    if (spinning) return;
    spinning = true; btn.disabled = true;
    out.textContent = '';
    const i = Math.floor(Math.random() * N);
    // le repere est en haut : il faut que le centre du segment i arrive a 0deg
    const want = ((-(i + .5) * seg) % 360 + 360) % 360;
    angle += 360 * 5;
    angle += ((want - angle) % 360 + 360) % 360;
    w.style.transform = `rotate(${angle}deg)`;
    setTimeout(() => {
      spinning = false; btn.disabled = false;
      btn.textContent = 'Retourner la roue 🎡';
      out.textContent = `${PRIZES[i][0]} Bon pour : ${PRIZES[i][1]}`;
      win('wheel', 'Bon pour…', PRIZES[i][1], PRIZES[i][0]);
    }, 4750);
  });
})();

/* =========================================================
   6 · QUIZ
   ========================================================= */
(function quiz() {
  const Q = [
    ['Quel est mon métier de cœur ?',
      ['Photographe 📸', 'Dompteur de lions', 'Vendeur de chaussettes'], 0,
      'Et mon sujet préféré, c\'est encore toi.'],
    ['Comment s\'appelle le chien le plus chanceux du monde ?',
      ['Rex', 'Milo 🐾', 'Jean-Michel'], 1,
      'Il a une copine en or et un beau-père qui l\'aime bien.'],
    ['On se retrouve quand ?',
      ['Le 16 septembre', 'Un jour peut-être', 'En 2074'], 0,
      'Et je compte les jours, littéralement.'],
    ['Combien de fois par jour je pense à toi ?',
      ['Une ou deux', 'Beaucoup trop', 'Jamais'], 1,
      'C\'est même un peu ingérable, si tu veux tout savoir.'],
    ['Qu\'est-ce que je préfère chez toi ?',
      ['Tes yeux', 'Ton rire', 'Tout, en fait'], 2,
      'Question piège, désolé. La bonne réponse était toujours « tout ».'],
    ['Si je pouvais être quelque part là tout de suite ?',
      ['À côté de toi', 'Au ski', 'Sur la Lune'], 0,
      'Sans aucune hésitation.'],
    ['Qui a le plus de chance dans cette histoire ?',
      ['Toi', 'Moi', 'Milo'], 1,
      'Ce n\'était même pas une vraie question.'],
    ['Est-ce que tu es la meilleure copine du monde ?',
      ['Oui', 'Évidemment', 'Sans discussion'], 0,
      'Les trois réponses étaient bonnes. Je te l\'avais dit, c\'est truqué. 💛']
  ];
  const box = $('#quiz'), msg = $('#quiz-msg');
  let good = 0, answered = 0;

  Q.forEach((q, qi) => {
    const d = document.createElement('div');
    d.className = 'q';
    d.innerHTML = `<p class="q-t"><span>${qi + 1}.</span> ${q[0]}</p>`;
    const o = document.createElement('div');
    o.className = 'opts';
    q[1].forEach((label, oi) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = label;
      b.addEventListener('click', () => {
        d.classList.add('done');
        const ok = (qi === 7) || (oi === q[2]);
        b.classList.add(ok ? 'good' : 'bad');
        if (!ok) o.children[q[2]].classList.add('good');
        if (ok) good++;
        answered++;
        const fb = document.createElement('p');
        fb.className = 'q-fb';
        fb.textContent = q[3];
        d.appendChild(fb);
        msg.textContent = `${answered} / ${Q.length} — ${good} bonnes réponses`;
        if (answered === Q.length) {
          setTimeout(() => win('quiz', `${good} / ${Q.length} !`,
            good >= 6 ? 'Tu me connais par cœur. C\'est flippant et c\'est adorable.'
                      : 'On va dire que le barème était sévère. Tu gagnes quand même.', '🧩'), 400);
        }
      });
      o.appendChild(b);
    });
    d.appendChild(o);
    box.appendChild(d);
  });
})();

/* =========================================================
   7 · LE BOUQUET
   ========================================================= */
(function bouquet() {
  const F = [
    ['🌹', 'Pour te dire que je t\'aime, simplement.'],
    ['🌷', 'Pour ta douceur.'],
    ['🌻', 'Pour ta bonne humeur contagieuse.'],
    ['🌸', 'Pour ton sourire, celui du matin.'],
    ['🌺', 'Pour ton caractère. Oui, celui-là aussi.'],
    ['💮', 'Pour ta patience avec la distance.'],
    ['🪻', 'Pour tous les soirs où tu m\'as remonté le moral.'],
    ['🌼', 'Pour tout ce qui arrive après le 16 septembre.']
  ];
  const field = $('#field'), vase = $('#vase-flowers'), msg = $('#bouquet-msg');
  let got = 0;

  F.forEach(f => {
    const b = document.createElement('button');
    b.className = 'flower';
    b.textContent = f[0];
    b.addEventListener('click', () => {
      b.classList.add('picked');
      vase.textContent += f[0];
      got++;
      msg.textContent = `${got} / ${F.length} fleurs`;
      const r = b.getBoundingClientRect();
      burst(16, r.left + r.width / 2, r.top + r.height / 2);
      popup('Une fleur cueillie', f[1], f[0]);
      if (got === F.length) {
        msg.textContent = 'Ton bouquet est complet 💐';
        setTimeout(() => win('bouquet', 'Bouquet complet !',
          'Huit fleurs, huit raisons. Le vrai bouquet arrive le 16 septembre.', '💐'), 500);
      }
    });
    field.appendChild(b);
  });
})();

/* =========================================================
   MACHINE À COMPLIMENTS
   ========================================================= */
(function machine() {
  const C = [
    'Tu as le rire le plus contagieux que je connaisse.',
    'Tu rends les journées banales largement moins banales.',
    'Tu es la personne la plus attentionnée que j\'aie rencontrée.',
    'Même de loin, tu prends de la place dans ma journée.',
    'Tu es drôle. Vraiment drôle. Pas « drôle pour une copine ».',
    'Ta manière de t\'inquiéter pour les autres, c\'est rare.',
    'Tu es plus forte que ce que tu crois.',
    'J\'aime la façon dont tu dis mon prénom.',
    'Tu as un goût de musique bien meilleur que le mien. Voilà, c\'est dit.',
    'Quand tu es fière de quelque chose, ça se voit, et c\'est magnifique.',
    'Tu me rends meilleur, sans forcer, juste en étant là.',
    'Tu es très belle. Et pas seulement sur les photos que je prends.',
    'Tu écoutes vraiment les gens. Presque personne ne fait ça.',
    'Milo a beaucoup, beaucoup de chance.',
    'Tu as ce talent de rendre les choses légères quand elles sont lourdes.',
    'Je suis fier de dire que tu es ma copine.',
    'Tu es la seule à qui j\'ai envie de raconter les trucs sans intérêt.',
    'Ton énergie quand tu es contente, c\'est un feu d\'artifice.',
    'Tu es incroyablement gentille, même avec les gens qui ne le méritent pas.',
    'Je préfère t\'attendre toi que d\'avoir quelqu\'un d\'autre tout de suite.',
    'Tu as des idées bien meilleures que les miennes. Je le reconnais rarement.',
    'Tu es apaisante. C\'est le plus beau compliment que je connaisse.',
    'Quand tu me manques, c\'est bruyant. Ça veut tout dire.',
    'Tu es courageuse dans des trucs dont tu ne parles jamais.',
    'Ton sourire arrive à traverser un écran. C\'est un fait scientifique.',
    'Tu mérites qu\'on te le dise beaucoup plus souvent.',
    'Tu es exactement la bonne dose de folie.',
    'Personne ne me comprend aussi vite que toi.',
    'Tu as rendu la distance supportable. Personne d\'autre n\'aurait pu.',
    'Si c\'était à refaire, je te rechoisirais tout de suite.'
  ];
  const scr = $('#mach-screen'), btn = $('#mach-btn'), cnt = $('#mach-count');
  let bag = [], n = 0;
  btn.addEventListener('click', () => {
    if (!bag.length) bag = [...C].sort(() => Math.random() - .5);
    scr.textContent = bag.pop();
    scr.classList.remove('flash'); void scr.offsetWidth; scr.classList.add('flash');
    n++;
    cnt.textContent = n === 1 ? '' : `${n} compliments distribués. Continue, j'en ai encore.`;
    const r = btn.getBoundingClientRect();
    burst(10, r.left + r.width / 2, r.top);
  });
})();

/* =========================================================
   FINAL
   ========================================================= */
(function final() {
  const T = new Date(2026, 8, 16);
  const mid = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const d = Math.max(0, Math.ceil((mid(T) - mid(new Date())) / 86400000));
  $('#days-left').textContent = d;
  $('#boom').addEventListener('click', () => burst(260));
})();

refreshStamps();
