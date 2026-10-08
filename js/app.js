import * as ClientsAPI from './clients.js';
import * as VisitsAPI from './visits.js';
import { store } from './store.js';
import { exportAllBackup, importAllBackup } from './backup.js';
import {
  CHAKRA_ORDER,
  CHAKRA_LABELS,
  SPIN_OPTIONS,
  DOMAIN_LABELS_PT,
  computeVisitTotals,
  weeksBetween,
} from './calculations.js';
import { CHAKRA_COLORS, renderDomainChart, renderNeiChart, renderTndcChart, renderChakraChart } from './charts.js';
import { exportClientCSV, exportClientJSON } from './export.js';
import { showToast, confirmAction, formatDateBR, formatNumber, el } from './ui.js';

const SPIN_LABEL_BY_CODE = Object.fromEntries(SPIN_OPTIONS.map((o) => [o.code, o.label]));
const SPIN_GROUPS = [
  { label: 'Horário circular', codes: ['C'] },
  { label: 'Horário elíptico', codes: ['CER', 'CEL', 'CEV', 'CEH', 'CEAS'] },
  { label: 'Linha reta', codes: ['V', 'H', 'R', 'L'] },
  { label: 'Anti-horário elíptico', codes: ['CCER', 'CCEL', 'CCEV', 'CCEH', 'CCEAS'] },
  { label: 'Anti-horário circular', codes: ['CC'] },
  { label: 'Parado', codes: ['S'] },
];

const state = {
  clients: [],
  currentClientId: null,
  currentClient: null,
  visits: [], // do cliente atual, ordem cronológica crescente
  editingClientId: null,
  clientFormOrigin: 'list', // 'list' | 'dados' — para onde o back/salvar leva
  selectedChakras: new Set(),
};

// ---------- Navegação ----------

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

// ---------- Início ----------

function initApp() {
  if (!store.isAvailable()) {
    showToast('O navegador bloqueou o armazenamento local (modo privado?). Os dados não serão salvos.', 'error');
  }
  goToClientsList();
}

// ---------- Lista de clientes ----------

function goToClientsList() {
  setHeader('Meus Clientes', { showBackupMenu: true });
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
      ? `Última visita: ${formatDateBR(client.lastVisitDate)} · ${client.visitCount || 0} medição(ões)`
      : 'Nenhuma medição registrada';
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
    showToast('Nenhum cliente para exportar ainda.', 'error');
    return;
  }
  exportAllBackup();
  showToast('Backup exportado.', 'success');
});

document.getElementById('btn-import-backup').addEventListener('click', () => {
  document.getElementById('input-import-backup').click();
});

document.getElementById('input-import-backup').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!confirmAction('Importar vai SUBSTITUIR todos os dados salvos neste aparelho pelos do arquivo escolhido. Continuar?')) return;
  try {
    const count = await importAllBackup(file);
    showToast(`Backup importado: ${count} cliente(s).`, 'success');
    goToClientsList();
  } catch (err) {
    showToast(err.message || 'Erro ao importar backup.', 'error');
  }
});

// ---------- Formulário de cliente ----------

function openClientForm(client, origin) {
  state.editingClientId = client ? client.id : null;
  state.clientFormOrigin = origin;
  document.getElementById('client-name').value = client?.name || '';
  document.getElementById('client-birthdate').value = client?.birthdate || '';
  document.getElementById('client-complaint').value = client?.complaint || '';
  document.getElementById('client-contact').value = client?.contact || '';

  setHeader(client ? 'Editar Cliente' : 'Novo Cliente', {
    showBack: true,
    onBack: () => (origin === 'dados' ? openClient(state.currentClientId, 'dados') : goToClientsList()),
  });
  showScreen('screen-client-form');
}

document.getElementById('form-client').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('client-name').value,
    birthdate: document.getElementById('client-birthdate').value,
    complaint: document.getElementById('client-complaint').value,
    contact: document.getElementById('client-contact').value,
  };
  if (!data.name.trim()) {
    showToast('O nome é obrigatório.', 'error');
    return;
  }
  try {
    if (state.editingClientId) {
      ClientsAPI.updateClient(state.editingClientId, data);
      showToast('Cliente atualizado.', 'success');
      openClient(state.editingClientId, 'dados');
    } else {
      const newId = ClientsAPI.createClient(data);
      showToast('Cliente criado.', 'success');
      openClient(newId, 'medicao');
    }
  } catch (err) {
    showToast('Erro ao salvar cliente.', 'error');
  }
});

// ---------- Detalhe do cliente ----------

