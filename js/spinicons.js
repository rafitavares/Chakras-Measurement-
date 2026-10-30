// Small pendulum-path icons for the spin notation picker: a drawn symbol
// for each of the 17 notations (circle/ellipse + rotation arrow, straight
// line, or a still dot), so the picker can be used by tapping a shape
// instead of reading/typing a code.
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// Rotation angle (degrees) of the ellipse's long axis for each elliptical sub-type
const ELLIPSE_ANGLE = { ER: 55, EL: -55, EV: 90, EH: 0, EAS: 20 };

/** A ~270° arc with an arrowhead, used to show clockwise/counterclockwise spin. */
function spinArc(cx, cy, rx, ry, clockwise) {
  const g = svgEl('g');
  const startDeg = clockwise ? -100 : 100;
  const endDeg = clockwise ? 170 : -170;
  const toRad = (d) => (d * Math.PI) / 180;
  const start = { x: cx + rx * Math.cos(toRad(startDeg)), y: cy + ry * Math.sin(toRad(startDeg)) };
  const end = { x: cx + rx * Math.cos(toRad(endDeg)), y: cy + ry * Math.sin(toRad(endDeg)) };
  const sweepFlag = clockwise ? 1 : 0;
  g.appendChild(svgEl('path', {
    d: `M ${start.x} ${start.y} A ${rx} ${ry} 0 1 ${sweepFlag} ${end.x} ${end.y}`,
    fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round',
  }));
  // arrowhead at the end point, tangent to the arc direction
  const tangentDeg = endDeg + (clockwise ? 90 : -90);
  const t = toRad(tangentDeg);
  const ah = 4.2;
  const back = { x: end.x - ah * Math.cos(t), y: end.y - ah * Math.sin(t) };
  const perp = toRad(tangentDeg + 90);
  const p1 = { x: back.x + ah * 0.55 * Math.cos(perp), y: back.y + ah * 0.55 * Math.sin(perp) };
  const p2 = { x: back.x - ah * 0.55 * Math.cos(perp), y: back.y - ah * 0.55 * Math.sin(perp) };
  g.appendChild(svgEl('path', {
    d: `M ${end.x} ${end.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`,
    fill: 'currentColor',
  }));
  return g;
}

function straightLineIcon(angleDeg) {
  const g = svgEl('g');
  const cx = 18, cy = 18, len = 13;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = len * Math.cos(rad), dy = len * Math.sin(rad);
  g.appendChild(svgEl('line', {
    x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy,
    stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round',
  }));
  // small end ticks to read as "oscillates back and forth", not rotational
  for (const sign of [1, -1]) {
    const ex = cx + sign * dx, ey = cy + sign * dy;
    const px = -Math.sin(rad) * 3.2, py = Math.cos(rad) * 3.2;
    g.appendChild(svgEl('line', {
      x1: ex - px, y1: ey - py, x2: ex + px, y2: ey + py,
      stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round',
    }));
  }
  return g;
}

/**
 * Builds a small SVG icon depicting the pendulum path for a spin notation code.
 * @param {string} code
 * @param {{size?: number}} [opts]
 */
export function buildSpinIcon(code, { size = 36 } = {}) {
  const svg = svgEl('svg', { viewBox: '0 0 36 36', width: size, height: size, class: 'spin-icon' });

  if (code === 'S') {
    svg.appendChild(svgEl('circle', { cx: 18, cy: 18, r: 3.2, fill: 'currentColor' }));
    return svg;
  }
  if (code === 'V') { svg.appendChild(straightLineIcon(90)); return svg; }
  if (code === 'H') { svg.appendChild(straightLineIcon(0)); return svg; }
  if (code === 'R') { svg.appendChild(straightLineIcon(-45)); return svg; }
  if (code === 'L') { svg.appendChild(straightLineIcon(45)); return svg; }

  const clockwise = !code.startsWith('CC');
  const isRound = code === 'C' || code === 'CC';

  if (isRound) {
    svg.appendChild(svgEl('circle', { cx: 18, cy: 18, r: 11, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, opacity: 0.35 }));
    svg.appendChild(spinArc(18, 18, 11, 11, clockwise));
    return svg;
  }

  const suffix = code.replace('CC', '').replace('C', ''); // ER/EL/EV/EH/EAS
  const angle = ELLIPSE_ANGLE[suffix] ?? 0;
  const ellipse = svgEl('ellipse', {
    cx: 18, cy: 18, rx: 13, ry: 6.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, opacity: 0.35,
    transform: `rotate(${angle} 18 18)`,
  });
  svg.appendChild(ellipse);
  const arcGroup = spinArc(18, 18, 13, 6.5, clockwise);
  arcGroup.setAttribute('transform', `rotate(${angle} 18 18)`);
  svg.appendChild(arcGroup);
  return svg;
}
