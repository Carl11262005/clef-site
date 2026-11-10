// A small, manual screenshot selector. The unenhanced page shows every screen.
export function initAppShowcase(root) {
  const controls = root.querySelector('[data-showcase-controls]');
  const tabs = [...root.querySelectorAll('[data-showcase-tab]')];
  const panels = [...root.querySelectorAll('[data-showcase-panel]')];
  if (!controls || tabs.length < 2 || tabs.length !== panels.length) return;
  let current = 0;
  const select = (index, moveFocus = false) => {
    if (index < 0 || index >= tabs.length) return;
    current = index;
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (moveFocus) tabs[index].focus();
  };
  controls.setAttribute('role', 'tablist');
  controls.setAttribute('aria-orientation', 'vertical');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      const next = {ArrowDown:(current + 1) % tabs.length, ArrowRight:(current + 1) % tabs.length,
        ArrowUp:(current + tabs.length - 1) % tabs.length, ArrowLeft:(current + tabs.length - 1) % tabs.length,
        Home:0, End:tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  select(0);
  root.dataset.showcaseEnhanced = 'true';
  controls.hidden = false;
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-app-showcase]').forEach(initAppShowcase);
