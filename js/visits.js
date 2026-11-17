// Visit CRUD, stored locally via js/store.js (nested inside the client).
//
// Data compatibility: readings saved by older versions of the app have no
// `phase`, `savedAt` or `locked` fields. All three are optional and every
// reader below treats a missing value as "not set" / "unlocked", so no
// migration is needed and nothing already saved is ever rewritten.
import { store } from './store.js';
import { CHAKRA_ORDER } from './calculations.js';

export const PHASES = ['before', 'after'];
const PHASE_ORDER = { before: 0, undefined: 1, null: 1, after: 2 };

function findClient(db, clientId) {
  return db.clients.find((c) => c.id === clientId);
}

function compareVisits(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const pa = PHASE_ORDER[a.phase] ?? 1;
  const pb = PHASE_ORDER[b.phase] ?? 1;
  if (pa !== pb) return pa - pb;
  const ta = a.savedAt || a.createdAt || '';
  const tb = b.savedAt || b.createdAt || '';
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}

/** Lists the client's visits, oldest to newest (same day: before → after). */
export function listVisits(clientId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return [];
  return [...client.visits].sort(compareVisits);
}

export function getVisit(clientId, visitId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  return client?.visits.find((v) => v.id === visitId) || null;
}

/**
 * Creates a visit.
 * @param {{date:string, phase?:'before'|'after', spins:Object<string,string>, diameters?:Object<string,number>, notes?:string}} data
 * @returns {string|null} id of the new visit, or null if the client doesn't exist
 */
export function createVisit(clientId, data) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return null;
  const now = new Date().toISOString();
  const visit = {
    id: store.newId(),
    ...sanitizeVisitPayload(data),
    createdAt: now,
    savedAt: now,
    locked: !!data.locked,
  };
  client.visits.push(visit);
  store.saveDB(db);
  return visit.id;
}

/** Updates a visit. Locked visits are never modified (returns false). */
export function updateVisit(clientId, visitId, data) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  const visit = client?.visits.find((v) => v.id === visitId);
  if (!visit || visit.locked) return false;
  Object.assign(visit, sanitizeVisitPayload(data), { savedAt: new Date().toISOString() });
  store.saveDB(db);
  return true;
}

/** Locks or unlocks a visit (only the flag changes; the reading itself is untouched). */
export function setVisitLocked(clientId, visitId, locked) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  const visit = client?.visits.find((v) => v.id === visitId);
  if (!visit) return;
  visit.locked = !!locked;
  store.saveDB(db);
}

/** Deletes a visit. Locked visits are never deleted (returns false). */
export function deleteVisit(clientId, visitId) {
  const db = store.loadDB();
  const client = findClient(db, clientId);
  if (!client) return false;
  const visit = client.visits.find((v) => v.id === visitId);
  if (visit?.locked) return false;
  client.visits = client.visits.filter((v) => v.id !== visitId);
  store.saveDB(db);
  return true;
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
    phase: PHASES.includes(data.phase) ? data.phase : null,
    spins,
    diameters,
    notes: data.notes || null,
  };
}
