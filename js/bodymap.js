// Visual body diagram: overlays a colored cone (echoing the cones already
// drawn in the reference illustration) at each of the 12 chakra points, on
// top of a photo-style side-profile image (assets/body-male.jpg or
// assets/body-female.jpg, picked from the client's recorded sex). Chakra
// number labels sit in the margins around the image, connected to their
// point by a thin leader line, so they never cover the photo.
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

// Each point: xPct/yPct = position within the image (0-100), dir = which
// way its cone flares (matches the cone already drawn in the photo),
// labelSide = which margin its number is written in.
const MALE_LAYOUT = {
  '7': { xPct: 46.5, yPct: 7.9, dir: 'up', labelSide: 'top' },
  '6A': { xPct: 57.6, yPct: 13.8, dir: 'right', labelSide: 'right' },
  '6B': { xPct: 42.8, yPct: 13.5, dir: 'left', labelSide: 'left' },
  '5A': { xPct: 57.1, yPct: 23.1, dir: 'right', labelSide: 'right' },
  '5B': { xPct: 41.4, yPct: 22.8, dir: 'left', labelSide: 'left' },
  '4A': { xPct: 58.5, yPct: 31.8, dir: 'right', labelSide: 'right' },
  '4B': { xPct: 39.4, yPct: 31.6, dir: 'left', labelSide: 'left' },
  '3A': { xPct: 58.5, yPct: 41.4, dir: 'right', labelSide: 'right' },
  '3B': { xPct: 38.7, yPct: 41.4, dir: 'left', labelSide: 'left' },
  '2A': { xPct: 57.1, yPct: 50.8, dir: 'right', labelSide: 'right' },
  '2B': { xPct: 39.4, yPct: 50.3, dir: 'left', labelSide: 'left' },
  '1': { xPct: 50.2, yPct: 52.5, dir: 'down', labelSide: 'right', labelYPct: 61 },
};

const FEMALE_LAYOUT = {
  '7': { xPct: 38.7, yPct: 9.7, dir: 'up', labelSide: 'top' },
  '6A': { xPct: 48.3, yPct: 18.0, dir: 'right', labelSide: 'right' },
  '6B': { xPct: 31.1, yPct: 17.0, dir: 'left', labelSide: 'left' },
  '5A': { xPct: 48.3, yPct: 27.6, dir: 'right', labelSide: 'right' },
  '5B': { xPct: 29.0, yPct: 27.6, dir: 'left', labelSide: 'left' },
  '4A': { xPct: 50.4, yPct: 37.3, dir: 'right', labelSide: 'right' },
  '4B': { xPct: 26.9, yPct: 36.8, dir: 'left', labelSide: 'left' },
  '3A': { xPct: 49.7, yPct: 46.0, dir: 'right', labelSide: 'right' },
  '3B': { xPct: 26.9, yPct: 46.5, dir: 'left', labelSide: 'left' },
  '2A': { xPct: 49.0, yPct: 53.4, dir: 'right', labelSide: 'right' },
  '2B': { xPct: 26.9, yPct: 54.8, dir: 'left', labelSide: 'left' },
  '1': { xPct: 40.1, yPct: 56.6, dir: 'down', labelSide: 'right', labelYPct: 65 },
};

const BODY_VARIANTS = {
  male: { src: 'assets/body-male.jpg', width: 543, height: 724, layout: MALE_LAYOUT, alt: 'Side-profile body diagram (male)' },
  female: { src: 'assets/body-female.jpg', width: 503, height: 754, layout: FEMALE_LAYOUT, alt: 'Side-profile body diagram (female)' },
};

const DIR_VECTORS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function coneShape(x, y, dir, imgWidth, color) {
  const length = imgWidth * 0.1;
  const spread = imgWidth * 0.045;
  const [dx, dy] = DIR_VECTORS[dir];
  const baseX = x + dx * length;
  const baseY = y + dy * length;
  const perpX = -dy * spread;
  const perpY = dx * spread;
  const d = `M ${x} ${y} L ${baseX + perpX} ${baseY + perpY} L ${baseX - perpX} ${baseY - perpY} Z`;
  return svgEl('path', { d, fill: color, opacity: '0.82', stroke: '#ffffff', 'stroke-width': imgWidth * 0.003, 'stroke-opacity': '0.7' });
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
 * @param {string|null} sex - client's recorded sex; anything other than
 *   'male' falls back to the female illustration.
 */
export function renderBodyMap(container, spins = {}, sex = null) {
  container.innerHTML = '';

  const variant = sex === 'male' ? BODY_VARIANTS.male : BODY_VARIANTS.female;
  const { src, width, height, layout, alt } = variant;

  const marginX = width * 0.19;
  const marginTop = height * 0.045;
  const viewBox = `${-marginX} ${-marginTop} ${width + marginX * 2} ${height + marginTop}`;

  const svg = svgEl('svg', {
    viewBox,
    class: 'bodymap-svg',
    role: 'img',
    'aria-label': alt,
  });

  svg.appendChild(svgEl('image', {
    href: src, x: 0, y: 0, width, height, preserveAspectRatio: 'xMidYMid meet',
  }));

  for (const chakra of CHAKRA_ORDER) {
    const pos = layout[chakra];
    const px = (pos.xPct / 100) * width;
    const py = (pos.yPct / 100) * height;
    const notation = spins[chakra];
    const color = colorForSpin(notation);

    svg.appendChild(coneShape(px, py, pos.dir, width, color));

    const dot = svgEl('circle', {
      cx: px, cy: py, r: width * 0.016, fill: color, stroke: '#ffffff', 'stroke-width': width * 0.004,
    });
    const title = svgEl('title');
    title.textContent = `${chakra}: ${notation || 'not set'}`;
    dot.appendChild(title);
    svg.appendChild(dot);

    // leader line + label, out in the margin so it never sits over the photo
    const labelPy = pos.labelYPct !== undefined ? (pos.labelYPct / 100) * height : py;
    let labelX, labelY, anchor, lineToX, lineToY;
    if (pos.labelSide === 'right') {
      lineToX = width; lineToY = labelPy;
      labelX = width + marginX * 0.55; labelY = labelPy;
      anchor = 'start';
    } else if (pos.labelSide === 'left') {
      lineToX = 0; lineToY = labelPy;
      labelX = -marginX * 0.55; labelY = labelPy;
      anchor = 'end';
    } else {
      lineToX = px; lineToY = 0;
      labelX = px; labelY = -marginTop * 0.45;
      anchor = 'middle';
    }

    svg.appendChild(svgEl('line', {
      x1: px, y1: py, x2: lineToX, y2: lineToY,
      stroke: '#8a86ad', 'stroke-width': width * 0.0025, 'stroke-dasharray': `${width * 0.006} ${width * 0.006}`,
    }));
    const label = svgEl('text', {
      x: labelX, y: labelY, 'text-anchor': anchor, class: 'bodymap-label', 'font-size': width * 0.042,
    });
    label.setAttribute('dominant-baseline', 'middle');
    label.textContent = chakra;
    svg.appendChild(label);
  }

  container.appendChild(svg);
  container.appendChild(buildLegend());
}
