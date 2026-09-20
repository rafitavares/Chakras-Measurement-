// CRUD de clientes: users/{uid}/clients/{clientId}
import { db } from './firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

function clientsCol(uid) {
  return collection(db, 'users', uid, 'clients');
}

function clientDoc(uid, clientId) {
  return doc(db, 'users', uid, 'clients', clientId);
}

function visitsCol(uid, clientId) {
  return collection(db, 'users', uid, 'clients', clientId, 'visits');
}

/** Lista todos os clientes do usuário, ordenados por nome. */
export async function listClients(uid) {
  const q = query(clientsCol(uid), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getClient(uid, clientId) {
  const snap = await getDoc(clientDoc(uid, clientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Cria um cliente.
 * @param {string} uid
 * @param {{name:string, birthdate?:string, complaint?:string, contact?:string}} data
 */
export async function createClient(uid, data) {
  const payload = {
    name: data.name.trim(),
    birthdate: data.birthdate || null,
    complaint: data.complaint || null,
    contact: data.contact || null,
    lastVisitDate: null,
    visitCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(clientsCol(uid), payload);
  return ref.id;
}

/** Atualiza os campos denormalizados usados na lista de clientes (evita reler as visitas toda vez). */
export async function updateClientStats(uid, clientId, { lastVisitDate, visitCount }) {
  await updateDoc(clientDoc(uid, clientId), { lastVisitDate: lastVisitDate || null, visitCount: visitCount || 0 });
}

export async function updateClient(uid, clientId, data) {
  await updateDoc(clientDoc(uid, clientId), {
    name: data.name.trim(),
    birthdate: data.birthdate || null,
    complaint: data.complaint || null,
    contact: data.contact || null,
    updatedAt: serverTimestamp(),
  });
}

/** Exclui o cliente e todas as visitas dele (subcoleção não é apagada automaticamente). */
export async function deleteClient(uid, clientId) {
  const visitsSnap = await getDocs(visitsCol(uid, clientId));
  const batch = writeBatch(db);
  visitsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(clientDoc(uid, clientId));
  await batch.commit();
}
