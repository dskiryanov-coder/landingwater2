const CRM_LOADER = 'https://crm-aquadom.ru/upload/crm/form/loader_3_jjh64m.js';
const dialog = document.querySelector('#crm-dialog');
const mount = document.querySelector('#crm-mount');
const status = document.querySelector('#crm-status');
const fallback = document.querySelector('#crm-fallback');
const title = document.querySelector('#crm-title');
let initialized = false;
let returnFocus = null;
let readinessObserver;
let timeout;
let formReady = false;
const observedFrames = new WeakSet();

function setFormState(state) {
  status.hidden = state !== 'loading';
  fallback.hidden = state !== 'error';
  mount.hidden = state === 'error';
  if (state === 'ready') formReady = true;
  if (state !== 'loading') clearTimeout(timeout);
}

function checkFormReady() {
  // The loader's script node is not a rendered form. Only reveal real form content.
  const rendered = mount.querySelector('form input:not([type="hidden"]), .b24-form-content input:not([type="hidden"]), .b24-form-content button, iframe');
  if (!rendered) return;
  if (rendered.tagName === 'IFRAME' && !rendered.dataset.aquadomLoaded) {
    if (observedFrames.has(rendered)) return;
    observedFrames.add(rendered);
    rendered.addEventListener('load', () => {
      if (!rendered.getAttribute('src') || rendered.getAttribute('src') === 'about:blank') return;
      rendered.dataset.aquadomLoaded = 'true';
      setFormState('ready');
      readinessObserver?.disconnect();
    }, { once: true });
    return;
  }
  setFormState('ready');
  readinessObserver?.disconnect();
}

function initializeForm() {
  if (initialized) return;
  initialized = true;
  setFormState('loading');
  readinessObserver = new MutationObserver(checkFormReady);
  readinessObserver.observe(mount, { childList: true, subtree: true });
  timeout = setTimeout(() => { if (!formReady) setFormState('error'); }, 15000);

  // Preserve the exact inline identity provided by the owner. The bootstrap node
  // stays inside the modal so Bitrix inserts the form in the intended location.
  const bootstrap = document.createElement('script');
  bootstrap.dataset.b24Form = 'inline/3/jjh64m';
  bootstrap.dataset.skipMoving = 'true';
  bootstrap.textContent = `(function(w,d,u){var s=d.createElement('script');s.async=true;s.src=u+'?'+(Date.now()/180000|0);s.onerror=function(){w.dispatchEvent(new Event('aquadom:crm-error'));};var h=d.getElementsByTagName('script')[0];h.parentNode.insertBefore(s,h);})(window,document,${JSON.stringify(CRM_LOADER)});`;
  mount.append(bootstrap);
}

window.addEventListener('aquadom:crm-error', () => { if (!formReady) setFormState('error'); });

function openForm(button) {
  returnFocus = button;
  const system = button.dataset.system;
  title.textContent = system || 'Подбор системы';
  // Context is displayed locally. It is deliberately not claimed to reach CRM.
  dialog.dataset.system = system || '';
  dialog.showModal();
  document.body.classList.add('modal-open');
  document.querySelector('.dialog-close').focus({ preventScroll: true });
  initializeForm();
  window.dispatchEvent(new CustomEvent('aquadom:form-open', { detail: { system: system || 'Подбор системы', source: button.dataset.source || '' } }));
}

document.querySelectorAll('[data-open-crm]').forEach(button => button.addEventListener('click', () => openForm(button)));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  returnFocus?.focus({ preventScroll: true });
});

const recommendations = {
  clarification: ['Начните с осветления воды. Окончательный подбор — по анализу.', 'Осветление воды'],
  iron: ['Посмотрите системы обезжелезивания. Состав воды уточнит решение.', 'Обезжелезивание'],
  softening: ['Посмотрите умягчители. Анализ покажет фактическую жёсткость воды.', 'Умягчение воды'],
  sorption: ['Посмотрите сорбционные фильтры. Причину запаха нужно уточнить по анализу.', 'Сорбционная очистка']
};
document.querySelectorAll('[data-problem]').forEach(button => button.addEventListener('click', () => {
  const wasSelected = button.getAttribute('aria-pressed') === 'true';
  document.querySelectorAll('[data-problem]').forEach(other => other.setAttribute('aria-pressed', 'false'));
  document.querySelectorAll('.system').forEach(system => system.classList.remove('is-selected'));
  const result = document.querySelector('#problem-result-text');
  const link = document.querySelector('#problem-result-link');
  if (wasSelected) {
    result.textContent = 'Выберите признак — покажем, с какого направления начать.';
    link.textContent = 'Посмотреть все системы ↓';
    link.href = '#systems';
    return;
  }
  const id = button.dataset.problem;
  button.setAttribute('aria-pressed', 'true');
  document.querySelector('#system-' + id).classList.add('is-selected');
  result.textContent = recommendations[id][0];
  link.textContent = recommendations[id][1] + ' ↓';
  link.href = '#system-' + id;
}));

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); }
menuButton.addEventListener('click', () => {
  const open = mobileNav.hidden;
  mobileNav.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
