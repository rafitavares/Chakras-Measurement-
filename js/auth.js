// Admin check used to unlock locked readings.
//
// IMPORTANT: this is protection against ACCIDENTAL changes, not real security.
// The app runs entirely in the browser, so anyone with access to the device
// and some technical knowledge could bypass it. Only a SHA-256 hash of
// "login:password" is kept here, so the password is not readable in the code.
// To change the password, compute the SHA-256 of "admin:NEWPASSWORD" and
// replace ADMIN_HASH.
const ADMIN_HASH = 'a843cad9e2bff1728b57752bc66c68c21d1b65c56d0bf3c319ebb50c5bb4e524';

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAdminCredentials(login, password) {
  const user = String(login || '').trim().toLowerCase();
  return (await sha256Hex(`${user}:${password || ''}`)) === ADMIN_HASH;
}

/**
 * Opens the login dialog (in index.html) and resolves true only when the
 * correct login + password were entered; false if cancelled.
 */
export function requestAdminUnlock(message = 'Enter the administrator login to unlock.') {
  const dialog = document.getElementById('dialog-unlock');
  const form = document.getElementById('form-unlock');
  const loginInput = document.getElementById('unlock-login');
  const passInput = document.getElementById('unlock-password');
  const errorEl = document.getElementById('unlock-error');
  const cancelBtn = document.getElementById('btn-unlock-cancel');
  document.getElementById('unlock-message').textContent = message;

  loginInput.value = '';
  passInput.value = '';
  errorEl.hidden = true;

  return new Promise((resolve) => {
    const cleanup = (result) => {
      form.removeEventListener('submit', onSubmit);
      cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      resolve(result);
    };
    const onSubmit = async (e) => {
      e.preventDefault();
      if (await checkAdminCredentials(loginInput.value, passInput.value)) {
        cleanup(true);
      } else {
        errorEl.hidden = false;
        passInput.value = '';
        passInput.focus();
      }
    };
    const onCancel = (e) => { e?.preventDefault?.(); cleanup(false); };
    form.addEventListener('submit', onSubmit);
    cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
    loginInput.focus();
  });
}
