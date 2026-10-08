// CRUD de clientes, guardado localmente via js/store.js.
import { store } from './store.js';

export function listClients() {
  const db = store.loadDB();
  return [...db.clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function getClient(clientId) {
  const db = store.loadDB();
  return db.clients.find((c) => c.id === clientId) || null;
}

/**
 * Cria um cliente.
 * @param {{name:string, birthdate?:string, complaint?:string, contact?:string}} data
 * @returns {string} id do novo cliente
 */
export function createClient(data) {
  const db = store.loadDB();
  const now = new Date().toISOString();
  const client = {
    id: store.newId(),
    name: data.name.trim(),
    birthdate: data.birthdate || null,
    complaint: data.complaint || null,
    contact: data.contact || null,
    lastVisitDate: null,
    visitCount: 0,
    createdAt: now,
    updatedAt: now,
    visits: [],
  };
  db.clients.push(client);
  store.saveDB(db);
  return client.id;
}

export function updateClient(clientId, data) {
  const db = store.loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;
  client.name = data.name.trim();
  client.birthdate = data.birthdate || null;
  client.complaint = data.complaint || null;
  client.contact = data.contact || null;
  client.updatedAt = new Date().toISOString();
  store.saveDB(db);
}

/** Exclui o cliente e todas as visitas dele (que ficam aninhadas no mesmo registro). */
export function deleteClient(clientId) {
  const db = store.loadDB();
  db.clients = db.clients.filter((c) => c.id !== clientId);
  store.saveDB(db);
}

/** Atualiza os campos denormalizados usados na lista de clientes. */
export function updateClientStats(clientId, { lastVisitDate, visitCount }) {
  const db = store.loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;
  client.lastVisitDate = lastVisitDate || null;
  client.visitCount = visitCount || 0;
  store.saveDB(db);
}
