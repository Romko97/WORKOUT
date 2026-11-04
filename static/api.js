'use strict';

// The server is authoritative. Browser cache retains pending edits on connection loss.
window.formaSync = (() => {
  const cacheKey = 'forma.server.pending.v1';
  let revision = 0, pending = null, running = false, conflict = false;
  const status = (message, problem = false) => {
    const element = document.getElementById('saveStatus');
    if (element) { element.textContent = message; element.dataset.problem = String(problem); }
  };
  const cache = () => localStorage.setItem(cacheKey, JSON.stringify({ revision, state: pending }));

  async function flush() {
    if (running || conflict || !pending) return;
    running = true;
    try {
      while (pending) {
        const sent = pending;
        status('Зберігаємо…');
        const response = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ revision, state: sent })
        });
        if (response.status === 409) {
          conflict = true;
          throw Error('Дані змінено в іншій вкладці. Завантажте свою копію перед оновленням сторінки.');
        }
        if (!response.ok) throw Error('Сервер не зберіг зміни. Завантажте копію даних або повторіть спробу.');
        revision = (await response.json()).revision;
        if (pending === sent) pending = null;
        cache();
      }
      status('Збережено в базі на комп’ютері');
    } catch (error) {
      status(error.message || 'Немає зв’язку із сервером. Зміни очікують збереження.', true);
    } finally { running = false; }
  }

  async function load() {
    const response = await fetch('/api/state');
    if (!response.ok) throw Error('Не вдалося завантажити базу даних');
    const result = await response.json();
    revision = result.revision;
    const raw = localStorage.getItem(cacheKey);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved?.state) {
      pending = saved.state;
      if (saved.revision !== revision) {
        conflict = true;
        revision = saved.revision;
        status('Є незбережена копія та зміни на сервері. Завантажте свою копію перед оновленням.', true);
      } else { void flush(); }
      return pending || saved.state;
    }
    status('Збережено в базі на комп’ютері');
    return result.state;
  }

  function save(state) {
    pending = JSON.parse(JSON.stringify(state));
    cache();
    void flush();
  }

  window.addEventListener('online', () => void flush());
  window.addEventListener('beforeunload', event => {
    if (pending || running) { event.preventDefault(); event.returnValue = ''; }
  });
  return { load, save, retry: flush };
})();
