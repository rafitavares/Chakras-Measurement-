import * as ClientsAPI from './clients.js';
import * as VisitsAPI from './visits.js';
import { store } from './store.js';
import { exportAllBackup, importAllBackup } from './backup.js';
import {
  CHAKRA_ORDER,
  CHAKRA_LABELS,
  SPIN_OPTIONS,
  DOMAIN_LABELS,
  computeVisitTotals,
  weeksBetween,
} from './calculations.js';
import { CHAKRA_COLORS, renderDomainChart, renderNeiChart, renderTndcChart, renderChakraChart } from './charts.js';
import { exportClientCSV, exportClientJSON } from './export.js';
import { renderBodyMap } from './bodymap.js';
import { buildSpinIcon } from './spinicons.js';
import { generateClientReportPDF } from './report.js';
import { showToast, confirmAction, formatDate, formatNumber, el } from './ui.js';

const SPIN_LABEL_BY_CODE = Object.fromEntries(SPIN_OPTIONS.map((o) => [o.code, o.label]));
const SPIN_GROUPS = [
  { label: 'Clockwise Round', codes: ['C'] },
  { label: 'Clockwise Elliptical', codes: ['CER', 'CEL', 'CEV', 'CEH', 'CEAS'] },
  { label: 'Straight Line', codes: ['V', 'H', 'R', 'L'] },
  { label: 'Counterclockwise Elliptical', codes: ['CCER', 'CCEL', 'CCEV', 'CCEH', 'CCEAS'] },
  { label: 'Counterclockwise Round', codes: ['CC'] },
  { label: 'Still', codes: ['S'] },
];

const state = {
  clients: [],
  currentClientId: null,
  currentClient: null,
  visits: [], // for the current client, ascending chronological order
  editingClientId: null,
  clientFormOrigin: 'list', // 'list' | 'info' — where back/save should go
  selectedChakras: new Set(),
};

// ---------- Navigation ----------

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('screen--active'));
  document.getElementById(id).classList.add('screen--active');
}

function setHeader(title, { showBack = false, showBackupMenu = false, onBack = null } = {}) {
  document.getElementById('header-title').textContent = title;
  const backBtn = document.getElementById('btn-back');
  const backupBtn = document.getElementById('btn-backup-menu');
  backBtn.hidden = !showBack;
  backupBtn.hidden = !showBackupMenu;
  backBtn.onclick = onBack;
}

function todayISO() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

// ---------- Startup ----------

function initApp() {
  if (!store.isAvailable()) {
    showToast('The browser blocked local storage (private mode?). Data will not be saved.', 'error');
  }
  goToClientsList();
}

// ---------- Clients list ----------

function goToClientsList() {
  setHeader('My Clients', { showBackupMenu: true });
  showScreen('screen-clients');
  document.getElementById('backup-panel').hidden = true;
  loadAndRenderClients();
}

function loadAndRenderClients() {
  state.clients = ClientsAPI.listClients();
  const list = document.getElementById('clients-list');
  const empty = document.getElementById('clients-empty');
  list.innerHTML = '';
  empty.hidden = state.clients.length > 0;

  for (const client of state.clients) {
    const meta = client.lastVisitDate
      ? `Last visit: ${formatDate(client.lastVisitDate)} · ${client.visitCount || 0} reading(s)`
      : 'No readings recorded yet';
    const item = el('div', { class: 'list-item', onClick: () => openClient(client.id) }, [
      el('div', { class: 'list-item__title' }, client.name),
      el('div', { class: 'list-item__meta' }, meta),
    ]);
    list.appendChild(item);
  }
}

document.getElementById('btn-new-client').addEventListener('click', () => {
  openClientForm(null, 'list');
});

// ---------- Backup ----------

document.getElementById('btn-backup-menu').addEventListener('click', () => {
  const panel = document.getElementById('backup-panel');
  panel.hidden = !panel.hidden;
});

document.getElementById('btn-export-backup').addEventListener('click', () => {
  if (!state.clients.length) {
    showToast('No clients to export yet.', 'error');
    return;
  }
  exportAllBackup();
  showToast('Backup exported.', 'success');
});

