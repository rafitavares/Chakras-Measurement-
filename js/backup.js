// Backup completo (todos os clientes + visitas) para levar os dados deste
// navegador para outro aparelho, já que tudo fica salvo só localmente.
import { store } from './store.js';

function todayISO() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function exportAllBackup() {
  const db = store.loadDB();
  const payload = {
    tipo: 'backup-medicao-chakras',
    versao: 1,
    exportadoEm: new Date().toISOString(),
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
 * Lê um arquivo de backup e SUBSTITUI todos os dados salvos neste navegador.
 * @param {File} file
 */
export function importAllBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        reject(new Error('Arquivo inválido: não é um JSON de backup válido.'));
        return;
      }
      if (!parsed || !Array.isArray(parsed.clients)) {
        reject(new Error('Arquivo inválido: formato de backup não reconhecido.'));
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
