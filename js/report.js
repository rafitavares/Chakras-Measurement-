// Full PDF report for a client: info, reading history (with dates), and
// the 4 evolution charts. Uses jsPDF (loaded via CDN in index.html as
// window.jspdf.jsPDF). No server, no upload — the PDF is generated and
// downloaded entirely in the browser.
import { CHAKRA_ORDER, DOMAIN_LABELS, computeVisitTotals, weeksBetween } from './calculations.js';
import { formatDate, formatNumber } from './ui.js';
import { renderDomainChart, renderNeiChart, renderTndcChart, renderChakraChart } from './charts.js';

const SEX_LABELS = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

const MARGIN = 40;

function safeFileName(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
}

/**
 * Temporarily makes the Charts tab panel visible (Chart.js needs a real
 * layout width to size canvases correctly, even if that tab isn't the one
 * currently open) so each chart can be (re)rendered and captured as a PNG,
 * then restores whichever panel was showing before.
 */
async function captureChartImages(visits) {
  const chartsPanel = document.querySelector('.tab-panel[data-panel="charts"]');
  const allPanels = document.querySelectorAll('.tab-panel');
  const emptyMsg = document.getElementById('charts-empty');
  const content = document.getElementById('charts-content');

  let previousActivePanel = null;
  allPanels.forEach((p) => {
    if (p.classList.contains('tab-panel--active')) previousActivePanel = p;
  });
  const emptyWasHidden = emptyMsg.hidden;
  const contentWasHidden = content.hidden;

  allPanels.forEach((p) => p.classList.remove('tab-panel--active'));
  chartsPanel.classList.add('tab-panel--active');
  emptyMsg.hidden = true;
  content.hidden = false;

  const domainCanvas = document.getElementById('chart-domain');
  const neiCanvas = document.getElementById('chart-nei');
  const tndcCanvas = document.getElementById('chart-tndc');
  const chakraCanvas = document.getElementById('chart-chakra');

  renderDomainChart(domainCanvas, visits);
  renderNeiChart(neiCanvas, visits);
  renderTndcChart(tndcCanvas, visits);
  renderChakraChart(chakraCanvas, visits, []); // [] -> all 12 chakras

  // let Chart.js finish layout + paint before reading the canvas pixels
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const images = [
    { title: 'Totals by domain (Reason / Emotion / Will)', canvas: domainCanvas },
    { title: 'NEI (Net Energy Intake)', canvas: neiCanvas },
    { title: 'TNDC (distorted chakras)', canvas: tndcCanvas },
    { title: 'Evolution by chakra', canvas: chakraCanvas },
  ].map((c) => ({
    title: c.title,
    dataUrl: c.canvas.toDataURL('image/png', 1.0),
    width: c.canvas.width,
    height: c.canvas.height,
  }));

  chartsPanel.classList.remove('tab-panel--active');
  if (previousActivePanel) previousActivePanel.classList.add('tab-panel--active');
  emptyMsg.hidden = emptyWasHidden;
  content.hidden = contentWasHidden;

  return images;
}

/**
 * Generates and downloads a full PDF report for a client: info, reading
 * history (dates + key numbers), and the evolution charts (when there are
 * at least 2 readings).
 */
export async function generateClientReportPDF(client, visits) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  let y = MARGIN;

  function ensureSpace(neededHeight) {
    if (y + neededHeight > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // ---------- Title ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Chakra Measurement Report', MARGIN, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated on ${formatDate(new Date().toISOString().slice(0, 10))}`, MARGIN, y);
  doc.setTextColor(20);
  y += 22;

  // ---------- Client info ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(client.name, MARGIN, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const infoLines = [
    ['Date of birth', client.birthdate ? formatDate(client.birthdate) : '—'],
    ['Sex', SEX_LABELS[client.sex] || '—'],
    ['E-mail', client.email || '—'],
    ['Phone', client.phone || '—'],
  ];
  for (const [label, value] of infoLines) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, MARGIN + 110, y);
    y += 16;
  }

  const complaintLines = (client.complaint || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (complaintLines.length) {
    y += 6;
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Presenting complaint / notes:', MARGIN, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    for (const line of complaintLines) {
      const wrapped = doc.splitTextToSize(`•  ${line}`, contentWidth - 10);
      ensureSpace(14 * wrapped.length);
      doc.text(wrapped, MARGIN + 10, y);
      y += 14 * wrapped.length;
    }
  }
  y += 18;

  // ---------- Reading history table ----------
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Reading History', MARGIN, y);
  y += 18;

  const columns = [
    { label: 'Date', width: 80 },
    { label: 'Weeks since prev.', width: 100 },
    { label: 'NEI', width: 60 },
    { label: 'TNDC', width: 50 },
    { label: 'Dominant domain', width: contentWidth - 80 - 100 - 60 - 50 },
  ];

  function drawTableHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    let x = MARGIN;
    for (const col of columns) {
      doc.text(col.label, x, y);
      x += col.width;
    }
    y += 6;
    doc.setDrawColor(180);
    doc.line(MARGIN, y, MARGIN + contentWidth, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
  }

  if (!visits.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('No readings recorded yet.', MARGIN, y);
    y += 20;
  } else {
    drawTableHeader();
    visits.forEach((visit, idx) => {
      ensureSpace(16);
      if (y === MARGIN) drawTableHeader(); // redraw header after a page break
      const totals = computeVisitTotals(visit.spins);
      const weeks = idx > 0 ? `${weeksBetween(visits[idx - 1].date, visit.date)}` : '—';
      const dominant = totals.dominant.map((d) => DOMAIN_LABELS[d]).join(' + ');
      let x = MARGIN;
      const row = [formatDate(visit.date), weeks, formatNumber(totals.nei), String(totals.tndc), dominant];
      row.forEach((cell, i) => {
        doc.text(cell, x, y);
        x += columns[i].width;
      });
      y += 16;
    });
  }

  // ---------- Charts ----------
  if (visits.length >= 2) {
    const images = await captureChartImages(visits);
    for (const img of images) {
      doc.addPage();
      y = MARGIN;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(img.title, MARGIN, y);
      y += 20;
      const drawWidth = contentWidth;
      const drawHeight = drawWidth * (img.height / img.width);
      doc.addImage(img.dataUrl, 'PNG', MARGIN, y, drawWidth, drawHeight);
    }
  }

  doc.save(`chakras_report_${safeFileName(client.name)}.pdf`);
}
