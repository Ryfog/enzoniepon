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
})();