function openClient(clientId, initialTab = 'historico') {
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
  if (tabName === 'graficos') renderChartsTab();
}

// ---------- Aba: Dados do cliente ----------

function renderClientDataTab() {
  const c = state.currentClient;
  const view = document.getElementById('client-data-view');
  view.innerHTML = '';
  view.appendChild(
    el('dl', { class: 'visit-detail' }, [
      el('dt', {}, 'Nome'),
      el('dd', {}, c.name),
      el('dt', {}, 'Data de nascimento'),
      el('dd', {}, c.birthdate ? formatDateBR(c.birthdate) : '—'),
      el('dt', {}, 'Queixa / observações'),
      el('dd', {}, c.complaint || '—'),
      el('dt', {}, 'Contato'),
      el('dd', {}, c.contact || '—'),
    ])
  );
}

document.getElementById('btn-edit-client').addEventListener('click', () => {
  openClientForm(state.currentClient, 'dados');
});

document.getElementById('btn-delete-client').addEventListener('click', () => {
  if (!confirmAction(`Excluir "${state.currentClient.name}" e todo o histórico dele? Esta ação não pode ser desfeita.`)) return;
  ClientsAPI.deleteClient(state.currentClientId);
  showToast('Cliente excluído.', 'success');
  goToClientsList();
});

// ---------- Aba: Nova medição / edição ----------

function buildSpinSelect(chakra, value) {
  const select = el('select', { id: `spin-${chakra}`, 'aria-label': `Notação de spin do chakra ${chakra}` });
  select.appendChild(el('option', { value: '' }, 'Selecione…'));
  for (const group of SPIN_GROUPS) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    for (const code of group.codes) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = SPIN_LABEL_BY_CODE[code];
      if (code === value) opt.selected = true;
      optgroup.appendChild(opt);
    }
    select.appendChild(optgroup);
  }
  select.addEventListener('change', recomputeVisitSummary);
  return select;
}

function buildChakraRows(spins = {}, diameters = {}) {
  const container = document.getElementById('visit-chakras');
  container.innerHTML = '';
  for (const chakra of CHAKRA_ORDER) {
    const row = el('div', { class: 'chakra-row', style: `border-left-color:${CHAKRA_COLORS[chakra]}` });
    row.appendChild(el('div', { class: 'chakra-row__label' }, CHAKRA_LABELS[chakra]));
    const fields = el('div', { class: 'chakra-row__fields' });
    const selectLabel = el('label', {}, ['Spin', buildSpinSelect(chakra, spins[chakra])]);
    const diaInput = el('input', {
      type: 'number',
      step: '0.1',
      min: '0',
      id: `dia-${chakra}`,
      placeholder: 'cm',
      value: diameters[chakra] ?? '',
    });
    const diaLabel = el('label', {}, ['Diâmetro (cm)', diaInput]);
    fields.appendChild(selectLabel);
    fields.appendChild(diaLabel);
    row.appendChild(fields);
    container.appendChild(row);
  }
}

function readSpinsFromForm() {
  const spins = {};
  for (const chakra of CHAKRA_ORDER) {
    const value = document.getElementById(`spin-${chakra}`).value;
    if (value) spins[chakra] = value;
  }
  return spins;
}

function readDiametersFromForm() {
  const diameters = {};
  for (const chakra of CHAKRA_ORDER) {
    const value = document.getElementById(`dia-${chakra}`).value;
    if (value !== '') diameters[chakra] = Number(value);
  }
  return diameters;
}

function recomputeVisitSummary() {
  const spins = readSpinsFromForm();
  const result = computeVisitTotals(spins);
  const box = document.getElementById('visit-summary');

  const dominantText = result.dominant.length > 1
    ? `Empate entre ${result.dominant.map((d) => DOMAIN_LABELS_PT[d]).join(' e ')}`
    : DOMAIN_LABELS_PT[result.dominant[0]];
  const secondaryText = result.secondary.map((d) => DOMAIN_LABELS_PT[d]).join(', ');

  box.innerHTML = '';
  box.appendChild(el('div', {}, [el('strong', {}, 'Razão: '), formatNumber(result.totals.REASON)]));
  box.appendChild(el('div', {}, [el('strong', {}, 'Emoção: '), formatNumber(result.totals.EMOTION)]));
  box.appendChild(el('div', {}, [el('strong', {}, 'Vontade: '), formatNumber(result.totals.WILL)]));
  box.appendChild(el('div', { class: 'dominant' }, `Domínio dominante: ${dominantText}`));
  if (secondaryText) box.appendChild(el('div', {}, `Secundário: ${secondaryText}`));
  box.appendChild(el('div', {}, [el('strong', {}, 'NEI: '), `${formatNumber(result.nei)} (referência: −12 a +12)`]));
  box.appendChild(el('div', {}, [el('strong', {}, 'TNDC: '), `${result.tndc} de 12`]));
  if (!result.complete) {
    box.appendChild(el('div', { class: 'muted' }, 'Preencha os 12 chakras para salvar a medição.'));
  }
}

