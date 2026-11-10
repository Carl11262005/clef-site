// Subtle scroll-linked depth for selected photography. Text and controls stay fixed.
export function initParallax(root, view) {
  if (!root?.querySelectorAll || !view?.matchMedia || !view.requestAnimationFrame) return () => {};
  const containers = [...root.querySelectorAll('[data-parallax]')];
  const groups = containers.map(container => ({
    container,
    strength: container.dataset.parallax === 'hero' ? 3 : 4,
    scale: container.dataset.parallax === 'hero' ? 1.06 : 1.1,
    nodes: [...container.querySelectorAll('img, video')]
  })).filter(group => group.nodes.length);
  if (!groups.length) return () => {};

  // Let compact desktop preview panes keep the effect while leaving touch-first
  // phones and tablets still. The scroll-linked movement is designed for a
  // precise pointer, not inferred from viewport width alone.
  const preference = view.matchMedia('(min-width: 480px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const active = new Set();
  let observer;
  let frame = 0;

  const resetGroup = group => {
    for (const node of group.nodes) {
      node.style.removeProperty('translate');
      node.style.removeProperty('scale');
      node.style.removeProperty('will-change');
    }
  };
  const setActive = (group, enabled) => {
    if (enabled) {
      active.add(group);
      for (const node of group.nodes) node.style.willChange = 'transform';
    } else {
      active.delete(group);
      for (const node of group.nodes) node.style.removeProperty('will-change');
    }
  };
  const update = () => {
    frame = 0;
    if (!preference.matches) return;
    const viewport = Math.max(view.innerHeight || 0, 1);
    for (const group of active) {
      const rect = group.container.getBoundingClientRect();
      const travel = Math.max((viewport + rect.height) / 2, 1);
      const progress = Math.max(-1, Math.min(1, (viewport / 2 - (rect.top + rect.height / 2)) / travel));
      const offset = (progress * group.strength).toFixed(3);
      for (const node of group.nodes) {
        node.style.translate = `0 ${offset}%`;
        node.style.scale = String(group.scale);
      }
    }
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(update);
  };
  const disable = () => {
    observer?.disconnect();
    observer = undefined;
    view.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', schedule);
    if (frame) view.cancelAnimationFrame?.(frame);
    frame = 0;
    active.clear();
    groups.forEach(resetGroup);
  };
  const enable = () => {
    const viewport = Math.max(view.innerHeight || 0, 1);
    for (const group of groups) {
      const rect = group.container.getBoundingClientRect();
      setActive(group, rect.bottom > 0 && rect.top < viewport);
    }
    if (view.IntersectionObserver) {
      observer = new view.IntersectionObserver(entries => {
        for (const entry of entries) {
          const group = groups.find(candidate => candidate.container === entry.target);
          if (group) setActive(group, entry.isIntersecting);
        }
        schedule();
      }, {rootMargin: '12% 0px'});
      groups.forEach(group => observer.observe(group.container));
    } else {
      groups.forEach(group => setActive(group, true));
    }
    view.addEventListener('scroll', schedule, {passive: true});
    view.addEventListener('resize', schedule);
    schedule();
  };
  const sync = () => {
    disable();
    if (preference.matches) enable();
  };
  preference.addEventListener?.('change', sync);
  sync();

  return () => {
    preference.removeEventListener?.('change', sync);
    disable();
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initParallax(document, window);