document.getElementById('btn-import-backup').addEventListener('click', () => {
  document.getElementById('input-import-backup').click();
});

document.getElementById('input-import-backup').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!confirmAction('Importing will REPLACE all data saved on this device with the data from the chosen file. Continue?')) return;
  try {
    const count = await importAllBackup(file);
    showToast(`Backup imported: ${count} client(s).`, 'success');
    goToClientsList();
  } catch (err) {
    showToast(err.message || 'Error importing backup.', 'error');
  }
});

// ---------- Client form ----------

function openClientForm(client, origin) {
  state.editingClientId = client ? client.id : null;
  state.clientFormOrigin = origin;
  document.getElementById('client-name').value = client?.name || '';
  document.getElementById('client-birthdate').value = client?.birthdate || '';
  document.getElementById('client-sex').value = client?.sex || '';
  document.getElementById('client-email').value = client?.email || '';
  document.getElementById('client-phone').value = client?.phone || '';
  document.getElementById('client-complaint').value = client?.complaint || '';

  setHeader(client ? 'Edit Client' : 'New Client', {
    showBack: true,
    onBack: () => (origin === 'info' ? openClient(state.currentClientId, 'info') : goToClientsList()),
  });
  showScreen('screen-client-form');
}

document.getElementById('form-client').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('client-name').value,
    birthdate: document.getElementById('client-birthdate').value,
    sex: document.getElementById('client-sex').value,
    email: document.getElementById('client-email').value,
    phone: document.getElementById('client-phone').value,
    complaint: document.getElementById('client-complaint').value,
  };
  if (!data.name.trim()) {
    showToast('Name is required.', 'error');
    return;
  }
  try {
    if (state.editingClientId) {
      ClientsAPI.updateClient(state.editingClientId, data);
      showToast('Client updated.', 'success');
      openClient(state.editingClientId, 'info');
    } else {
      const newId = ClientsAPI.createClient(data);
      showToast('Client created.', 'success');
      openClient(newId, 'reading');
    }
  } catch (err) {
    showToast('Error saving client.', 'error');
  }
});

// ---------- Client detail ----------

function openClient(clientId, initialTab = 'history') {
  state.currentClientId = clientId;
  state.currentClient = ClientsAPI.getClient(clientId);
  state.visits = VisitsAPI.listVisits(clientId);
  state.selectedChakras = new Set();

  setHeader(state.currentClient.name, { showBack: true, onBack: goToClientsList });
  showScreen('screen-client');
  renderClientDataTab();
  resetVisitForm();
  renderHistoryTab();
  switchClientTab(initialTab);
}

document.getElementById('client-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  switchClientTab(btn.dataset.tab);
});

