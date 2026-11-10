// Optional polish only: content and ordinary links never depend on motion.
export function initSectionMotion(root, view) {
  if (!view?.IntersectionObserver || !view.matchMedia) return;
  const targets = [...root.querySelectorAll('[data-section-motion]')];
  if (!targets.length) return;
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new Set();
  let observer;
  const key = target => `clef:section-motion:${view.location.pathname}:${target.dataset.sectionMotion}`;
  const remember = target => {
    seen.add(target);
    try { view.sessionStorage.setItem(key(target), '1'); } catch { /* Storage is optional. */ }
  };
  for (const target of targets) {
    let remembered = false;
    try { remembered = view.sessionStorage.getItem(key(target)) === '1'; } catch { /* Private browsing remains usable. */ }
    const bounds = target.getBoundingClientRect();
    if (remembered || (bounds.top < view.innerHeight && bounds.bottom > 0)) remember(target);
  }
  const observe = () => {
    if (preference.matches) return;
    observer = new view.IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting || seen.has(target) || preference.matches) continue;
        remember(target);
        observer.unobserve(target);
        target.classList.add('section-arrive');
        target.addEventListener('animationend', () => target.classList.remove('section-arrive'), {once: true});
      }
    }, {threshold: .12, rootMargin: '0px 0px -6% 0px'});
    targets.filter(target => !seen.has(target)).forEach(target => observer.observe(target));
  };
  preference.addEventListener?.('change', () => {
    observer?.disconnect();
    targets.forEach(target => target.classList.remove('section-arrive'));
    observe();
  });
  root.addEventListener('focusin', event => {
    const target = event.target.closest?.('[data-section-motion]');
    if (!targets.includes(target)) return;
    remember(target);
    observer?.unobserve(target);
    target.classList.remove('section-arrive');
  });
  observe();
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initSectionMotion(document, window);
