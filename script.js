/* ============================================================
   Enzo Niepon — Photographe · Interactions
   (thème sombre, nav, révélations, parallaxe, filtres,
    lightbox, carrousel, formulaires, retour en haut)
   Tout doit rester fluide sur téléphone : un seul gestionnaire de
   défilement, rien qui recalcule la page pendant qu'on fait défiler,
   et les photos qui « se développent » depuis un aperçu flou.
   ============================================================ */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flat = location.search.includes('flat');   // ?flat = tout visible (captures/tests)
  const lire = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  /* ---------- thème sombre ---------- */
  const saved = lire('cl_theme');
  if (saved) root.dataset.theme = saved;
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';

  const ICONS = {
    moon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun:  '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>'
  };
  const syncThemeIcon = () => {
    $$('.theme-toggle').forEach(b => {
      b.innerHTML = root.dataset.theme === 'dark' ? ICONS.sun : ICONS.moon;
      b.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Mode clair' : 'Mode sombre');
    });
  };
  //  Le nouveau thème s'ouvre en cercle depuis le bouton, comme un diaphragme
  document.addEventListener('click', e => {
    const t = e.target.closest('.theme-toggle');
    if (!t) return;
    const basculer = () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      ecrire('cl_theme', root.dataset.theme);
      syncThemeIcon();
    };
    if (!document.startViewTransition || reduit) { basculer(); return; }
    const r = t.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rayon = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    const vt = document.startViewTransition(basculer);
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rayon}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.22,.8,.28,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
    vt.finished.finally(() => root.classList.remove('vt-theme'));
  });
  syncThemeIcon();

  /* ---------- navigation ---------- */
  const nav = $('.nav');
  const links = $('.nav-links');
  const burger = $('.burger');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    links?.classList.toggle('open');
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('open');
    links?.classList.remove('open');
  }));

  //  Le lien de la section qu'on lit s'allume dans le menu
  if ('IntersectionObserver' in window) {
    const liens = new Map($$('.nav-links a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
    const espion = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) liens.forEach((a, id) => a.classList.toggle('actif', id === en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    [...liens.keys(), 'accueil'].forEach(id => { const s = document.getElementById(id); if (s) espion.observe(s); });
  }

  /* ---------- un seul gestionnaire de défilement ---------- */
  const heroBg = $('.hero-bg');
  const hero = $('.hero');
  const toTop = $('.to-top');
  const parallaxe = heroBg && !reduit;
  let hautHero = hero ? hero.offsetHeight : 0;
  let prevu = false;
  const auDefilement = () => {
    prevu = false;
    const y = scrollY;
    nav?.classList.toggle('scrolled', y > 40);
    toTop?.classList.toggle('show', y > 700);
    //  La parallaxe ne travaille que tant que la photo d'accueil est à l'écran
    if (parallaxe && y < hautHero + 120) heroBg.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
  };
  addEventListener('scroll', () => {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(auDefilement);
  }, { passive: true });
  addEventListener('resize', () => { hautHero = hero ? hero.offsetHeight : 0; }, { passive: true });
  auDefilement();
  toTop?.addEventListener('click', () => {
    if (window.lenis) window.lenis.scrollTo(0, { duration: 1.4 });
    else scrollTo({ top: 0, behavior: reduit ? 'auto' : 'smooth' });
  });

  /* ---------- révélation au scroll ---------- */
  if (flat || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(el => el.classList.add('in'));
    root.style.scrollBehavior = 'auto';
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
        document.title = 'W' + root.scrollWidth + '/' + innerWidth + ' | ' + bad.join(' | ');
      }, 800);
    }
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- les photos se développent depuis leur aperçu flou ---------- */
  root.classList.add('js-fondu');
  const aDevelopper = $$('.recent img, .insta-strip img');
  aDevelopper.forEach(im => {
    const net = () => im.classList.add('charge');
    if (im.complete && im.naturalWidth) net();
    else {
      im.addEventListener('load', net, { once: true });
      im.addEventListener('error', net, { once: true });
    }
  });
  //  Filet de sécurité : rien ne reste invisible si un navigateur ne prévient pas
  setTimeout(() => aDevelopper.forEach(im => { if (im.complete) im.classList.add('charge'); }), 6000);

  /* ---------- lightbox : les photos de la bague « Dans l'objectif » ---------- */
  const photos = $$('.obj-carte');
  const lb = $('.lightbox');
  const lbImg = $('.lightbox img');
  const lbCap = $('.lb-caption');
  const lbExif = $('.lb-exif');
  let lbCount = $('.lb-count');
  if (lb && !lbCount) {
    lbCount = document.createElement('p');
    lbCount.className = 'lb-count';
    lb.appendChild(lbCount);
  }
  let visible = [], idx = 0, jeton = 0, dernierFocus = null;
  const grande = p => { const im = $('img', p); return im.dataset.full || im.getAttribute('src'); };
  const precharger = i => {
    const p = visible[(i + visible.length) % visible.length];
    if (!p) return;
    const x = new Image();
    x.decoding = 'async';
    x.src = grande(p);
  };
  //  La grande photo n'est posée qu'une fois décodée : pas d'image à moitié dessinée
  const afficher = fondu => {
    const p = visible[idx];
    if (!p || !lbImg) return;
    const im = $('img', p), src = grande(p), moi = ++jeton;
    if (lbCap) lbCap.textContent = im.alt;
    if (lbExif) lbExif.textContent = p.dataset.exif || '';
    if (lbCount) lbCount.textContent = (idx + 1) + ' / ' + visible.length;
    if (fondu) lbImg.classList.add('change');
    else { lbImg.src = im.currentSrc || src; lbImg.alt = im.alt; lbImg.classList.remove('change'); }
    const tmp = new Image();
    tmp.decoding = 'async';
    tmp.src = src;
    const decode = tmp.decode ? tmp.decode() : new Promise(r => { tmp.onload = tmp.onerror = r; });
    Promise.all([decode.catch(() => {}), new Promise(r => setTimeout(r, fondu ? 170 : 0))]).then(() => {
      if (moi !== jeton) return;
      lbImg.src = src;
      lbImg.alt = im.alt;
      requestAnimationFrame(() => lbImg.classList.remove('change'));
    });
    precharger(idx + 1);
    precharger(idx - 1);
  };
  const openLb = i => {
    if (!lb) return;
    visible = photos;
    idx = Math.max(0, i);
    dernierFocus = document.activeElement;
    afficher(false);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    dispatchEvent(new Event('visionneuse:ouverte'));
    $('.lb-close')?.focus({ preventScroll: true });
  };
  const closeLb = () => {
    if (!lb?.classList.contains('open')) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
    //  la bague tourne jusqu'à la dernière photo regardée
    dispatchEvent(new CustomEvent('visionneuse:fermee', { detail: { index: idx } }));
    dernierFocus?.focus?.({ preventScroll: true });
  };
  const step = d => { if (!visible.length) return; idx = (idx + d + visible.length) % visible.length; afficher(true); };

  //  En 3D, seule la photo du premier plan s'ouvre : les autres font tourner la bague (motion.js)
  photos.forEach((c, i) => c.addEventListener('click', () => {
    if (c.closest('.en-3d') && !c.classList.contains('devant')) return;
    openLb(i);
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
  //  Sur téléphone : glisser pour changer de photo, tirer vers le bas pour fermer
  let doigt = null;
  lb?.addEventListener('touchstart', e => { const t = e.changedTouches[0]; doigt = { x: t.clientX, y: t.clientY }; }, { passive: true });
  lb?.addEventListener('touchend', e => {
    if (!doigt) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - doigt.x, dy = t.clientY - doigt.y;
    doigt = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) closeLb();
  }, { passive: true });

  /* ---------- carrousel avis ---------- */
  const track = $('.car-track');
  const carousel = $('.carousel');
  if (track) {
    const slides = $$('.review', track).length;
    const dotsBox = $('.car-nav');
    let cur = 0, timer, carVisible = true;
    for (let i = 0; i < slides; i++) {
      const d = document.createElement('button');
      d.className = 'dot' + (i ? '' : ' active');
      d.setAttribute('aria-label', `Avis ${i + 1}`);
      d.addEventListener('click', () => go(i));
      dotsBox?.appendChild(d);
    }
    const go = i => {
      cur = (i + slides) % slides;
      track.style.transform = `translate3d(-${cur * 100}%, 0, 0)`;
      $$('.dot', dotsBox).forEach((d, k) => d.classList.toggle('active', k === cur));
      restart();
    };
    //  Le défilement automatique s'arrête quand on ne le regarde pas
    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => { if (carVisible && !document.hidden) go(cur + 1); }, 6500);
    };
    if ('IntersectionObserver' in window && carousel) {
      new IntersectionObserver(e => { carVisible = e[0].isIntersecting; }).observe(carousel);
    }
    $('.car-arrow.prev')?.addEventListener('click', () => go(cur - 1));
    $('.car-arrow.next')?.addEventListener('click', () => go(cur + 1));
    carousel?.addEventListener('mouseenter', () => clearInterval(timer));
    carousel?.addEventListener('mouseleave', restart);
    let pouce = null;
    carousel?.addEventListener('touchstart', e => { pouce = e.changedTouches[0].clientX; }, { passive: true });
    carousel?.addEventListener('touchend', e => {
      if (pouce == null) return;
      const dx = e.changedTouches[0].clientX - pouce;
      pouce = null;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    restart();
  }

  /* ---------- comparateur avant / après ---------- */
  const baFrame = $('.ba-frame');
  if (baFrame) {
    // avant = photos/avant/<file>.jpg ; après = photos/<file>.jpg (sauf "apres" spécifique)
    const PAIRS = [
      { f: 'mainecoon-regard',  n: 'Regard de Maine Coon' },
      { f: 'chat-oeil-gris',    n: 'L’œil d’or' },
      { f: 'chat-dore',         n: 'Heure dorée' },
      { f: 'mainecoon-lumiere', n: 'Maine Coon majestueux' },
      { f: 'papillon-orange',   n: 'Papillon au repos' },
      { f: 'chat-jungle',       n: 'Petit tigre urbain' },
      { f: 'chien-regard-ciel', n: 'Les yeux au ciel' },
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

    //  Le curseur suit le doigt image par image, sans jamais bloquer le défilement
    let pos = 50, prevuBa = false;
    const peindre = () => {
      prevuBa = false;
      wrap.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
      divider.style.transform = `translate3d(${pos / 100 * baFrame.clientWidth}px, 0, 0)`;
    };
    const setPos = p => { pos = p; if (!prevuBa) { prevuBa = true; requestAnimationFrame(peindre); } };
    range.addEventListener('input', () => setPos(+range.value));
    addEventListener('resize', () => setPos(pos), { passive: true });

    const select = i => {
      const pair = PAIRS[i];
      before.src = `photos/avant/webp/${pair.f}.webp`;
      after.src = pair.apres || `photos/webp/${pair.f}.webp`;
      caption.innerHTML = `<b>${pair.n}</b><br>Fichier brut · Sony α7 IV &nbsp;→&nbsp; retouche Lightroom`;
      range.value = 50;
      setPos(50);
      $$('.ba-thumb', thumbs).forEach((t, k) => t.classList.toggle('active', k === i));
    };

    PAIRS.forEach((pair, i) => {
      const b = document.createElement('button');
      b.className = 'ba-thumb' + (i ? '' : ' active');
      b.setAttribute('aria-label', `Comparer : ${pair.n}`);
      b.innerHTML = `<img src="photos/webp/${pair.f}-480.webp" width="62" height="62" alt="" loading="lazy" decoding="async">`;
      b.addEventListener('click', () => select(i));
      thumbs.appendChild(b);
    });
    select(0);
  }

  /* ---------- carte : chargée seulement si on la demande ---------- */
  //  L'intégration Google Maps pèse plus que tout le reste du site : elle
  //  ne se charge qu'au clic, ce qui garde le défilement fluide (et ne pose
  //  aucun cookie Google tant que le visiteur n'a rien demandé).
  $('.map-ouvrir')?.addEventListener('click', e => {
    const b = e.currentTarget;
    const cadre = b.closest('.map-facade');
    const f = document.createElement('iframe');
    f.className = 'map-frame';
    f.src = b.dataset.carte;
    f.title = 'Carte — zone d’intervention';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    cadre.replaceWith(f);
  });

  /* ---------- prestations -> préremplir la réservation ---------- */
  $$('[data-book]').forEach(a => a.addEventListener('click', () => {
    const sel = $('#f-type');
    if (sel) sel.value = a.dataset.book;
  }));

  /* ---------- formulaire réservation (envoi direct via FormSubmit) ---------- */
  $('#booking-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const v = id => $(id)?.value.trim() || '';
    const note = $('.form-note');
    const btn = $('#booking-form .btn-solid');
    btn.disabled = true;
    if (note) note.textContent = 'Envoi en cours…';
    try {
      const res = await fetch('https://formsubmit.co/ajax/enzo.nieponpro@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: 'Demande de séance — ' + v('#f-type'),
          _template: 'table',
          Nom: v('#f-nom'),
          Email: v('#f-email'),
          'Téléphone': v('#f-tel'),
          'Type de séance': v('#f-type'),
          'Date souhaitée': v('#f-date'),
          Message: v('#f-msg'),
        }),
      });
      if (!res.ok) throw new Error();
      if (note) note.textContent = 'Demande envoyée ✨ Je vous réponds sous 24 h !';
      e.target.reset();
    } catch {
      // secours : ouverture du logiciel de mail
      const body = `Bonjour Enzo,\n\nJe souhaite réserver une séance photo.\n\nNom : ${v('#f-nom')}\nEmail : ${v('#f-email')}\nTéléphone : ${v('#f-tel')}\nType de séance : ${v('#f-type')}\nDate souhaitée : ${v('#f-date')}\n\nMessage :\n${v('#f-msg')}`;
      location.href = `mailto:enzo.nieponpro@gmail.com?subject=${encodeURIComponent('Demande de séance — ' + v('#f-type'))}&body=${encodeURIComponent(body)}`;
      if (note) note.textContent = 'Votre logiciel de mail vient de s’ouvrir avec votre demande pré-remplie ✨';
    }
    btn.disabled = false;
  });

  /* ---------- newsletter (envoi via FormSubmit) ---------- */
  $('#nl-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#nl-email');
    const email = inp.value.trim();
    $('#nl-ok').textContent = 'Inscription…';
    try {
      await fetch('https://formsubmit.co/ajax/enzo.nieponpro@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: 'Newsletter — nouvelle inscription', _template: 'table', Email: email }),
      });
    } catch {}
    $('#nl-ok').textContent = `Merci ! ${email} est bien inscrit ♡`;
    inp.value = '';
  });

  /* ---------- année copyright ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- ouverture façon obturateur ---------- */
  const shutter = $('#shutter');
  if (shutter) {
    let dejaVu = false;
    try { dejaVu = !!sessionStorage.getItem('en_shutter'); } catch {}
    if (reduit || flat || dejaVu) {
      shutter.classList.add('done');
    } else {
      try { sessionStorage.setItem('en_shutter', '1'); } catch {}
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
  if (!reduit && !flat) {
    const walkPaws = () => {
      if (document.hidden) return;
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
