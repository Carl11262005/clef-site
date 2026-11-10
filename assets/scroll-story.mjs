const clamp = value => Math.max(0, Math.min(1, value));

// Native scroll remains the clock. The controller only maps its progress to
// composited transforms on the four scene surfaces.
export function initScrollStory(root, view) {
  if (!root?.querySelectorAll || !view?.matchMedia || !view?.requestAnimationFrame) return () => {};
  const stories = [...root.querySelectorAll('[data-scroll-story]')].map(story => ({
    story,
    scenes: [...story.querySelectorAll('[data-story-scene]')],
    active: false,
  })).filter(item => item.scenes.length > 1);
  if (!stories.length) return () => {};

  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = view.matchMedia('(min-width: 1100px) and (min-height: 680px)');
  const savedTabIndex = new WeakMap();
  let observer;
  let frame = 0;

  const clearScene = scene => {
    scene.style.transform = '';
    scene.style.opacity = '';
    scene.style.removeProperty('--story-dim');
    scene.style.willChange = '';
    scene.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(control => {
      if (!savedTabIndex.has(control)) return;
      const previous = savedTabIndex.get(control);
      previous === null ? control.removeAttribute('tabindex') : control.setAttribute('tabindex', previous);
      savedTabIndex.delete(control);
    });
  };
  const setInteractiveScene = (item, current) => item.scenes.forEach((scene, index) => {
    scene.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(control => {
      if (index === current) {
        if (!savedTabIndex.has(control)) return;
        const previous = savedTabIndex.get(control);
        previous === null ? control.removeAttribute('tabindex') : control.setAttribute('tabindex', previous);
        savedTabIndex.delete(control);
      } else {
        if (!savedTabIndex.has(control)) savedTabIndex.set(control, control.getAttribute('tabindex'));
        control.setAttribute('tabindex', '-1');
      }
    });
  });
  const reset = () => {
    for (const item of stories) {
      delete item.story.dataset.storyEnhanced;
      item.active = false;
      item.scenes.forEach(clearScene);
    }
  };
  const renderStory = item => {
    const headerHeight = root.querySelector?.('.site-header')?.offsetHeight || 0;
    const viewport = Math.max((view.innerHeight || 0) - headerHeight, 1);
    const rect = item.story.getBoundingClientRect();
    const distance = Math.max((item.story.offsetHeight || rect.bottom - rect.top) - viewport, 1);
    const progress = clamp((headerHeight - rect.top) / distance);
    const position = progress * (item.scenes.length - 1);
    setInteractiveScene(item, Math.round(position));

    item.scenes.forEach((scene, index) => {
      if (index === 0) {
        const covered = clamp(position);
        scene.style.transform = `translate3d(0, 0, 0) scale(${(1 - covered * .03).toFixed(5)})`;
        scene.style.setProperty('--story-dim', (covered * .10).toFixed(3));
        return;
      }
      const arrival = clamp(position - (index - 1));
      const covered = clamp(position - index);
      scene.style.transform = `translate3d(0, ${((1 - arrival) * 100).toFixed(3)}%, 0) scale(${(1 - covered * .03).toFixed(5)})`;
      scene.style.setProperty('--story-dim', (covered * .10).toFixed(3));
    });
  };
  const update = () => {
    frame = 0;
    if (reduced.matches || !desktop.matches) return;
    stories.filter(item => item.active).forEach(renderStory);
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(update) || 0;
  };
  const disconnect = () => {
    observer?.disconnect();
    observer = undefined;
    view.removeEventListener?.('scroll', schedule);
    view.removeEventListener?.('resize', schedule);
    if (frame) view.cancelAnimationFrame?.(frame);
    frame = 0;
  };
  const enable = () => {
    // Establish every layer before the browser paints the sticky stage. Waiting
    // for IntersectionObserver can briefly expose the last absolute panel.
    stories.forEach(item => { item.story.dataset.storyEnhanced = 'true'; renderStory(item); });
    if (view.IntersectionObserver) {
      observer = new view.IntersectionObserver(entries => {
        for (const entry of entries) {
          const item = stories.find(candidate => candidate.story === entry.target);
          if (!item) continue;
          item.active = entry.isIntersecting;
          item.scenes.forEach(scene => { scene.style.willChange = item.active ? 'transform' : ''; });
        }
        schedule();
      }, {rootMargin: '8% 0px'});
      stories.forEach(item => observer.observe(item.story));
    } else {
      stories.forEach(item => { item.active = true; item.scenes.forEach(scene => { scene.style.willChange = 'transform'; }); });
    }
    view.addEventListener('scroll', schedule, {passive: true});
    view.addEventListener('resize', schedule);
    schedule();
  };
  const sync = () => {
    disconnect();
    reset();
    if (!reduced.matches && desktop.matches) enable();
  };

  reduced.addEventListener?.('change', sync);
  desktop.addEventListener?.('change', sync);
  sync();
  return () => {
    reduced.removeEventListener?.('change', sync);
    desktop.removeEventListener?.('change', sync);
    disconnect();
    reset();
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initScrollStory(document, window);
