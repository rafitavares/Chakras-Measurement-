import { CHAKRA_ORDER, computeVisitTotals } from './calculations.js';

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
}

export function exportClientJSON(client, visits) {
  const payload = {
    client: { name: client.name, birthdate: client.birthdate, sex: client.sex, email: client.email, phone: client.phone, complaint: client.complaint },
    visits: visits.map((v) => {
      const totals = computeVisitTotals(v.spins);
      return {
        date: v.date,
        spins: v.spins,
        diameters: v.diameters || {},
        notes: v.notes || '',
        totals: totals.totals,
        nei: totals.nei,
        tndc: totals.tndc,
        dominant: totals.dominant,
      };
    }),
  };
  downloadBlob(`chakras_${safeFileName(client.name)}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

export function exportClientCSV(client, visits) {
  const header = ['date', ...CHAKRA_ORDER.map((c) => `spin_${c}`), ...CHAKRA_ORDER.map((c) => `diameter_${c}`), 'REASON', 'EMOTION', 'WILL', 'NEI', 'TNDC', 'dominant', 'notes'];
  const rows = visits.map((v) => {
    const t = computeVisitTotals(v.spins);
    const cells = [
      v.date,
      ...CHAKRA_ORDER.map((c) => v.spins?.[c] || ''),
      ...CHAKRA_ORDER.map((c) => (v.diameters?.[c] ?? '')),
      t.totals.REASON,
      t.totals.EMOTION,
      t.totals.WILL,
      t.nei,
      t.tndc,
      t.dominant.join('+'),
      (v.notes || '').replace(/\n/g, ' '),
    ];
    return cells.map(csvEscape).join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  downloadBlob(`chakras_${safeFileName(client.name)}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
