import { auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from './firebase.js';

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}

export function currentUser() {
  return auth.currentUser;
}
