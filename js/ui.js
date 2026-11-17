// Small dependency-free UI helpers: toasts and confirmation.

let toastTimer = null;

export function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast toast--${type} toast--visible`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('toast--visible');
  }, 3200);
}

/** Simple confirmation via the browser's native modal (light, no dependencies). */
export function confirmAction(message) {
  return window.confirm(message);
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** ISO timestamp → "dd/mm/yyyy hh:mm" in the device's local time. */
export function formatDateTime(isoTimestamp) {
  if (!isoTimestamp) return '—';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatNumber(n, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(decimals);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== undefined && value !== null) {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}
