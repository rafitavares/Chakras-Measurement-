// Inicializa o Firebase (App, Auth, Firestore) usando os módulos ESM
// servidos direto pelo CDN da Google — sem npm, sem bundler, funciona em
// qualquer host estático (GitHub Pages incluso).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  initializeFirestore,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// long polling automático evita problemas de conexão em redes móveis/proxies
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
// Cache offline: permite visualizar clientes/histórico já carregados sem internet.
// Falha silenciosamente com múltiplas abas abertas ou navegadores sem suporte.
enableIndexedDbPersistence(db).catch(() => {});

export { onAuthStateChanged, signInWithEmailAndPassword, signOut };
