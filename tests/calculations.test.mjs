// Teste de sanidade dos cálculos do método.
// Rode com: node tests/calculations.test.mjs
// (Isso é só uma checagem manual para desenvolvedores; o app publicado
// não depende do Node em nenhum momento.)

import { computeVisitTotals } from '../js/calculations.js';

let failures = 0;

function assertClose(actual, expected, label) {
  const ok = Math.abs(actual - expected) < 1e-9;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}: esperado ${expected}, obtido ${actual}`);
  if (!ok) failures++;
}

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}: esperado ${expected}, obtido ${actual}`);
  if (!ok) failures++;
}

// Exemplo confirmado na planilha original (Treatments_Blanco_.numbers):
// 7=C, 6A=CCEL, 6B=CCEAS, 5A=C, 4A=C, 3A=C, 2A=CER,
// 5B=CEAS, 4B=C, 3B=CEL, 2B=C, 1=CC
// Esperado: REASON=0.0, EMOTION=3.5, WILL=2.0, NEI=5.5, TNDC=6
const spinsExample = {
  '7': 'C',
  '6A': 'CCEL',
  '6B': 'CCEAS',
  '5A': 'C',
  '4A': 'C',
  '3A': 'C',
  '2A': 'CER',
  '5B': 'CEAS',
  '4B': 'C',
  '3B': 'CEL',
  '2B': 'C',
  '1': 'CC',
};

const result = computeVisitTotals(spinsExample);

console.log('\n== Teste 1: exemplo da planilha original ==');
assertClose(result.totals.REASON, 0.0, 'Total REASON');
assertClose(result.totals.EMOTION, 3.5, 'Total EMOTION');
assertClose(result.totals.WILL, 2.0, 'Total WILL');
assertClose(result.nei, 5.5, 'NEI');
assertEqual(result.tndc, 6, 'TNDC');
assertEqual(result.complete, true, 'Visita completa (12 chakras preenchidos)');
console.log('Domínio dominante:', result.dominant, '| secundário:', result.secondary);

console.log('\n== Teste 2: todos horário circular perfeito (C) ==');
const allC = {};
for (const ch of ['7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1']) allC[ch] = 'C';
const r2 = computeVisitTotals(allC);
assertClose(r2.totals.REASON, 3.0, 'Total REASON (3 chakras a +1)');
assertClose(r2.totals.EMOTION, 4.0, 'Total EMOTION (4 chakras a +1)');
assertClose(r2.totals.WILL, 5.0, 'Total WILL (5 chakras a +1)');
assertClose(r2.nei, 12.0, 'NEI máximo (+12)');
assertEqual(r2.tndc, 0, 'TNDC (nenhum distorcido)');

console.log('\n== Teste 3: todos parados (S) — pior caso ==');
const allS = {};
for (const ch of ['7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1']) allS[ch] = 'S';
const r3 = computeVisitTotals(allS);
assertClose(r3.nei, -24.0, 'NEI (12 chakras a -2)');
assertEqual(r3.tndc, 12, 'TNDC (todos distorcidos)');

console.log('\n== Teste 4: visita incompleta ==');
const partial = { '7': 'C' };
const r4 = computeVisitTotals(partial);
assertEqual(r4.complete, false, 'Visita incompleta detectada');
assertEqual(r4.tndc, 0, 'TNDC não conta chakras ainda não preenchidos');

console.log(`\n${failures === 0 ? 'TODOS OS TESTES PASSARAM ✅' : failures + ' TESTE(S) FALHARAM ❌'}`);
process.exit(failures === 0 ? 0 : 1);
