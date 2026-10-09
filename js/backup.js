// Full backup (all clients + visits) to move this browser's data to another
// device, since everything is saved only locally.
import { store } from './store.js';

function todayISO() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function exportAllBackup() {
  const db = store.loadDB();
  const payload = {
    type: 'chakra-measurement-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    clients: db.clients,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chakras_backup_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reads a backup file and REPLACES all data saved in this browser.
 * @param {File} file
 */
export function importAllBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        reject(new Error('Invalid file: not a valid backup JSON.'));
        return;
      }
      if (!parsed || !Array.isArray(parsed.clients)) {
        reject(new Error('Invalid file: unrecognized backup format.'));
        return;
      }
      try {
        store.replaceDB({ clients: parsed.clients });
        resolve(parsed.clients.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
