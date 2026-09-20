// CRUD de visitas: users/{uid}/clients/{clientId}/visits/{visitId}
import { db } from './firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { CHAKRA_ORDER } from './calculations.js';

function visitsCol(uid, clientId) {
  return collection(db, 'users', uid, 'clients', clientId, 'visits');
}

function visitDoc(uid, clientId, visitId) {
  return doc(db, 'users', uid, 'clients', clientId, 'visits', visitId);
}

/** Lista as visitas do cliente, da mais antiga para a mais recente. */
export async function listVisits(uid, clientId) {
  const q = query(visitsCol(uid, clientId), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getVisit(uid, clientId, visitId) {
  const snap = await getDoc(visitDoc(uid, clientId, visitId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Cria uma visita.
 * @param {{date:string, spins:Object<string,string>, diameters?:Object<string,number>, notes?:string}} data
 */
export async function createVisit(uid, clientId, data) {
  const payload = sanitizeVisitPayload(data);
  payload.createdAt = serverTimestamp();
  const ref = await addDoc(visitsCol(uid, clientId), payload);
  return ref.id;
}

export async function updateVisit(uid, clientId, visitId, data) {
  const payload = sanitizeVisitPayload(data);
  await updateDoc(visitDoc(uid, clientId, visitId), payload);
}

export async function deleteVisit(uid, clientId, visitId) {
  await deleteDoc(visitDoc(uid, clientId, visitId));
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
