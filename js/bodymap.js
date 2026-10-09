// Visual body diagram: renders the 12 chakras at their correct anatomical
// position on a side-profile silhouette (facing left), each shown as a
// small colored cone pointing outward from the spine — front (A) cones
// point toward the face/chest side, back (B) cones point toward the spine
// side, echoing the classic "front and back views" diagnostic diagram.
// This is original artwork drawn in code, not a reproduction of any
// copyrighted book figure.
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

// Layout on a side-profile silhouette facing left (viewBox 0 0 260 460).
// Single chakras (7 crown, 1 root) sit on the midline; paired chakras show
// the front (A) point toward the face/chest (left) and the back (B) point
// toward the spine (right), each with a cone flaring outward in that
// direction — matching the "Mental / Feeling / Will centers" convention.
const LAYOUT_POINTS = [
  { key: '7', x: 100, y: 50, dir: 'up' },
  { key: '6A', x: 78, y: 76, dir: 'left' },
  { key: '6B', x: 122, y: 76, dir: 'right' },
  { key: '5A', x: 74, y: 110, dir: 'left' },
  { key: '5B', x: 128, y: 110, dir: 'right' },
  { key: '4A', x: 70, y: 156, dir: 'left' },
  { key: '4B', x: 132, y: 156, dir: 'right' },
  { key: '3A', x: 70, y: 196, dir: 'left' },
  { key: '3B', x: 132, y: 196, dir: 'right' },
  { key: '2A', x: 72, y: 234, dir: 'left' },
  { key: '2B', x: 130, y: 234, dir: 'right' },
  { key: '1', x: 104, y: 258, dir: 'down' },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function thickLimb(d, width) {
  return svgEl('path', {
    d,
    fill: 'none',
    stroke: '#d8d4ee',
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
}

function buildSilhouette() {
  const g = svgEl('g');
  // trailing (back) leg, then leading (front) leg, then raised arm — drawn
  // before the torso/head so their joints tuck underneath
  g.appendChild(thickLimb('M 112 250 L 104 350 L 98 450', 26));
  g.appendChild(thickLimb('M 122 252 L 142 350 L 160 450', 26));
  g.appendChild(thickLimb('M 92 126 L 56 94 L 40 52', 15));

  const body = svgEl('g', { fill: '#d8d4ee', stroke: '#b9b2dd', 'stroke-width': '1.5' });
  body.appendChild(svgEl('circle', { cx: 100, cy: 78, r: 25 })); // head
  body.appendChild(svgEl('path', { d: 'M 75 80 L 62 86 L 75 90 Z' })); // nose/profile cue
  body.appendChild(svgEl('rect', { x: 92, y: 100, width: 16, height: 16, rx: 4 })); // neck
  body.appendChild(svgEl('path', {
    d: 'M 78 114 C 64 114 60 140 64 170 C 67 195 66 220 76 252 L 128 252 C 138 220 137 195 140 170 C 144 140 140 114 126 114 Z',
  })); // torso, tapered at waist
  g.appendChild(body);
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

const DIR_VECTORS = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

function coneShape(point, color) {
  const [dx, dy] = DIR_VECTORS[point.dir];
  const length = 22;
  const spread = 10;
  const tipX = point.x;
  const tipY = point.y;
  const baseX = point.x + dx * length;
  const baseY = point.y + dy * length;
  // perpendicular vector for the cone's flare width
  const perpX = -dy * spread;
  const perpY = dx * spread;
  const d = `M ${tipX} ${tipY} L ${baseX + perpX} ${baseY + perpY} L ${baseX - perpX} ${baseY - perpY} Z`;
  return svgEl('path', { d, fill: color, opacity: '0.55' });
}

function labelPosition(point) {
  const [dx, dy] = DIR_VECTORS[point.dir];
  const offset = 34;
  const x = point.x + dx * offset;
  const y = point.y + dy * offset + 3;
  const anchor = dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle';
  return { x, y, anchor };
}

/**
 * Renders the body map into `container` for the given spins.
 * @param {HTMLElement} container
 * @param {Object<string,string>} spins
 */
export function renderBodyMap(container, spins = {}) {
  container.innerHTML = '';

  const svg = svgEl('svg', {
    viewBox: '0 0 260 470',
    class: 'bodymap-svg',
    role: 'img',
    'aria-label': 'Body diagram, side profile, with chakra status by color',
  });
  svg.appendChild(buildSilhouette());

  for (const point of LAYOUT_POINTS) {
    const notation = spins[point.key];
    const color = colorForSpin(notation);

    svg.appendChild(coneShape(point, color));

    const circle = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 8,
      fill: color,
      stroke: '#ffffff',
      'stroke-width': 2,
    });
    const title = svgEl('title');
    title.textContent = `${point.key}: ${notation || 'not set'}`;
    circle.appendChild(title);
    svg.appendChild(circle);

    const { x, y, anchor } = labelPosition(point);
    const label = svgEl('text', { x, y, 'text-anchor': anchor, class: 'bodymap-label' });
    label.textContent = point.key;
    svg.appendChild(label);
  }

  container.appendChild(svg);
  container.appendChild(buildLegend());
}
