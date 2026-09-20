// ============================================================================
// CONFIGURAÇÃO DO FIREBASE — EDITE APENAS ESTE ARQUIVO
// ============================================================================
// Cole aqui embaixo o objeto `firebaseConfig` que o Firebase te dá quando você
// cria o app web no console (veja o passo a passo no README.md, seção
// "3. Pegar o firebaseConfig e colar no app").
//
// Esses valores (apiKey, authDomain, etc.) NÃO são segredos. É seguro que
// fiquem visíveis no código de um site estático — é assim que o Firebase
// funciona por design. Quem protege seus dados de verdade são as
// Firestore Security Rules (arquivo firestore.rules) + o login obrigatório
// (Firebase Authentication), não o sigilo dessas chaves.
// ============================================================================

export const firebaseConfig = {
  apiKey: 'COLE_AQUI_SUA_API_KEY',
  authDomain: 'SEU-PROJETO.firebaseapp.com',
  projectId: 'SEU-PROJETO',
  storageBucket: 'SEU-PROJETO.appspot.com',
  messagingSenderId: 'COLE_AQUI',
  appId: 'COLE_AQUI',
};
