// Visual body diagram: overlays the 12 chakra points, colored by spin
// status, on top of a photo-style side-profile illustration
// (assets/body-male.jpg or assets/body-female.jpg, picked from the
// client's recorded sex). Point positions are hand-calibrated percentages
// of each image's width/height, read off the chakra cones already drawn
// in those reference illustrations.
import { el } from './ui.js';
import { CHAKRA_ORDER } from './calculations.js';

const OPEN_ALIGNED = new Set(['C']);
const OPEN_ELLIPTICAL = new Set(['CER', 'CEL', 'CEV', 'CEH', 'CEAS']);
const CLOSING_ELLIPTICAL = new Set(['CCER', 'CCEL', 'CCEV', 'CCEH', 'CCEAS']);
const CLOSED = new Set(['CC']);
const STRAIGHT = new Set(['V', 'H', 'R', 'L']);
const STILL = new Set(['S']);

// slightly distinct shades within each elliptical family, for a bit of visual texture
const GREEN_SHADES = { CER: '#66bb6a', CEL: '#57a85c', CEV: '#7cc47f', CEH: '#4e9e53', CEAS: '#8bd18e' };
const RED_SHADES = { CCER: '#e07a7a', CCEL: '#d46767', CCEV: '#ea8f8f', CCEH: '#c85a5a', CCEAS: '#f2a3a3' };

const COLOR_OPEN = '#2e7d32';
const COLOR_CLOSED = '#b71c1c';
const COLOR_STRAIGHT = '#9e9e9e';
const COLOR_STILL = '#1a1a1a';
const COLOR_UNSET = '#d9d9e3';

export function colorForSpin(notation) {
  if (!notation) return COLOR_UNSET;
  if (OPEN_ALIGNED.has(notation)) return COLOR_OPEN;
  if (OPEN_ELLIPTICAL.has(notation)) return GREEN_SHADES[notation] || COLOR_OPEN;
  if (CLOSING_ELLIPTICAL.has(notation)) return RED_SHADES[notation] || COLOR_CLOSED;
  if (CLOSED.has(notation)) return COLOR_CLOSED;
  if (STRAIGHT.has(notation)) return COLOR_STRAIGHT;
  if (STILL.has(notation)) return COLOR_STILL;
  return COLOR_UNSET;
}

// { x%, y% } of each chakra's position within its reference image
const MALE_LAYOUT = {
  '7': { x: 46.5, y: 7.9 },
  '6A': { x: 57.6, y: 13.8 },
  '6B': { x: 42.8, y: 13.5 },
  '5A': { x: 57.1, y: 23.1 },
  '5B': { x: 41.4, y: 22.8 },
  '4A': { x: 58.5, y: 31.8 },
  '4B': { x: 39.4, y: 31.6 },
  '3A': { x: 58.5, y: 41.4 },
  '3B': { x: 38.7, y: 41.4 },
  '2A': { x: 57.1, y: 50.8 },
  '2B': { x: 39.4, y: 50.3 },
  '1': { x: 50.2, y: 52.5 },
};

const FEMALE_LAYOUT = {
  '7': { x: 38.7, y: 9.7 },
  '6A': { x: 48.3, y: 18.0 },
  '6B': { x: 31.1, y: 17.0 },
  '5A': { x: 48.3, y: 27.6 },
  '5B': { x: 29.0, y: 27.6 },
  '4A': { x: 50.4, y: 37.3 },
  '4B': { x: 26.9, y: 36.8 },
  '3A': { x: 49.7, y: 46.0 },
  '3B': { x: 26.9, y: 46.5 },
  '2A': { x: 49.0, y: 53.4 },
  '2B': { x: 26.9, y: 54.8 },
  '1': { x: 40.1, y: 56.6 },
};

const BODY_VARIANTS = {
  male: { src: 'assets/body-male.jpg', layout: MALE_LAYOUT, alt: 'Side-profile body diagram (male)' },
  female: { src: 'assets/body-female.jpg', layout: FEMALE_LAYOUT, alt: 'Side-profile body diagram (female)' },
};

const LEGEND_ITEMS = [
  { color: COLOR_OPEN, text: 'Open, aligned (C)' },
  { color: GREEN_SHADES.CER, text: 'Open, not aligned (clockwise elliptical)' },
  { color: RED_SHADES.CCER, text: 'Closing (counterclockwise elliptical)' },
  { color: COLOR_CLOSED, text: 'Closed (CC)' },
  { color: COLOR_STRAIGHT, text: 'Straight line (V/H/R/L)' },
  { color: COLOR_STILL, text: 'Still (S)' },
  { color: COLOR_UNSET, text: 'Not recorded yet' },
];

function buildLegend() {
  return el(
    'div',
    { class: 'bodymap-legend' },
    LEGEND_ITEMS.map((item) =>
      el('span', { class: 'bodymap-legend-item' }, [
        el('span', { class: 'bodymap-swatch', style: `background:${item.color}` }),
        item.text,
      ])
    )
  );
}

/**
 * Renders the body map into `container` for the given spins.
 * @param {HTMLElement} container
 * @param {Object<string,string>} spins
 * @param {string|null} sex - client's recorded sex; anything other than
 *   'male' falls back to the female illustration.
 */
export function renderBodyMap(container, spins = {}, sex = null) {
  container.innerHTML = '';

  const variant = sex === 'male' ? BODY_VARIANTS.male : BODY_VARIANTS.female;

  const wrap = el('div', { class: 'bodymap-wrap' });
  wrap.appendChild(el('img', { src: variant.src, alt: variant.alt, class: 'bodymap-img' }));

  for (const chakra of CHAKRA_ORDER) {
    const notation = spins[chakra];
    const color = colorForSpin(notation);
    const pos = variant.layout[chakra];

    const dot = el('span', {
      class: 'bodymap-dot',
      style: `left:${pos.x}%; top:${pos.y}%; background:${color};`,
      title: `${chakra}: ${notation || 'not set'}`,
    });
    dot.appendChild(el('span', { class: 'bodymap-dot-label' }, chakra));
    wrap.appendChild(dot);
  }

  container.appendChild(wrap);
  container.appendChild(buildLegend());
}
