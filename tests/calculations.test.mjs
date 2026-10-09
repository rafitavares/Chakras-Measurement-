// Sanity check for the method's calculations.
// Run with: node tests/calculations.test.mjs
// (This is just a manual check for developers; the published app never
// depends on Node at any point.)

import { computeVisitTotals } from '../js/calculations.js';

let failures = 0;

function assertClose(actual, expected, label) {
  const ok = Math.abs(actual - expected) < 1e-9;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}: expected ${expected}, got ${actual}`);
  if (!ok) failures++;
}

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}: expected ${expected}, got ${actual}`);
  if (!ok) failures++;
}

// Example confirmed in the original spreadsheet (Treatments_Blanco_.numbers):
// 7=C, 6A=CCEL, 6B=CCEAS, 5A=C, 4A=C, 3A=C, 2A=CER,
// 5B=CEAS, 4B=C, 3B=CEL, 2B=C, 1=CC
// Expected: REASON=0.0, EMOTION=3.5, WILL=2.0, NEI=5.5, TNDC=6
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

console.log('\n== Test 1: original spreadsheet example ==');
assertClose(result.totals.REASON, 0.0, 'REASON total');
assertClose(result.totals.EMOTION, 3.5, 'EMOTION total');
assertClose(result.totals.WILL, 2.0, 'WILL total');
assertClose(result.nei, 5.5, 'NEI');
assertEqual(result.tndc, 6, 'TNDC');
assertEqual(result.complete, true, 'Visit complete (12 chakras filled in)');
console.log('Dominant domain:', result.dominant, '| secondary:', result.secondary);

console.log('\n== Test 2: all perfect clockwise round (C) ==');
const allC = {};
for (const ch of ['7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1']) allC[ch] = 'C';
const r2 = computeVisitTotals(allC);
assertClose(r2.totals.REASON, 3.0, 'REASON total (3 chakras at +1)');
assertClose(r2.totals.EMOTION, 4.0, 'EMOTION total (4 chakras at +1)');
assertClose(r2.totals.WILL, 5.0, 'WILL total (5 chakras at +1)');
assertClose(r2.nei, 12.0, 'Maximum NEI (+12)');
assertEqual(r2.tndc, 0, 'TNDC (none distorted)');

console.log('\n== Test 3: all still (S) — worst case ==');
const allS = {};
for (const ch of ['7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1']) allS[ch] = 'S';
const r3 = computeVisitTotals(allS);
assertClose(r3.nei, -24.0, 'NEI (12 chakras at -2)');
assertEqual(r3.tndc, 12, 'TNDC (all distorted)');

console.log('\n== Test 4: incomplete visit ==');
const partial = { '7': 'C' };
const r4 = computeVisitTotals(partial);
assertEqual(r4.complete, false, 'Incomplete visit detected');
assertEqual(r4.tndc, 0, 'TNDC does not count chakras not yet filled in');

console.log(`\n${failures === 0 ? 'ALL TESTS PASSED ✅' : failures + ' TEST(S) FAILED ❌'}`);
process.exit(failures === 0 ? 0 : 1);
