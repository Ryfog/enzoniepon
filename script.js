/* ============================================================
   Enzo Niepon — Photographe · Interactions
   (thème sombre, nav, révélations, parallaxe, filtres,
    lightbox, carrousel, formulaires, retour en haut)
   ============================================================ */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- thème sombre ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem('cl_theme');
  if (saved) root.dataset.theme = saved;
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';

  const syncThemeIcon = () => {
    $$('.theme-toggle').forEach(b => {
      b.innerHTML = root.dataset.theme === 'dark' ? ICONS.sun : ICONS.moon;
      b.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Mode clair' : 'Mode sombre');
    });
  };
  const ICONS = {
    moon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun:  '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>'
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('.theme-toggle');
    if (!t) return;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('cl_theme', root.dataset.theme);
    syncThemeIcon();
  });
  syncThemeIcon();

  /* ---------- navigation ---------- */
  const nav = $('.nav');
  const links = $('.nav-links');
  const burger = $('.burger');
  const onScrollNav = () => nav && nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('open');
    links?.classList.remove('open');
  }));

  /* ---------- révélation au scroll ---------- */
  const flat = location.search.includes('flat');   // ?flat = tout visible (captures/tests)
  if (flat || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(el => el.classList.add('in'));
    document.documentElement.style.scrollBehavior = 'auto';
    if (location.search.includes('nohero')) $('.hero')?.remove();
    const cm = location.search.match(/cut=([a-z]+)/);
    if (cm) {
      const stop = document.getElementById(cm[1]);
      if (stop) for (const c of [...$('main').children]) { if (c === stop) break; c.remove(); }
    }
    const sm = location.search.match(/scroll=(\d+)/);
    if (sm) setTimeout(() => scrollTo(0, +sm[1]), 400);
    if (location.search.includes('probe')) {
      setTimeout(() => {
        const bad = [...document.querySelectorAll('body *')]
          .filter(el => el.getBoundingClientRect().width > innerWidth + 2)
          .slice(0, 6)
          .map(el => el.tagName + '.' + [...el.classList].join('.') + '=' + Math.round(el.getBoundingClientRect().width));
        document.title = 'W' + document.documentElement.scrollWidth + '/' + innerWidth + ' | ' + bad.join(' | ');
      }, 800);
    }
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- parallaxe légère du hero ---------- */
  const heroBg = $('.hero-bg');
  if (heroBg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        heroBg.style.transform = `translateY(${scrollY * 0.28}px)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- filtres portfolio ---------- */
  const photos = $$('.ph');
  $$('.filter').forEach(f => f.addEventListener('click', () => {
    $$('.filter').forEach(x => x.classList.remove('active'));
    f.classList.add('active');
    const cat = f.dataset.cat;
    photos.forEach(p => {
      const show = cat === 'tous' || p.dataset.cat === cat;
      if (show) {
        p.classList.remove('hidden');
        p.style.opacity = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => { p.style.opacity = 1; }));
      } else p.classList.add('hidden');
    });
  }));

  /* ---------- lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('.lightbox img');
  const lbCap = $('.lb-caption');
  let visible = [], idx = 0;

  const openLb = i => {
    visible = photos.filter(p => !p.classList.contains('hidden'));
    idx = i;
    render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const render = () => {
    const p = visible[idx];
    if (!p) return;
    const im = $('img', p);
    lbImg.src = im.dataset.full || im.src;
    lbImg.alt = im.alt;
    lbCap.textContent = im.alt;
    const ex = $('.lb-exif');
    if (ex) ex.textContent = p.dataset.exif || '';
  };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  const step = d => { idx = (idx + d + visible.length) % visible.length; render(); };

  photos.forEach(p => p.addEventListener('click', () => {
    const vis = photos.filter(x => !x.classList.contains('hidden'));
    openLb(vis.indexOf(p));
  }));
  $('.lb-close')?.addEventListener('click', closeLb);
  $('.lb-prev')?.addEventListener('click', e => { e.stopPropagation(); step(-1); });
  $('.lb-next')?.addEventListener('click', e => { e.stopPropagation(); step(1); });
  lb?.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------- carrousel avis ---------- */
  const track = $('.car-track');
  if (track) {
    const slides = $$('.review', track).length;
    const dotsBox = $('.car-nav');
    let cur = 0, timer;
    for (let i = 0; i < slides; i++) {
      const d = document.createElement('button');
      d.className = 'dot' + (i ? '' : ' active');
      d.setAttribute('aria-label', `Avis ${i + 1}`);
      d.addEventListener('click', () => go(i));
      dotsBox.appendChild(d);
    }
    const go = i => {
      cur = (i + slides) % slides;
      track.style.transform = `translateX(-${cur * 100}%)`;
      $$('.dot', dotsBox).forEach((d, k) => d.classList.toggle('active', k === cur));
      restart();
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 6500); };
    $('.car-arrow.prev')?.addEventListener('click', () => go(cur - 1));
    $('.car-arrow.next')?.addEventListener('click', () => go(cur + 1));
    $('.carousel')?.addEventListener('mouseenter', () => clearInterval(timer));
    $('.carousel')?.addEventListener('mouseleave', restart);
    restart();
  }

  /* ---------- comparateur avant / après ---------- */
  const baFrame = $('.ba-frame');
  if (baFrame) {
    // avant = photos/avant/<file>.jpg ; après = photos/<file>.jpg (sauf "apres" spécifique)
    const PAIRS = [
      { f: 'mainecoon-regard',  n: 'Regard de Maine Coon' },
      { f: 'chat-oeil-gris',    n: 'L’œil d’or' },
      { f: 'chien-foret',       n: 'Balade en forêt' },
      { f: 'chat-dore',         n: 'Heure dorée' },
      { f: 'mainecoon-lumiere', n: 'Maine Coon majestueux' },
      { f: 'papillon-orange',   n: 'Papillon au repos' },
      { f: 'chat-jungle',       n: 'Petit tigre urbain' },
      { f: 'mainecoon-affut',   n: 'L’approche' },
      { f: 'chien-regard-ciel', n: 'Les yeux au ciel' },
      { f: 'chien-face',        n: 'Regard complice', apres: 'photos/avant/chien-face-apres.jpg' },
      { f: 'mainecoon-jardin',  n: 'Cache-cache au jardin' },
      { f: 'eglise',            n: 'Clocher au couchant' },
      { f: 'oiseau-fil',        n: 'Le funambule' },
      { f: 'oiseau-lampadaire', n: 'Perché sous les nuages' },
      { f: 'guepe-fleurs',      n: 'La butineuse' },
      { f: 'chat-oeil-ambre',   n: 'Ambre' },
      { f: 'mains-henne',       n: 'Mains liées' },
    ];
    const before = $('.ba-before', baFrame);
    const after = $('.ba-after', baFrame);
    const wrap = $('.ba-before-wrap', baFrame);
    const divider = $('.ba-divider', baFrame);
    const range = $('.ba-range', baFrame);
    const caption = $('.ba-caption');
    const thumbs = $('.ba-thumbs');

    const setPos = p => {
      wrap.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      divider.style.left = p + '%';
    };
    range.addEventListener('input', () => setPos(+range.value));

    const select = i => {
      const pair = PAIRS[i];
      before.src = `photos/avant/${pair.f}.jpg`;
      after.src = pair.apres || `photos/${pair.f}.jpg`;
      caption.innerHTML = `<b>${pair.n}</b><br>Fichier brut · Sony α7 IV &nbsp;→&nbsp; retouche Lightroom`;
      range.value = 50;
      setPos(50);
      $$('.ba-thumb', thumbs).forEach((t, k) => t.classList.toggle('active', k === i));
    };

    PAIRS.forEach((pair, i) => {
      const b = document.createElement('button');
      b.className = 'ba-thumb' + (i ? '' : ' active');
      b.setAttribute('aria-label', `Comparer : ${pair.n}`);
      b.innerHTML = `<img src="photos/${pair.f}.jpg" alt="" loading="lazy" decoding="async">`;
      b.addEventListener('click', () => select(i));
      thumbs.appendChild(b);
    });
    select(0);
  }

  /* ---------- comparateur intégré aux photos du portfolio ---------- */
  // photos ayant un fichier brut aligné dans photos/avant/ (chien-face exclu : cadrage différent)
  const INPLACE = ['mainecoon-regard', 'mainecoon-lumiere', 'mainecoon-affut', 'mainecoon-jardin',
    'chat-jungle', 'chat-dore', 'chat-oeil-gris', 'chat-oeil-ambre',
    'chien-foret', 'chien-regard-ciel', 'eglise', 'mains-henne',
    'oiseau-fil', 'oiseau-lampadaire', 'guepe-fleurs', 'papillon-orange'];
  photos.forEach(fig => {
    const im = $('img', fig);
    const m = (im?.getAttribute('src') || '').match(/photos\/([a-z-]+)\.jpg$/);
    if (!m || !INPLACE.includes(m[1])) return;

    const wrap = document.createElement('div');
    wrap.className = 'phba-wrap';
    wrap.innerHTML = `<img data-src="photos/avant/${m[1]}.jpg" alt="" aria-hidden="true" decoding="async">`;
    const line = document.createElement('div');
    line.className = 'phba-line';
    line.innerHTML = '<button class="phba-grip" aria-label="Comparer avec la photo brute (glisser vers la droite)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5l-5 7 5 7M16 5l5 7-5 7"/></svg></button>';
    const tag = document.createElement('span');
    tag.className = 'phba-tag';
    tag.textContent = 'Brut';
    im.after(wrap, line, tag);

    const bimg = $('img', wrap);
    const grip = $('.phba-grip', line);
    const setP = p => {
      p = Math.max(0, Math.min(100, p));
      wrap.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      line.style.left = p + '%';
      fig.classList.toggle('ba-open', p > 2);
      return p;
    };
    const loadRaw = () => { if (!bimg.src) bimg.src = bimg.dataset.src; };
    let dragging = false;
    grip.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      loadRaw();
      grip.setPointerCapture(e.pointerId);
      dragging = true;
    });
    grip.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = fig.getBoundingClientRect();
      setP((e.clientX - r.left) / r.width * 100);
    });
    const stop = () => { dragging = false; };
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
    grip.addEventListener('click', e => e.stopPropagation());   // ne pas ouvrir la lightbox
    grip.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); e.stopPropagation();
      loadRaw();
      const cur = parseFloat(line.style.left) || 0;
      setP(cur + (e.key === 'ArrowRight' ? 5 : -5));
    });

    const bam = location.search.match(/ba=(\d+)/);   // ?ba=40 : position de test (captures)
    if (bam) { loadRaw(); setP(+bam[1]); }
  });

  /* ---------- prestations -> préremplir la réservation ---------- */
  $$('[data-book]').forEach(a => a.addEventListener('click', () => {
    const sel = $('#f-type');
    if (sel) sel.value = a.dataset.book;
  }));

  /* ---------- formulaire réservation (mailto) ---------- */
  $('#booking-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const v = id => $(id)?.value.trim() || '';
    const body =
`Bonjour Enzo,

Je souhaite réserver une séance photo.

Nom : ${v('#f-nom')}
Email : ${v('#f-email')}
Téléphone : ${v('#f-tel')}
Type de séance : ${v('#f-type')}
Date souhaitée : ${v('#f-date')}

Message :
${v('#f-msg')}`;
    location.href = `mailto:enzo.nieponpro@gmail.com?subject=${encodeURIComponent('Demande de séance — ' + v('#f-type'))}&body=${encodeURIComponent(body)}`;
    const note = $('.form-note');
    if (note) note.textContent = 'Votre logiciel de mail vient de s’ouvrir avec votre demande pré-remplie ✨';
  });

  /* ---------- newsletter (démo) ---------- */
  $('#nl-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#nl-email');
    $('#nl-ok').textContent = `Merci ! ${inp.value} est bien inscrit ♡`;
    inp.value = '';
  });

  /* ---------- retour en haut ---------- */
  const toTop = $('.to-top');
  const onScrollTop = () => toTop?.classList.toggle('show', scrollY > 700);
  addEventListener('scroll', onScrollTop, { passive: true });
  onScrollTop();
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- année copyright ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- ouverture façon obturateur ---------- */
  const shutter = $('#shutter');
  if (shutter) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || flat || sessionStorage.getItem('en_shutter')) {
      shutter.classList.add('done');
    } else {
      sessionStorage.setItem('en_shutter', '1');
      setTimeout(() => shutter.classList.add('done'), 1500);   // filet de securite
      const iris = $('#iris');
      const t0 = performance.now(), DUR = 950;
      const circle = r => `M0 0H100V100H0Z M50 50 m${-r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`;
      const ease = t => 1 - Math.pow(1 - t, 3);
      const tick = now => {
        const t = Math.min(1, (now - t0) / DUR);
        iris.setAttribute('d', circle(0.2 + ease(t) * 90));
        if (t < 1) requestAnimationFrame(tick);
        else shutter.classList.add('done');
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- easter egg : traversée de pattes 🐾 ---------- */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !flat) {
    const walkPaws = () => {
      const fromLeft = Math.random() < 0.5;
      const y0 = innerHeight * (0.25 + Math.random() * 0.55);
      const y1 = innerHeight * (0.25 + Math.random() * 0.55);
      const steps = 9;
      const ang = Math.atan2(y1 - y0, fromLeft ? innerWidth : -innerWidth) * 180 / Math.PI + 90;
      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          const paw = document.createElement('span');
          paw.className = 'paw';
          paw.textContent = '🐾';
          const t = i / (steps - 1);
          const x = fromLeft ? t * (innerWidth + 40) - 20 : (1 - t) * (innerWidth + 40) - 20;
          const yy = y0 + (y1 - y0) * t + (i % 2 ? -14 : 14);
          paw.style.left = x + 'px';
          paw.style.top = yy + 'px';
          paw.style.transform = `rotate(${ang + (fromLeft ? 0 : 180)}deg)`;
          document.body.appendChild(paw);
          setTimeout(() => paw.remove(), 3800);
        }, i * 260);
      }
    };
    const loop = () => {
      walkPaws();
      setTimeout(loop, 55000 + Math.random() * 65000);
    };
    setTimeout(loop, 20000 + Math.random() * 15000);
  }
})();
