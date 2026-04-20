// Adatkép — minimal client-side script
// PWA service worker registration + chart download + footer year stamp

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Year stamp in footer
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
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

  // Mark pills with zero count as visually disabled
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

      // Show/hide empty-state messages for known empty categories
      document.querySelectorAll('.filter-empty').forEach((el) => {
        const targetFilter = el.dataset.emptyFor;
        el.hidden = !(filter === targetFilter && visibleCount === 0);
      });
    });
  });
}

// Lazy-load html2canvas only when needed (saves bandwidth on first page load)
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
