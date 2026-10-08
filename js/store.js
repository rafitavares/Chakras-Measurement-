// Armazenamento local no navegador (localStorage). Tudo fica só neste
// aparelho/navegador — não sincroniza sozinho entre dispositivos. Use
// Exportar/Importar backup (js/backup.js) para levar os dados para outro
// aparelho.
//
// Formato salvo sob a chave STORAGE_KEY:
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
    throw new Error('Formato de backup inválido: esperado um objeto com a lista "clients".');
  }
  saveDB(db);
}

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** true se o navegador conseguiu de fato gravar (modo privado/quota cheia podem falhar silenciosamente). */
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
