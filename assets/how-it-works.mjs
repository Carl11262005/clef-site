// Native details remain usable without JavaScript. Enhance with one focused
// explanation and matching photography, without timers or automatic advancing.
export function initHowItWorks(root) {
  const steps = [...root.querySelectorAll('details')];
  const frames = [...root.querySelectorAll('[data-scene]')];
  const markers = [...root.querySelectorAll('[data-how-select]')];
  const controls = root.querySelector('[data-how-controls]');
  const previous = root.querySelector('[data-how-previous]');
  const next = root.querySelector('[data-how-next]');
  const count = root.querySelector('[data-how-count]');
  const status = root.querySelector('[data-how-status]');
  let current = Math.max(0, steps.findIndex(step => step.open));
  function select(index, announce = true) {
    const changed = current !== index;
    current = index;
    for (const [i, step] of steps.entries()) step.open = i === index;
    for (const frame of frames) frame.hidden = frame.dataset.scene !== steps[index].dataset.step;
    for (const marker of markers) {
      if (Number(marker.dataset.howSelect) === index) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    }
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    next.textContent = index === steps.length - 1 ? 'Restart' : 'Next Step';
    if (announce && changed) status.textContent = `Step ${index + 1} of ${steps.length}: ${steps[index].querySelector('h3').textContent}`;
  }
  for (const [index, step] of steps.entries()) {
    step.addEventListener('toggle', () => {
      if (!step.open) return;
      select(index);
    });
  }
  previous.addEventListener('click', () => select((current + steps.length - 1) % steps.length));
  next.addEventListener('click', () => select((current + 1) % steps.length));
  for (const marker of markers) marker.addEventListener('click', () => select(Number(marker.dataset.howSelect)));
  select(current, false);
  controls.hidden = false;
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-how-it-works]').forEach(initHowItWorks);
