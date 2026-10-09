// Client CRUD, stored locally via js/store.js.
import { store } from './store.js';

export function listClients() {
  const db = store.loadDB();
  return [...db.clients].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export function getClient(clientId) {
  const db = store.loadDB();
  return db.clients.find((c) => c.id === clientId) || null;
}

/**
 * Creates a client.
 * @param {{name:string, birthdate?:string, sex?:string, email?:string, phone?:string, complaint?:string}} data
 * @returns {string} id of the new client
 */
export function createClient(data) {
  const db = store.loadDB();
  const now = new Date().toISOString();
  const client = {
    id: store.newId(),
    name: data.name.trim(),
    birthdate: data.birthdate || null,
    sex: data.sex || null,
    email: data.email || null,
    phone: data.phone || null,
    complaint: data.complaint || null,
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
  client.sex = data.sex || null;
  client.email = data.email || null;
  client.phone = data.phone || null;
  client.complaint = data.complaint || null;
  client.updatedAt = new Date().toISOString();
  store.saveDB(db);
}

/** Deletes the client and all of their visits (nested in the same record). */
export function deleteClient(clientId) {
  const db = store.loadDB();
  db.clients = db.clients.filter((c) => c.id !== clientId);
  store.saveDB(db);
}

/** Updates the denormalized fields used in the client list. */
export function updateClientStats(clientId, { lastVisitDate, visitCount }) {
  const db = store.loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;
  client.lastVisitDate = lastVisitDate || null;
  client.visitCount = visitCount || 0;
  store.saveDB(db);
}
