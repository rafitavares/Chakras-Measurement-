// Núcleo do método de leitura de chakras (Barbara Brennan).
// Único ponto de verdade para a tabela de notações de spin e para os cálculos
// de cada visita. Não duplique estes valores em nenhum outro arquivo.

// notação de spin -> valor numérico atribuído
export const SPIN_VALUES = Object.freeze({
  C: 1.0,
  CER: 0.5,
  CEL: 0.5,
  CEV: 0.5,
  CEH: 0.5,
  CEAS: 0.5,
  V: 0.0,
  H: 0.0,
  R: 0.0,
  L: 0.0,
  CCER: -0.5,
  CCEL: -0.5,
  CCEV: -0.5,
  CCEH: -0.5,
  CCEAS: -0.5,
  CC: -1.0,
  S: -2.0,
});

// Rótulos amigáveis para o seletor de notação (mesma ordem da planilha original)
export const SPIN_OPTIONS = [
  { code: 'C', label: 'C — Horário circular' },
  { code: 'CER', label: 'CER — Horário elíptico (direita)' },
  { code: 'CEL', label: 'CEL — Horário elíptico (esquerda)' },
  { code: 'CEV', label: 'CEV — Horário elíptico (vertical)' },
  { code: 'CEH', label: 'CEH — Horário elíptico (horizontal)' },
  { code: 'CEAS', label: 'CEAS — Horário elíptico (anti-sentido)' },
  { code: 'V', label: 'V — Linha reta (vertical)' },
  { code: 'H', label: 'H — Linha reta (horizontal)' },
  { code: 'R', label: 'R — Linha reta (direita)' },
  { code: 'L', label: 'L — Linha reta (esquerda)' },
  { code: 'CCER', label: 'CCER — Anti-horário elíptico (direita)' },
  { code: 'CCEL', label: 'CCEL — Anti-horário elíptico (esquerda)' },
  { code: 'CCEV', label: 'CCEV — Anti-horário elíptico (vertical)' },
  { code: 'CCEH', label: 'CCEH — Anti-horário elíptico (horizontal)' },
  { code: 'CCEAS', label: 'CCEAS — Anti-horário elíptico (anti-sentido)' },
  { code: 'CC', label: 'CC — Anti-horário circular' },
  { code: 'S', label: 'S — Parado (still)' },
];

// Ordem de exibição em tela, de cima para baixo, igual à planilha original
export const CHAKRA_ORDER = Object.freeze([
  '7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1',
]);

export const CHAKRA_LABELS = Object.freeze({
  '7': '7 · Coroa',
  '6A': '6A · Terceiro olho (frente)',
  '6B': '6B · Terceiro olho (costas)',
  '5A': '5A · Garganta (frente)',
  '4A': '4A · Coração (frente)',
  '3A': '3A · Plexo solar (frente)',
  '2A': '2A · Sacral (frente)',
  '5B': '5B · Garganta (costas)',
  '4B': '4B · Coração (costas)',
  '3B': '3B · Plexo solar (costas)',
  '2B': '2B · Sacral (costas)',
  '1': '1 · Base/raiz',
});

// Os 3 domínios e quais chakras cada um agrupa
export const DOMAIN_GROUPS = Object.freeze({
  REASON: ['7', '6A', '6B'],
  EMOTION: ['5A', '4A', '3A', '2A'],
  WILL: ['5B', '4B', '3B', '2B', '1'],
});

export const DOMAIN_LABELS_PT = Object.freeze({
  REASON: 'Razão',
  EMOTION: 'Emoção',
  WILL: 'Vontade',
});

export function spinValue(notation) {
  if (!notation) return null;
  const v = SPIN_VALUES[notation];
  return typeof v === 'number' ? v : null;
}

/**
 * Calcula os totais de uma visita a partir do objeto de notações escolhidas.
 * @param {Object<string,string>} spins - mapa chakra -> notação (ex: {"7":"C", "6A":"CCEL", ...})
 * @returns {{
 *   values: Object<string,number|null>,
 *   totals: {REASON:number, EMOTION:number, WILL:number},
 *   dominant: string[],
 *   secondary: string[],
 *   nei: number,
 *   tndc: number,
 *   complete: boolean
 * }}
 */
export function computeVisitTotals(spins = {}) {
  const values = {};
  for (const chakra of CHAKRA_ORDER) {
    values[chakra] = spinValue(spins[chakra]);
  }

  const complete = CHAKRA_ORDER.every((ch) => values[ch] !== null);

  const sumGroup = (list) =>
    list.reduce((acc, ch) => acc + (values[ch] ?? 0), 0);

  const totals = {
    REASON: sumGroup(DOMAIN_GROUPS.REASON),
    EMOTION: sumGroup(DOMAIN_GROUPS.EMOTION),
    WILL: sumGroup(DOMAIN_GROUPS.WILL),
  };

  const maxTotal = Math.max(totals.REASON, totals.EMOTION, totals.WILL);
  const dominant = Object.keys(totals).filter((k) => totals[k] === maxTotal);
  const secondary = Object.keys(totals)
    .filter((k) => !dominant.includes(k))
    .sort((a, b) => totals[b] - totals[a]);

  const nei = CHAKRA_ORDER.reduce((acc, ch) => acc + (values[ch] ?? 0), 0);

  const tndc = CHAKRA_ORDER.reduce((acc, ch) => {
    const notation = spins[ch];
    if (!notation) return acc; // não preenchido ainda: não conta
    return acc + (notation !== 'C' ? 1 : 0);
  }, 0);

  return { values, totals, dominant, secondary, nei, tndc, complete };
}

// Faixa de referência usada nos gráficos de NEI
export const NEI_RANGE = Object.freeze({ min: -12, max: 12 });

/** Diferença em semanas (arredondada) entre duas datas ISO "YYYY-MM-DD" */
export function weeksBetween(isoDateEarlier, isoDateLater) {
  const a = new Date(isoDateEarlier + 'T00:00:00');
  const b = new Date(isoDateLater + 'T00:00:00');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
}