function resetVisitForm() {
  document.getElementById('visit-id').value = '';
  document.getElementById('visit-date').value = todayISO();
  document.getElementById('visit-notes').value = '';
  buildChakraRows({}, {});
  recomputeVisitSummary();
  document.getElementById('btn-delete-visit').hidden = true;
}

function openVisitForEdit(visit) {
  document.getElementById('visit-id').value = visit.id;
  document.getElementById('visit-date').value = visit.date;
  document.getElementById('visit-notes').value = visit.notes || '';
  buildChakraRows(visit.spins || {}, visit.diameters || {});
  recomputeVisitSummary();
  document.getElementById('btn-delete-visit').hidden = false;
  switchClientTab('medicao');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('form-visit').addEventListener('submit', (e) => {
  e.preventDefault();
  const spins = readSpinsFromForm();
  const totals = computeVisitTotals(spins);
  if (!totals.complete) {
    showToast('Selecione a notação de todos os 12 chakras antes de salvar.', 'error');
    return;
  }
  const data = {
    date: document.getElementById('visit-date').value,
    spins,
    diameters: readDiametersFromForm(),
    notes: document.getElementById('visit-notes').value,
  };
  const visitId = document.getElementById('visit-id').value;
  try {
    if (visitId) {
      VisitsAPI.updateVisit(state.currentClientId, visitId, data);
    } else {
      VisitsAPI.createVisit(state.currentClientId, data);
    }
    showToast('Medição salva.', 'success');
    state.visits = VisitsAPI.listVisits(state.currentClientId);
    syncClientStats();
    resetVisitForm();
    renderHistoryTab();
    switchClientTab('historico');
  } catch (err) {
    showToast('Erro ao salvar a medição.', 'error');
  }
});

document.getElementById('btn-delete-visit').addEventListener('click', () => {
  const visitId = document.getElementById('visit-id').value;
  if (!visitId) return;
  if (!confirmAction('Excluir esta medição?')) return;
  VisitsAPI.deleteVisit(state.currentClientId, visitId);
  showToast('Medição excluída.', 'success');
  state.visits = VisitsAPI.listVisits(state.currentClientId);
  syncClientStats();
  resetVisitForm();
  renderHistoryTab();
  switchClientTab('historico');
});

function syncClientStats() {
  const last = state.visits[state.visits.length - 1];
  ClientsAPI.updateClientStats(state.currentClientId, {
    lastVisitDate: last ? last.date : null,
    visitCount: state.visits.length,
  });
}

// ---------- Aba: Histórico ----------

function renderHistoryTab() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  list.innerHTML = '';
  empty.hidden = state.visits.length > 0;

  const descending = [...state.visits].reverse();
  descending.forEach((visit, idxDesc) => {
    const ascIndex = state.visits.length - 1 - idxDesc;
    const totals = computeVisitTotals(visit.spins);
    const dominantText = totals.dominant.map((d) => DOMAIN_LABELS_PT[d]).join(' + ');

    const badges = el('div', { class: 'list-item__badges' }, [
      el('span', { class: 'badge' }, `NEI ${formatNumber(totals.nei)}`),
      el('span', { class: 'badge' }, `TNDC ${totals.tndc}`),
      el('span', { class: `badge badge--${totals.dominant[0].toLowerCase()}` }, dominantText),
    ]);

    const metaParts = [formatDateBR(visit.date)];
    if (ascIndex > 0) {
      const prev = state.visits[ascIndex - 1];
      metaParts.push(`${weeksBetween(prev.date, visit.date)} semana(s) desde a anterior`);
    }

    const item = el('div', { class: 'list-item', onClick: () => openVisitForEdit(visit) }, [
      el('div', { class: 'list-item__title' }, metaParts.join(' · ')),
      badges,
    ]);
    list.appendChild(item);
  });
}

document.getElementById('btn-export-csv').addEventListener('click', () => {
  if (!state.visits.length) return showToast('Nenhuma medição para exportar.', 'error');
  exportClientCSV(state.currentClient, state.visits);
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  if (!state.visits.length) return showToast('Nenhuma medição para exportar.', 'error');
  exportClientJSON(state.currentClient, state.visits);
});

// ---------- Aba: Gráficos ----------

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
