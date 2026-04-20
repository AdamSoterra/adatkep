// Adatkép — minimal client-side script
// PWA service worker registration + install flow + chart download + footer year stamp

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

// --- PWA install handling ------------------------------------------------
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.body.classList.add('pwa-installable');
});

window.addEventListener('appinstalled', () => {
  document.body.classList.add('pwa-installed');
  deferredPrompt = null;
});

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isAndroid = /Android/.test(navigator.userAgent);
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

if (isStandalone) document.body.classList.add('pwa-installed');
if (isIOS) document.body.classList.add('is-ios');
if (isAndroid) document.body.classList.add('is-android');

document.addEventListener('DOMContentLoaded', () => {
  // Year stamp in footer
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
  });

  // Install triggers
  document.querySelectorAll('[data-install-trigger]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
        } catch (err) {
          console.warn('Install prompt failed:', err);
        } finally {
          deferredPrompt = null;
        }
        return;
      }
      openInstallModal();
    });
  });

  // Category filters (osszes.html)
  initCategoryFilters();

  // Chart download buttons
  document.querySelectorAll('[data-download-chart]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const chartEl = btn.closest('.chart-wrap')?.querySelector('.chart')
        || btn.closest('.chart');
      if (!chartEl) return;
      const filename = btn.dataset.downloadChart || 'adatkep-chart.png';
      btn.disabled = true;
      btn.dataset.label = btn.textContent;
      btn.textContent = 'Készül…';
      try {
        await ensureHtml2Canvas();
        const canvas = await window.html2canvas(chartEl, {
          backgroundColor: getComputedStyle(chartEl).backgroundColor || '#FFFFFF',
          scale: 2,
          useCORS: true,
          logging: false
        });
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Download failed:', err);
        alert('Letöltés sikertelen. Próbáld újra.');
      } finally {
        btn.disabled = false;
        btn.textContent = btn.dataset.label || 'Letöltés képként';
      }
    });
  });
});

function initCategoryFilters() {
  const pills = document.querySelectorAll('.filter-pill');
  if (!pills.length) return;

  pills.forEach((pill) => {
    const countEl = pill.querySelector('.filter-count');
    if (countEl && parseInt(countEl.textContent, 10) === 0 && pill.dataset.filter !== 'all') {
      pill.dataset.empty = 'true';
    }
  });

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const cards = document.querySelectorAll('.filterable .post-card');
      let visibleCount = 0;
      cards.forEach((card) => {
        const cat = card.dataset.category;
        const show = filter === 'all' || cat === filter;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      document.querySelectorAll('.filter-empty').forEach((el) => {
        const targetFilter = el.dataset.emptyFor;
        el.hidden = !(filter === targetFilter && visibleCount === 0);
      });
    });
  });
}

// Install instructions modal (injected once, reused)
function openInstallModal() {
  let modal = document.getElementById('install-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.className = 'install-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="install-modal__backdrop" data-install-close></div>
      <div class="install-modal__card" role="document">
        <button class="install-modal__close" data-install-close aria-label="Bezárás">×</button>
        <div class="install-modal__brand">
          <span class="wordmark wordmark--sm">adat<span class="accent">kép</span></span>
        </div>
        <h3>Telepítsd az Adatképet</h3>
        <p class="install-modal__lede">Egy koppintás — és az ikon megjelenik a kezdőképernyődön, mint egy natív app.</p>

        <div class="install-modal__platform" data-platform="ios">
          <div class="install-modal__step"><span class="install-modal__num">1</span><span>Koppints a Safari alján a <strong>Megosztás</strong> gombra (□ ↑ ikon).</span></div>
          <div class="install-modal__step"><span class="install-modal__num">2</span><span>Görgess le, és válaszd: <strong>Hozzáadás a főképernyőhöz</strong>.</span></div>
          <div class="install-modal__step"><span class="install-modal__num">3</span><span>Koppints a <strong>Hozzáadás</strong> gombra jobbra fent — kész.</span></div>
          <div class="install-modal__foot">Tipp · iOS-en ez csak Safari-ból működik, Chrome/Firefox alól nem.</div>
        </div>

        <div class="install-modal__platform" data-platform="android">
          <div class="install-modal__step"><span class="install-modal__num">1</span><span>Nyisd meg a Chrome menüjét — három pont (⋮) jobbra fent.</span></div>
          <div class="install-modal__step"><span class="install-modal__num">2</span><span>Válaszd: <strong>Alkalmazás telepítése</strong> vagy <strong>Hozzáadás a kezdőképernyőhöz</strong>.</span></div>
          <div class="install-modal__step"><span class="install-modal__num">3</span><span>Erősítsd meg — az ikon megjelenik a kezdőképernyőn.</span></div>
          <div class="install-modal__foot">Ha nem látod az opciót, frissítsd az oldalt vagy próbáld inkognitó módban.</div>
        </div>

        <div class="install-modal__platform" data-platform="desktop">
          <div class="install-modal__step"><span class="install-modal__num">1</span><span>Nézd meg a böngésző címsorát — jobbra egy kis <strong>Telepítés</strong> ikon (monitor + ↓).</span></div>
          <div class="install-modal__step"><span class="install-modal__num">2</span><span>Vagy: Chrome menü (⋮) → <strong>Adatkép telepítése</strong>.</span></div>
          <div class="install-modal__step"><span class="install-modal__num">3</span><span>Külön ablakban nyílik meg, külön app-ikonnal.</span></div>
          <div class="install-modal__foot">Működik Chrome-ban, Edge-ben, Brave-ban. Firefox-ban egyelőre nem.</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-install-close]').forEach((el) =>
      el.addEventListener('click', () => modal.classList.remove('open'))
    );
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') modal.classList.remove('open');
    });
  }

  const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  modal.querySelectorAll('.install-modal__platform').forEach((el) => {
    el.hidden = el.dataset.platform !== platform;
  });
  modal.classList.add('open');
}

function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
