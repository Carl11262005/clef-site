// Native details navigation stays usable without JavaScript.
export function initMenu(menu) {
  const trigger = menu.querySelector('summary');
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) menu.open = false;
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      event.preventDefault();
      trigger.focus();
    }
  });
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-menu]').forEach(initMenu);