function switchClientTab(tabName) {
  document.querySelectorAll('#client-tabs .tab-btn').forEach((b) => {
    b.classList.toggle('tab-btn--active', b.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('tab-panel--active', p.dataset.panel === tabName);
  });
  if (tabName === 'charts') renderChartsTab();
}

// ---------- Tab: Client info ----------

const SEX_LABELS = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

function renderClientDataTab() {
  const c = state.currentClient;
  const view = document.getElementById('client-data-view');
  view.innerHTML = '';
  view.appendChild(
    el('dl', { class: 'visit-detail' }, [
      el('dt', {}, 'Name'),
      el('dd', {}, c.name),
      el('dt', {}, 'Date of birth'),
      el('dd', {}, c.birthdate ? formatDate(c.birthdate) : '—'),
      el('dt', {}, 'Sex'),
      el('dd', {}, SEX_LABELS[c.sex] || '—'),
      el('dt', {}, 'E-mail'),
      el('dd', {}, c.email || '—'),
      el('dt', {}, 'Phone'),
      el('dd', {}, c.phone || '—'),
      el('dt', {}, 'Presenting complaint / notes'),
      el('dd', {}, complaintListElement(c.complaint)),
    ])
  );
}

/** Renders the complaint text as a bullet list, one item per non-empty line. */
function complaintListElement(text) {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return el('span', {}, '—');
  return el('ul', { class: 'complaint-list' }, lines.map((line) => el('li', {}, line)));
}

document.getElementById('btn-edit-client').addEventListener('click', () => {
  openClientForm(state.currentClient, 'info');
});

document.getElementById('btn-delete-client').addEventListener('click', () => {
  if (!confirmAction(`Delete "${state.currentClient.name}" and their entire history? This cannot be undone.`)) return;
  ClientsAPI.deleteClient(state.currentClientId);
  showToast('Client deleted.', 'success');
  goToClientsList();
});

document.getElementById('btn-pdf-report').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Generating…';
  try {
    await generateClientReportPDF(state.currentClient, state.visits);
    showToast('PDF report downloaded.', 'success');
  } catch (err) {
    showToast('Error generating PDF report.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ---------- Tab: New/edit reading ----------
// Instead of 12 dropdown rows, the chakras are picked by tapping them on
// the body map; the active chakra's spin (as a shape icon) and diameter
// are chosen from the picker panel beside/below it. `visitEdit` holds the
// in-progress reading; it is plain in-memory state, never touching
// localStorage until "Save reading" is pressed (so nothing here can lose
// already-saved data).
const DIAMETER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20];

const visitEdit = {
  visitId: null,
  spins: {},
  diameters: {},
  activeChakra: CHAKRA_ORDER[0],
};

function selectChakra(chakra) {
  visitEdit.activeChakra = chakra;
  renderReadingUI();
}

function setSpin(chakra, code) {
  visitEdit.spins[chakra] = code;
  renderReadingUI();
}

function setDiameter(chakra, value) {
  if (value === undefined) delete visitEdit.diameters[chakra];
  else visitEdit.diameters[chakra] = value;
  renderReadingUI();
}

function buildIconPicker() {
  const container = document.getElementById('picker-icons');
  container.innerHTML = '';
  const current = visitEdit.spins[visitEdit.activeChakra];
  for (const group of SPIN_GROUPS) {
    for (const code of group.codes) {
      const selected = current === code;
      const btn = el('button', {
        type: 'button',
        class: `picker-icon-btn${selected ? ' picker-icon-btn--selected' : ''}`,
        title: SPIN_LABEL_BY_CODE[code],
        'aria-label': SPIN_LABEL_BY_CODE[code],
        onClick: () => setSpin(visitEdit.activeChakra, code),
      });
      btn.appendChild(buildSpinIcon(code, { size: 30 }));
      container.appendChild(btn);
    }
  }
}

function buildDiameterPicker() {
  const container = document.getElementById('picker-diameters');
  container.innerHTML = '';
  const current = visitEdit.diameters[visitEdit.activeChakra];
  container.appendChild(el('button', {
    type: 'button',
    class: `picker-diameter-chip${current === undefined ? ' picker-diameter-chip--selected' : ''}`,
    onClick: () => setDiameter(visitEdit.activeChakra, undefined),
  }, '—'));
  for (const d of DIAMETER_OPTIONS) {
    container.appendChild(el('button', {
      type: 'button',
      class: `picker-diameter-chip${current === d ? ' picker-diameter-chip--selected' : ''}`,
      onClick: () => setDiameter(visitEdit.activeChakra, d),
    }, String(d)));
  }
}

function renderSummaryBox() {
  const result = computeVisitTotals(visitEdit.spins);
  const box = document.getElementById('visit-summary');

  const dominantText = result.dominant.length > 1
    ? `Tie between ${result.dominant.map((d) => DOMAIN_LABELS[d]).join(' and ')}`
    : DOMAIN_LABELS[result.dominant[0]];
  const secondaryText = result.secondary.map((d) => DOMAIN_LABELS[d]).join(', ');

  box.innerHTML = '';
  box.appendChild(el('div', {}, [el('strong', {}, 'Reason: '), formatNumber(result.totals.REASON)]));
  box.appendChild(el('div', {}, [el('strong', {}, 'Emotion: '), formatNumber(result.totals.EMOTION)]));
  box.appendChild(el('div', {}, [el('strong', {}, 'Will: '), formatNumber(result.totals.WILL)]));
  box.appendChild(el('div', { class: 'dominant' }, `Dominant domain: ${dominantText}`));
  if (secondaryText) box.appendChild(el('div', {}, `Secondary: ${secondaryText}`));
  box.appendChild(el('div', {}, [el('strong', {}, 'NEI: '), `${formatNumber(result.nei)} (reference: −12 to +12)`]));
  box.appendChild(el('div', {}, [el('strong', {}, 'TNDC: '), `${result.tndc} of 12`]));
  if (!result.complete) {
    box.appendChild(el('div', { class: 'muted' }, 'Pick a shape for all 12 chakras to save the reading.'));
  }
}

function renderReadingUI() {
  document.getElementById('picker-chakra-label').textContent = CHAKRA_LABELS[visitEdit.activeChakra];
  buildIconPicker();
  buildDiameterPicker();

  const code = visitEdit.spins[visitEdit.activeChakra];
  const dia = visitEdit.diameters[visitEdit.activeChakra];
  document.getElementById('picker-preview').textContent = code
    ? (dia !== undefined ? `${code} · ${dia} cm` : code)
    : 'Not set yet';

  const count = CHAKRA_ORDER.filter((ch) => visitEdit.spins[ch]).length;
  document.getElementById('picker-progress').textContent = `${count} of 12 chakras set`;

  renderSummaryBox();
  renderBodyMap(document.getElementById('bodymap-container'), visitEdit.spins, state.currentClient?.sex, {
    activeChakra: visitEdit.activeChakra,
    onSelectChakra: selectChakra,
  });
}

document.getElementById('btn-prev-chakra').addEventListener('click', () => {
  const idx = CHAKRA_ORDER.indexOf(visitEdit.activeChakra);
  selectChakra(CHAKRA_ORDER[(idx - 1 + CHAKRA_ORDER.length) % CHAKRA_ORDER.length]);
});
document.getElementById('btn-next-chakra').addEventListener('click', () => {
  const idx = CHAKRA_ORDER.indexOf(visitEdit.activeChakra);
  selectChakra(CHAKRA_ORDER[(idx + 1) % CHAKRA_ORDER.length]);
});

function resetVisitForm() {
  visitEdit.visitId = null;
  visitEdit.spins = {};
  visitEdit.diameters = {};
  visitEdit.activeChakra = CHAKRA_ORDER[0];
  document.getElementById('visit-date').value = todayISO();
  document.getElementById('visit-notes').value = '';
  document.getElementById('btn-delete-visit').hidden = true;
  renderReadingUI();
}

function openVisitForEdit(visit) {
  visitEdit.visitId = visit.id;
  visitEdit.spins = { ...(visit.spins || {}) };
  visitEdit.diameters = { ...(visit.diameters || {}) };
  visitEdit.activeChakra = CHAKRA_ORDER[0];
  document.getElementById('visit-date').value = visit.date;
  document.getElementById('visit-notes').value = visit.notes || '';
  document.getElementById('btn-delete-visit').hidden = false;
  renderReadingUI();
  switchClientTab('reading');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('form-visit').addEventListener('submit', (e) => {
  e.preventDefault();
  const totals = computeVisitTotals(visitEdit.spins);
  if (!totals.complete) {
    showToast('Pick the spin shape for all 12 chakras before saving.', 'error');
    return;
  }
  const data = {
    date: document.getElementById('visit-date').value,
    spins: visitEdit.spins,
    diameters: visitEdit.diameters,
    notes: document.getElementById('visit-notes').value,
  };
  try {
    if (visitEdit.visitId) {
      VisitsAPI.updateVisit(state.currentClientId, visitEdit.visitId, data);
    } else {
      VisitsAPI.createVisit(state.currentClientId, data);
    }
    showToast('Reading saved.', 'success');
    state.visits = VisitsAPI.listVisits(state.currentClientId);
    syncClientStats();
    resetVisitForm();
    renderHistoryTab();
    switchClientTab('history');
  } catch (err) {
    showToast('Error saving reading.', 'error');
  }
});

document.getElementById('btn-delete-visit').addEventListener('click', () => {
  if (!visitEdit.visitId) return;
  if (!confirmAction('Delete this reading?')) return;
  VisitsAPI.deleteVisit(state.currentClientId, visitEdit.visitId);
  showToast('Reading deleted.', 'success');
  state.visits = VisitsAPI.listVisits(state.currentClientId);
  syncClientStats();
  resetVisitForm();
  renderHistoryTab();
  switchClientTab('history');
});

function syncClientStats() {
  const last = state.visits[state.visits.length - 1];
  ClientsAPI.updateClientStats(state.currentClientId, {
    lastVisitDate: last ? last.date : null,
    visitCount: state.visits.length,
  });
}

// ---------- Tab: History ----------

function renderHistoryTab() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  list.innerHTML = '';
  empty.hidden = state.visits.length > 0;

  const descending = [...state.visits].reverse();
  descending.forEach((visit, idxDesc) => {
    const ascIndex = state.visits.length - 1 - idxDesc;
    const totals = computeVisitTotals(visit.spins);
    const dominantText = totals.dominant.map((d) => DOMAIN_LABELS[d]).join(' + ');

    const badges = el('div', { class: 'list-item__badges' }, [
      el('span', { class: 'badge' }, `NEI ${formatNumber(totals.nei)}`),
      el('span', { class: 'badge' }, `TNDC ${totals.tndc}`),
      el('span', { class: `badge badge--${totals.dominant[0].toLowerCase()}` }, dominantText),
    ]);

    const metaParts = [formatDate(visit.date)];
    if (ascIndex > 0) {
      const prev = state.visits[ascIndex - 1];
      metaParts.push(`${weeksBetween(prev.date, visit.date)} week(s) since previous`);
    }

    const item = el('div', { class: 'list-item', onClick: () => openVisitForEdit(visit) }, [
      el('div', { class: 'list-item__title' }, metaParts.join(' · ')),
      badges,
    ]);
    list.appendChild(item);
  });
}

document.getElementById('btn-export-csv').addEventListener('click', () => {
  if (!state.visits.length) return showToast('No readings to export.', 'error');
  exportClientCSV(state.currentClient, state.visits);
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  if (!state.visits.length) return showToast('No readings to export.', 'error');
  exportClientJSON(state.currentClient, state.visits);
});

// ---------- Tab: Charts ----------

function renderChartsTab() {
  const empty = document.getElementById('charts-empty');
  const content = document.getElementById('charts-content');
  if (state.visits.length < 2) {
    empty.hidden = false;
    content.hidden = true;
    return;
  }
  empty.hidden = true;
  content.hidden = false;

  renderDomainChart(document.getElementById('chart-domain'), state.visits);
  renderNeiChart(document.getElementById('chart-nei'), state.visits);
  renderTndcChart(document.getElementById('chart-tndc'), state.visits);
  renderChakraToggles();
  renderChakraChart(document.getElementById('chart-chakra'), state.visits, [...state.selectedChakras]);
}

function renderChakraToggles() {
  const container = document.getElementById('chakra-toggles');
  container.innerHTML = '';
  for (const chakra of CHAKRA_ORDER) {
    const active = state.selectedChakras.has(chakra);
    const btn = el(
      'button',
      {
        type: 'button',
        class: `chakra-toggle${active ? ' chakra-toggle--on' : ''}`,
        style: active ? `background:${CHAKRA_COLORS[chakra]}` : '',
        onClick: () => {
          if (state.selectedChakras.has(chakra)) state.selectedChakras.delete(chakra);
          else state.selectedChakras.add(chakra);
          renderChakraToggles();
          renderChakraChart(document.getElementById('chart-chakra'), state.visits, [...state.selectedChakras]);
        },
      },
      chakra
    );
    container.appendChild(btn);
  }
}

initApp();
