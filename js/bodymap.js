// Visual body diagram: renders the 12 chakras at their correct anatomical
// position on a simple front-facing silhouette, colored by spin status.
//
// Color rule (per chakra notation):
//   green          -> open, aligned clockwise round (C)
//   shades of green-> open clockwise but not aligned (CER/CEL/CEV/CEH/CEAS)
//   shades of red  -> closing, counterclockwise elliptical (CCER/CCEL/CCEV/CCEH/CCEAS)
//   red            -> closed, counterclockwise round (CC)
//   gray           -> straight line movement, vertical or horizontal (V/H/R/L)
//   black          -> still, no movement (S)
//   light gray     -> not recorded yet
import { el } from './ui.js';

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

// Layout on a simple front-facing silhouette (viewBox 0 0 200 380).
// Single chakras (7, 1) are centered on the body's midline; paired chakras
// show the back (B) point on the left and the front (A) point on the right.
const LAYOUT_POINTS = [
  { key: '7', x: 100, y: 18 },
  { key: '6B', x: 86, y: 46 },
  { key: '6A', x: 114, y: 46 },
  { key: '5B', x: 84, y: 76 },
  { key: '5A', x: 116, y: 76 },
  { key: '4B', x: 76, y: 122 },
  { key: '4A', x: 124, y: 122 },
  { key: '3B', x: 76, y: 160 },
  { key: '3A', x: 124, y: 160 },
  { key: '2B', x: 76, y: 198 },
  { key: '2A', x: 124, y: 198 },
  { key: '1', x: 100, y: 224 },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function buildSilhouette() {
  const g = svgEl('g', { fill: '#d8d4ee', stroke: '#b9b2dd', 'stroke-width': '1.5' });
  g.appendChild(svgEl('circle', { cx: 100, cy: 42, r: 24 })); // head
  g.appendChild(svgEl('rect', { x: 92, y: 63, width: 16, height: 16, rx: 4 })); // neck
  g.appendChild(svgEl('rect', { x: 55, y: 77, width: 90, height: 122, rx: 30 })); // torso
  g.appendChild(svgEl('rect', { x: 30, y: 84, width: 17, height: 108, rx: 8.5 })); // left arm
  g.appendChild(svgEl('rect', { x: 153, y: 84, width: 17, height: 108, rx: 8.5 })); // right arm
  g.appendChild(svgEl('rect', { x: 60, y: 192, width: 80, height: 38, rx: 18 })); // hips
  g.appendChild(svgEl('rect', { x: 64, y: 226, width: 27, height: 130, rx: 13 })); // left leg
  g.appendChild(svgEl('rect', { x: 109, y: 226, width: 27, height: 130, rx: 13 })); // right leg
  g.appendChild(svgEl('ellipse', { cx: 77, cy: 362, rx: 15, ry: 7 })); // left foot
  g.appendChild(svgEl('ellipse', { cx: 123, cy: 362, rx: 15, ry: 7 })); // right foot
  return g;
}

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
 */
export function renderBodyMap(container, spins = {}) {
  container.innerHTML = '';

  const svg = svgEl('svg', {
    viewBox: '0 0 200 380',
    class: 'bodymap-svg',
    role: 'img',
    'aria-label': 'Body diagram with chakra status by color',
  });
  svg.appendChild(buildSilhouette());

  for (const point of LAYOUT_POINTS) {
    const notation = spins[point.key];
    const color = colorForSpin(notation);

    const circle = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 10,
      fill: color,
      stroke: '#ffffff',
      'stroke-width': 2,
    });
    const title = svgEl('title');
    title.textContent = `${point.key}: ${notation || 'not set'}`;
    circle.appendChild(title);

    const label = svgEl('text', {
      x: point.x,
      y: point.y + 20,
      'text-anchor': 'middle',
      class: 'bodymap-label',
    });
    label.textContent = point.key;

    svg.appendChild(circle);
    svg.appendChild(label);
  }

  container.appendChild(svg);
  container.appendChild(buildLegend());
}
