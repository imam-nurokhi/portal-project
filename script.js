/* ============================================
   CENTRAL HUB – script.js
   Portal interactions: search, filter, mobile menu
   ============================================ */

(function () {
  'use strict';

  /* ── Init Lucide icons ─────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
      lucide.createIcons();
    }
    init();
  });

  /* ── State ─────────────────────────────────── */
  const state = {
    query: '',
    category: 'all',
  };

  /* ── DOM refs ───────────────────────────────── */
  let cards, searchInput, searchClear, resultsCount;
  let hamburger, mobileOverlay, mobilePanel;
  let emptyState, btnReset;
  let desktopPills, mobilePills;

  function init() {
    /* Query DOM */
    cards         = Array.from(document.querySelectorAll('.portal-card'));
    searchInput   = document.getElementById('searchInput');
    searchClear   = document.getElementById('searchClear');
    resultsCount  = document.getElementById('resultsCount');
    hamburger     = document.getElementById('hamburger');
    mobileOverlay = document.getElementById('mobileOverlay');
    mobilePanel   = document.getElementById('mobilePanel');
    emptyState    = document.getElementById('emptyState');
    btnReset      = document.getElementById('btnReset');
    desktopPills  = document.querySelectorAll('#navFilters .filter-pill');
    mobilePills   = document.querySelectorAll('.mobile-filter-pill');

    /* Wire up events */
    bindSearch();
    bindFilters();
    bindMobileMenu();
    bindMisc();

    /* Run initial filter pass */
    applyFilters();

    /* Keyboard shortcut: Ctrl+K / Cmd+K to focus search */
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      if (e.key === 'Escape') {
        if (isMobileMenuOpen()) closeMobileMenu();
        if (state.query) clearSearch();
      }
    });
  }

  /* ────────────────────────────────────────────
     SEARCH
  ──────────────────────────────────────────── */
  function bindSearch() {
    searchInput.addEventListener('input', debounce(() => {
      state.query = searchInput.value.trim().toLowerCase();
      toggleClearButton();
      applyFilters();
    }, 120));

    searchClear.addEventListener('click', clearSearch);
  }

  function clearSearch() {
    searchInput.value = '';
    state.query = '';
    toggleClearButton();
    applyFilters();
    searchInput.focus();
  }

  function toggleClearButton() {
    if (state.query.length > 0) {
      searchClear.classList.add('visible');
    } else {
      searchClear.classList.remove('visible');
    }
  }

  /* ────────────────────────────────────────────
     FILTER (category pills)
  ──────────────────────────────────────────── */
  function bindFilters() {
    desktopPills.forEach(pill => {
      pill.addEventListener('click', () => {
        setCategory(pill.dataset.category);
      });
    });

    mobilePills.forEach(pill => {
      pill.addEventListener('click', () => {
        setCategory(pill.dataset.category);
        closeMobileMenu();
      });
    });
  }

  function setCategory(cat) {
    state.category = cat;
    updatePillUI();
    applyFilters();
  }

  function updatePillUI() {
    /* Desktop */
    desktopPills.forEach(pill => {
      const isActive = pill.dataset.category === state.category;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', String(isActive));
    });

    /* Mobile */
    mobilePills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === state.category);
    });
  }

  /* ────────────────────────────────────────────
     APPLY FILTERS (search + category combined)
  ──────────────────────────────────────────── */
  function applyFilters() {
    let visible = 0;

    cards.forEach((card, idx) => {
      const name     = (card.dataset.name     || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const desc     = (card.dataset.desc     || '').toLowerCase();

      const matchesQuery    = !state.query || name.includes(state.query) || desc.includes(state.query) || category.includes(state.query);
      const matchesCategory = state.category === 'all' || card.dataset.category === state.category;

      const show = matchesQuery && matchesCategory;

      if (show) {
        card.classList.remove('hidden');
        card.style.animationDelay = `${visible * 0.06}s`;
        card.style.animationName  = 'none'; // reset
        /* Force reflow to restart animation */
        void card.offsetHeight;
        card.style.animationName  = 'cardEntrance';
        visible++;
      } else {
        card.classList.add('hidden');
      }
    });

    /* Empty state */
    if (emptyState) {
      emptyState.classList.toggle('visible', visible === 0);
    }

    /* Results count */
    if (resultsCount) {
      resultsCount.textContent = `Showing ${visible} of ${cards.length}`;
    }

    /* Re-init icons that might be in newly visible cards */
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /* ────────────────────────────────────────────
     MOBILE MENU
  ──────────────────────────────────────────── */
  function bindMobileMenu() {
    hamburger.addEventListener('click', () => {
      if (isMobileMenuOpen()) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileOverlay.addEventListener('click', closeMobileMenu);

    /* Trap focus inside panel */
    mobilePanel.addEventListener('keydown', trapFocus);
  }

  function openMobileMenu() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileOverlay.classList.add('open');
    mobileOverlay.setAttribute('aria-hidden', 'false');
    mobilePanel.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* Focus first button in panel */
    const firstBtn = mobilePanel.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }

  function closeMobileMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileOverlay.classList.remove('open');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    mobilePanel.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  function isMobileMenuOpen() {
    return mobilePanel.classList.contains('open');
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(mobilePanel.querySelectorAll('button, [tabindex]:not([tabindex="-1"])'));
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ────────────────────────────────────────────
     MISC
  ──────────────────────────────────────────── */
  function bindMisc() {
    /* Reset button in empty state */
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        clearSearch();
        setCategory('all');
      });
    }

    /* Animate stats counter on load */
    animateCounters();

    /* Parallax glow on card mouse-move */
    cards.forEach(card => {
      card.addEventListener('mousemove', handleCardMouseMove);
      card.addEventListener('mouseleave', handleCardMouseLeave);
    });
  }

  function handleCardMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = rect.width  / 2;
    const cy = rect.height / 2;

    const rotX = ((y - cy) / cy) * 4;   /* max ±4deg */
    const rotY = ((x - cx) / cx) * -4;

    card.style.transform = `translateY(-4px) scale(1.01) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    /* Move glow with cursor */
    const glow = card.querySelector('.card-glow');
    if (glow) {
      glow.style.left   = `${x - 90}px`;
      glow.style.top    = `${y - 90}px`;
      glow.style.right  = 'auto';
    }
  }

  function handleCardMouseLeave(e) {
    const card = e.currentTarget;
    card.style.transform = '';
    const glow = card.querySelector('.card-glow');
    if (glow) {
      glow.style.left  = '';
      glow.style.top   = '';
      glow.style.right = '-60px';
    }
  }

  /* Animated number counters */
  function animateCounters() {
    const statTotal  = document.getElementById('statTotal');
    const statOnline = document.getElementById('statOnline');

    if (statTotal)  animateNumber(statTotal,  0, 12, 800);
    if (statOnline) animateNumber(statOnline, 0, 10, 900);
  }

  function animateNumber(el, from, to, duration) {
    const start     = performance.now();
    const range     = to - from;

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      el.textContent = Math.round(from + range * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* ── Utility: debounce ──────────────────────── */
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

})();
