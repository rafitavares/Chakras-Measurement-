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
const ELLIPSE_ANGLE = { ER: 55, EL: -55, EV: 90, EH: 0 };

function arrowHead(tipX, tipY, tangentDeg, size) {
  const toRad = (d) => (d * Math.PI) / 180;
  const t = toRad(tangentDeg);
  const back = { x: tipX - size * Math.cos(t), y: tipY - size * Math.sin(t) };
  const perp = toRad(tangentDeg + 90);
  const w = size * 0.45;
  const p1 = { x: back.x + w * Math.cos(perp), y: back.y + w * Math.sin(perp) };
  const p2 = { x: back.x - w * Math.cos(perp), y: back.y - w * Math.sin(perp) };
  return svgEl('path', {
    d: `M ${tipX} ${tipY} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`,
    fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 0.8, 'stroke-linejoin': 'round',
  });
}

/**
 * A ~250° arc ending in one large arrowhead, used to show
 * clockwise/counterclockwise spin, readable at a glance on a small screen.
 */
function spinArc(cx, cy, rx, ry, clockwise) {
  const g = svgEl('g');
  const startDeg = clockwise ? -100 : 100;
  const endDeg = clockwise ? 150 : -150;
  const toRad = (d) => (d * Math.PI) / 180;
  const pt = (deg) => ({ x: cx + rx * Math.cos(toRad(deg)), y: cy + ry * Math.sin(toRad(deg)) });
  const start = pt(startDeg);
  const end = pt(endDeg);
  const sweepFlag = clockwise ? 1 : 0;
  g.appendChild(svgEl('path', {
    d: `M ${start.x} ${start.y} A ${rx} ${ry} 0 1 ${sweepFlag} ${end.x} ${end.y}`,
    fill: 'none', stroke: 'currentColor', 'stroke-width': 2.6, 'stroke-linecap': 'round',
  }));
  // tangent direction of the ellipse at a given angle, in the travel direction
  const tangent = (deg) => {
    const dx = -rx * Math.sin(toRad(deg));
    const dy = ry * Math.cos(toRad(deg));
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    return clockwise ? a : a + 180;
  };
  // one large arrowhead whose base sits exactly on the end of the arc
  const dir = (tangent(endDeg) * Math.PI) / 180;
  const size = 8.5;
  g.appendChild(arrowHead(end.x + size * Math.cos(dir), end.y + size * Math.sin(dir), tangent(endDeg), size));
  return g;
}

/** "Askew" (EAS/CCEAS): a tangled, irregular double-loop instead of a
 * clean ellipse, so it reads as visibly different from ER/EL/EV/EH. */
function tangledIcon(clockwise) {
  const g = svgEl('g');
  g.appendChild(svgEl('path', {
    d: 'M 8 21 C 6 14 12 8 19 9 C 27 10 28 18 21 20 C 15 22 10 17 15 13 C 20 9 27 13 25 19 C 23 25 13 26 9 20',
    fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.35, 'stroke-linecap': 'round',
  }));
  const arc = spinArc(18, 17, 11, 8, clockwise);
  arc.setAttribute('opacity', '0.95');
  g.appendChild(arc);
  return g;
}

function straightLineIcon(angleDeg) {
  const g = svgEl('g');
  const cx = 18, cy = 18, len = 13;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = len * Math.cos(rad), dy = len * Math.sin(rad);
  g.appendChild(svgEl('line', {
    x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy,
    stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round',
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
    svg.appendChild(svgEl('circle', { cx: 18, cy: 18, r: 4.5, fill: 'currentColor' }));
    return svg;
  }
  if (code === 'V') { svg.appendChild(straightLineIcon(90)); return svg; }
  if (code === 'H') { svg.appendChild(straightLineIcon(0)); return svg; }
  if (code === 'R') { svg.appendChild(straightLineIcon(-45)); return svg; }
  if (code === 'L') { svg.appendChild(straightLineIcon(45)); return svg; }

  const clockwise = !code.startsWith('CC');
  const isRound = code === 'C' || code === 'CC';

  if (isRound) {
    svg.appendChild(svgEl('circle', { cx: 18, cy: 18, r: 12, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4, opacity: 0.25 }));
    svg.appendChild(spinArc(18, 18, 12, 12, clockwise));
    return svg;
  }

  const suffix = code.replace('CC', '').replace('C', ''); // ER/EL/EV/EH/EAS

  if (suffix === 'EAS') {
    svg.appendChild(tangledIcon(clockwise));
    return svg;
  }

  const angle = ELLIPSE_ANGLE[suffix] ?? 0;
  const ellipse = svgEl('ellipse', {
    cx: 18, cy: 18, rx: 14, ry: 7.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4, opacity: 0.25,
    transform: `rotate(${angle} 18 18)`,
  });
  svg.appendChild(ellipse);
  const arcGroup = spinArc(18, 18, 14, 7.5, clockwise);
  arcGroup.setAttribute('transform', `rotate(${angle} 18 18)`);
  svg.appendChild(arcGroup);
  return svg;
}
