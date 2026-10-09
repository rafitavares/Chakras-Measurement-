// Evolution charts with Chart.js (loaded via CDN in index.html,
// available globally as `Chart`).
import { CHAKRA_ORDER, CHAKRA_LABELS, DOMAIN_LABELS, NEI_RANGE, computeVisitTotals } from './calculations.js';
import { formatDate } from './ui.js';

// Soft colors associated with each chakra (crown down to root)
export const CHAKRA_COLORS = {
  '7': '#8e7cc3',
  '6A': '#5b6fd6',
  '6B': '#4a5ec7',
  '5A': '#4aa3d6',
  '4A': '#4caf7d',
  '3A': '#d4b83a',
  '2A': '#e08a3c',
  '5B': '#3a8fc0',
  '4B': '#3f9a6d',
  '3B': '#c2a52f',
  '2B': '#d17a2b',
  '1': '#c65b5b',
};

const DOMAIN_COLORS = { REASON: '#5b6fd6', EMOTION: '#4caf7d', WILL: '#e08a3c' };

const chartRegistry = new Map();

function destroyIfExists(canvasId) {
  const existing = chartRegistry.get(canvasId);
  if (existing) {
    existing.destroy();
    chartRegistry.delete(canvasId);
  }
}

function baseOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      y: { ticks: { font: { size: 10 } } },
    },
    ...extra,
  };
}

function labelsFromVisits(visits) {
  return visits.map((v) => formatDate(v.date));
}

export function renderDomainChart(canvasEl, visits) {
  destroyIfExists(canvasEl.id);
  const labels = labelsFromVisits(visits);
  const totalsByVisit = visits.map((v) => computeVisitTotals(v.spins).totals);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      labels,
      datasets: ['REASON', 'EMOTION', 'WILL'].map((domain) => ({
        label: DOMAIN_LABELS[domain],
        data: totalsByVisit.map((t) => t[domain]),
        borderColor: DOMAIN_COLORS[domain],
        backgroundColor: DOMAIN_COLORS[domain],
        tension: 0.25,
        pointRadius: 3,
      })),
    },
    options: baseOptions(),
  });
  chartRegistry.set(canvasEl.id, chart);
  return chart;
}

export function renderNeiChart(canvasEl, visits) {
  destroyIfExists(canvasEl.id);
  const labels = labelsFromVisits(visits);
  const neiValues = visits.map((v) => computeVisitTotals(v.spins).nei);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'NEI',
          data: neiValues,
          borderColor: '#5b6fd6',
          backgroundColor: 'rgba(91,111,214,0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 3,
        },
      ],
    },
    options: baseOptions({
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { min: NEI_RANGE.min, max: NEI_RANGE.max, ticks: { font: { size: 10 } } },
      },
    }),
  });
  chartRegistry.set(canvasEl.id, chart);
  return chart;
}

export function renderTndcChart(canvasEl, visits) {
  destroyIfExists(canvasEl.id);
  const labels = labelsFromVisits(visits);
  const tndcValues = visits.map((v) => computeVisitTotals(v.spins).tndc);
  const chart = new Chart(canvasEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'TNDC (distorted chakras)',
          data: tndcValues,
          backgroundColor: '#c2a52f',
        },
      ],
    },
    options: baseOptions({
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { min: 0, max: 12, ticks: { stepSize: 2, font: { size: 10 } } },
      },
    }),
  });
  chartRegistry.set(canvasEl.id, chart);
  return chart;
}

export function renderChakraChart(canvasEl, visits, selectedChakras) {
  destroyIfExists(canvasEl.id);
  const labels = labelsFromVisits(visits);
  const chakras = selectedChakras.length ? selectedChakras : CHAKRA_ORDER;
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      labels,
      datasets: chakras.map((ch) => ({
        label: CHAKRA_LABELS[ch],
        data: visits.map((v) => computeVisitTotals(v.spins).values[ch]),
        borderColor: CHAKRA_COLORS[ch],
        backgroundColor: CHAKRA_COLORS[ch],
        tension: 0.25,
        pointRadius: 3,
      })),
    },
    options: baseOptions({
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { min: -2, max: 1, ticks: { stepSize: 0.5, font: { size: 10 } } },
      },
    }),
  });
  chartRegistry.set(canvasEl.id, chart);
  return chart;
}
