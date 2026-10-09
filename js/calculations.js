// Core of the chakra pendulum reading method (Barbara Brennan).
// Single source of truth for the spin notation table and for the
// per-visit calculations. Do not duplicate these values anywhere else.

// spin notation -> assigned numeric value
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

// Friendly labels for the notation picker (same order as the original spreadsheet)
export const SPIN_OPTIONS = [
  { code: 'C', label: 'C — Clockwise Round' },
  { code: 'CER', label: 'CER — Clockwise Elliptical (right)' },
  { code: 'CEL', label: 'CEL — Clockwise Elliptical (left)' },
  { code: 'CEV', label: 'CEV — Clockwise Elliptical (vertical)' },
  { code: 'CEH', label: 'CEH — Clockwise Elliptical (horizontal)' },
  { code: 'CEAS', label: 'CEAS — Clockwise Elliptical (askew)' },
  { code: 'V', label: 'V — Straight Line (vertical)' },
  { code: 'H', label: 'H — Straight Line (horizontal)' },
  { code: 'R', label: 'R — Straight Line (right)' },
  { code: 'L', label: 'L — Straight Line (left)' },
  { code: 'CCER', label: 'CCER — Counterclockwise Elliptical (right)' },
  { code: 'CCEL', label: 'CCEL — Counterclockwise Elliptical (left)' },
  { code: 'CCEV', label: 'CCEV — Counterclockwise Elliptical (vertical)' },
  { code: 'CCEH', label: 'CCEH — Counterclockwise Elliptical (horizontal)' },
  { code: 'CCEAS', label: 'CCEAS — Counterclockwise Elliptical (askew)' },
  { code: 'CC', label: 'CC — Counterclockwise Round' },
  { code: 'S', label: 'S — Still' },
];

// Display order, top to bottom, same as the original spreadsheet column
export const CHAKRA_ORDER = Object.freeze([
  '7', '6A', '6B', '5A', '4A', '3A', '2A', '5B', '4B', '3B', '2B', '1',
]);

export const CHAKRA_LABELS = Object.freeze({
  '7': '7 · Crown',
  '6A': '6A · Third Eye (front)',
  '6B': '6B · Third Eye (back)',
  '5A': '5A · Throat (front)',
  '4A': '4A · Heart (front)',
  '3A': '3A · Solar Plexus (front)',
  '2A': '2A · Sacral (front)',
  '5B': '5B · Throat (back)',
  '4B': '4B · Heart (back)',
  '3B': '3B · Solar Plexus (back)',
  '2B': '2B · Sacral (back)',
  '1': '1 · Base/Root',
});

// The 3 domains and which chakras each one groups
export const DOMAIN_GROUPS = Object.freeze({
  REASON: ['7', '6A', '6B'],
  EMOTION: ['5A', '4A', '3A', '2A'],
  WILL: ['5B', '4B', '3B', '2B', '1'],
});

export const DOMAIN_LABELS = Object.freeze({
  REASON: 'Reason',
  EMOTION: 'Emotion',
  WILL: 'Will',
});

export function spinValue(notation) {
  if (!notation) return null;
  const v = SPIN_VALUES[notation];
  return typeof v === 'number' ? v : null;
}

/**
 * Computes the totals for a visit from the chosen notations.
 * @param {Object<string,string>} spins - map chakra -> notation (e.g. {"7":"C", "6A":"CCEL", ...})
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
    if (!notation) return acc; // not filled in yet: doesn't count
    return acc + (notation !== 'C' ? 1 : 0);
  }, 0);

  return { values, totals, dominant, secondary, nei, tndc, complete };
}

// Reference range used in the NEI charts
export const NEI_RANGE = Object.freeze({ min: -12, max: 12 });

/** Difference in weeks (rounded) between two ISO "YYYY-MM-DD" dates */
export function weeksBetween(isoDateEarlier, isoDateLater) {
  const a = new Date(isoDateEarlier + 'T00:00:00');
  const b = new Date(isoDateLater + 'T00:00:00');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
}
