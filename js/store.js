// Local storage in the browser (localStorage). Everything stays only on
// this device/browser — it does not sync between devices by itself. Use
// Export/Import backup (js/backup.js) to move data to another device.
//
// Format saved under STORAGE_KEY:
// { clients: [ { id, name, ..., visits: [ { id, date, spins, diameters, notes, createdAt } ] } ] }

const STORAGE_KEY = 'chakras_db_v1';

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.clients)) return { clients: [] };
    return parsed;
  } catch {
    return { clients: [] };
  }
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function replaceDB(db) {
  if (!db || !Array.isArray(db.clients)) {
    throw new Error('Invalid backup format: expected an object with a "clients" list.');
  }
  saveDB(db);
}

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** true if the browser actually managed to write (private mode/full quota can fail silently). */
function isAvailable() {
  try {
    const testKey = '__chakras_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const store = { loadDB, saveDB, replaceDB, newId, isAvailable };
