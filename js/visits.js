// Visit CRUD, stored locally via js/store.js (nested inside the client).
import { store } from './store.js';
import { CHAKRA_ORDER } from './calculations.js';

function findClient(db, clientId) {
  return db.clients.find((c) => c.id === clientId);
}

/** Lists the client's visits, oldest to newest. */
export function listVisits(clientId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return [];
  return [...client.visits].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function getVisit(clientId, visitId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  return client?.visits.find((v) => v.id === visitId) || null;
}

/**
 * Creates a visit.
 * @param {{date:string, spins:Object<string,string>, diameters?:Object<string,number>, notes?:string}} data
 * @returns {string|null} id of the new visit, or null if the client doesn't exist
 */
export function createVisit(clientId, data) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return null;
  const visit = {
    id: store.newId(),
    ...sanitizeVisitPayload(data),
    createdAt: new Date().toISOString(),
  };
  client.visits.push(visit);
  store.saveDB(db);
  return visit.id;
}

export function updateVisit(clientId, visitId, data) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  const visit = client?.visits.find((v) => v.id === visitId);
  if (!visit) return;
  Object.assign(visit, sanitizeVisitPayload(data));
  store.saveDB(db);
}

export function deleteVisit(clientId, visitId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return;
  client.visits = client.visits.filter((v) => v.id !== visitId);
  store.saveDB(db);
}

function sanitizeVisitPayload(data) {
  const spins = {};
  for (const ch of CHAKRA_ORDER) {
    if (data.spins[ch]) spins[ch] = data.spins[ch];
  }
  const diameters = {};
  if (data.diameters) {
    for (const ch of CHAKRA_ORDER) {
      const v = data.diameters[ch];
      if (v !== undefined && v !== null && v !== '') diameters[ch] = Number(v);
    }
  }
  return {
    date: data.date,
    spins,
    diameters,
    notes: data.notes || null,
  };
}
