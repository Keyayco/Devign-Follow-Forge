/* Devign FollowForge — vanilla JS, localStorage only.
   Sections: constants -> utils -> storage/state -> demo data -> whatsapp
             -> rendering -> events -> init */

/* ---------------------------------------------------------------- constants */

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'FOLLOW-UP', 'WON', 'LOST'];
const OPEN_STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'FOLLOW-UP'];
const LEADS_KEY = 'followforge.leads.v1';
const SETTINGS_KEY = 'followforge.settings.v1';
const SEEDED_KEY = 'followforge.seeded.v1';

const DEFAULT_SETTINGS = {
  businessName: 'Devign FollowForge',
  businessPhone: '',
  defaultTemplate:
    "Hi [Name], just following up regarding your [Service] enquiry. Please let me know if you'd like to proceed or if you have any questions.",
  templates: {
    initial:
      "Hi [Name], just following up regarding your [Service] enquiry. Please let me know if you'd like to proceed or if you have any questions.",
    quote:
      "Hi [Name], just checking in regarding the quote we sent for [Service]. Please let me know if you'd like to go ahead or if you have any questions.",
    final:
      "Hi [Name], just checking in one last time regarding your [Service] enquiry. If you'd still like to proceed, feel free to let me know."
  }
};

/* -------------------------------------------------------------------- utils */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function shiftDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 'overdue' | 'today' | 'upcoming' | 'none' */
function dueBucket(isoDate) {
  if (!isoDate) return 'none';
  const t = todayISO();
  if (isoDate < t) return 'overdue';
  if (isoDate === t) return 'today';
  return 'upcoming';
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return 'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function uid() {
  return 'ld_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 2200);
}

/* --------------------------------------------------------- storage & state */

const state = {
  leads: [],
  settings: structuredClone(DEFAULT_SETTINGS),
  view: 'dashboard',
  search: '',
  filterStatus: 'ALL',
  filterDate: 'ALL',
  waLeadId: null
};

function loadLeads() {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Could not read leads', err);
    return [];
  }
}

function saveLeads() {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(state.leads));
  } catch (err) {
    console.error('Could not save leads', err);
    showToast('Storage unavailable — changes may be lost');
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...parsed,
      templates: { ...DEFAULT_SETTINGS.templates, ...(parsed.templates || {}) }
    };
  } catch (err) {
    console.error('Could not read settings', err);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function getLead(id) {
  return state.leads.find((lead) => lead.id === id) || null;
}

function upsertLead(data) {
  const now = new Date().toISOString();
  if (data.id) {
    const lead = getLead(data.id);
    if (!lead) return null;
    Object.assign(lead, data, { updatedAt: now });
    saveLeads();
    return lead;
  }
  const lead = {
    id: uid(),
    customerName: '',
    phone: '',
    service: '',
    enquiry: '',
    source: '',
    status: 'NEW',
    quoteAmount: null,
    quoteDate: '',
    followUpDate: '',
    notes: [],
    createdAt: now,
    updatedAt: now,
    ...data
  };
  state.leads.unshift(lead);
  saveLeads();
  return lead;
}

function addNote(leadId, text) {
  const lead = getLead(leadId);
  if (!lead || !text.trim()) return;
  lead.notes.push({ date: todayISO(), text: text.trim() });
  lead.updatedAt = new Date().toISOString();
  saveLeads();
}

function setStatus(leadId, status) {
  const lead = getLead(leadId);
  if (!lead) return;
  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  if (status === 'WON' || status === 'LOST') lead.followUpDate = '';
  saveLeads();
}

function deleteLead(leadId) {
  state.leads = state.leads.filter((lead) => lead.id !== leadId);
  saveLeads();
}

/* ---------------------------------------------------------------- demo data */

function demoLeads() {
  const now = new Date().toISOString();
  const rows = [
    ['Thabo Mokoena', '082 555 1234', 'Plumbing', 'Burst geyser pipe in the ceiling, water coming through.', 'WhatsApp', 'QUOTED', 4850, shiftDays(-6), shiftDays(-3),
      [['-6', 'Sent quote for geyser replacement.'], ['-4', 'Customer asked about warranty.']]],
    ['Lerato Dlamini', '071 402 8890', 'Cleaning', 'Deep clean for a 3 bedroom flat before move-out.', 'Facebook', 'FOLLOW-UP', 1650, shiftDays(-4), shiftDays(-1),
      [['-4', 'Quoted R1 650 including carpets.']]],
    ['Pieter van Wyk', '083 219 7745', 'Roofing', 'Leaking roof above the garage after the storm.', 'Referral', 'QUOTED', 12400, shiftDays(-2), todayISO(),
      [['-2', 'Site visit done, quote sent by email.']]],
    ['Nomsa Khumalo', '060 771 3388', 'Garden services', 'Monthly garden maintenance for a townhouse complex.', 'Phone call', 'CONTACTED', null, '', todayISO(),
      [['-1', 'Called, needs pricing per visit.']]],
    ['Ridwaan Adams', '074 118 6620', 'Electrical', 'DB board keeps tripping when the stove is on.', 'WhatsApp', 'NEW', null, '', shiftDays(1), []],
    ['Sizwe Ncube', '081 336 9042', 'Construction', 'Quote for a 24m² boundary wall extension.', 'Website', 'QUOTED', 38500, shiftDays(-1), shiftDays(3),
      [['-1', 'Quote sent, customer comparing three builders.']]],
    ['Anelisa Jacobs', '079 665 2210', 'Painting', 'Repaint interior of a 2 bedroom house in Parow.', 'Walk-in', 'WON', 9800, shiftDays(-10), '',
      [['-10', 'Quote accepted, deposit paid.']]],
    ['Johan Botha', '072 884 5501', 'Appliance repair', 'Tumble dryer not heating, out of warranty.', 'Phone call', 'LOST', 1250, shiftDays(-12), '',
      [['-12', 'Customer bought a new dryer instead.']]]
  ];

  return rows.map(([customerName, phone, service, enquiry, source, status, quoteAmount, quoteDate, followUpDate, notes]) => ({
    id: uid(),
    customerName,
    phone,
    service,
    enquiry,
    source,
    status,
    quoteAmount,
    quoteDate,
    followUpDate,
    notes: notes.map(([offset, text]) => ({ date: shiftDays(Number(offset)), text })),
    createdAt: now,
    updatedAt: now
  }));
}

function seedDemoData(force) {
  if (!force && localStorage.getItem(SEEDED_KEY)) return;
  state.leads = demoLeads();
  saveLeads();
  localStorage.setItem(SEEDED_KEY, '1');
}

/* ----------------------------------------------------------------- whatsapp */

/** SA-friendly: 0821234567 -> 27821234567 */
function toWaNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0')) return '27' + digits.slice(1);
  return digits;
}

function fillTemplate(template, lead) {
  return String(template || '')
    .replace(/\[Name\]/g, lead.customerName)
    .replace(/\[Service\]/g, lead.service);
}

function suggestedTemplateKey(lead) {
  if (lead.quoteAmount) return 'quote';
  if (lead.status === 'FOLLOW-UP') return 'final';
  return 'initial';
}

function waLink(phone, message) {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;
}

function openWaModal(leadId) {
  const lead = getLead(leadId);
  if (!lead) return;
  state.waLeadId = leadId;

  const key = suggestedTemplateKey(lead);
  $('#waTo').textContent = `To ${lead.customerName} · ${lead.phone}`;
  $('#waMessage').value = fillTemplate(state.settings.templates[key], lead);

  const labels = { initial: 'Initial', quote: 'Quote', final: 'Final', default: 'Default' };
  $('#waTemplates').innerHTML = Object.keys(labels)
    .map(
      (k) =>
        `<button class="chip${k === key ? ' active' : ''}" type="button" data-template="${k}">${labels[k]}</button>`
    )
    .join('');

  openModal('waModal');
}

/* ---------------------------------------------------------------- rendering */

function statusPill(status) {
  return `<span class="pill pill-${status}">${status}</span>`;
}

function duePill(lead) {
  const bucket = dueBucket(lead.followUpDate);
  if (bucket === 'overdue') return `<span class="pill pill-overdue">Overdue ${formatDate(lead.followUpDate)}</span>`;
  if (bucket === 'today') return '<span class="pill pill-today">Due today</span>';
  if (bucket === 'upcoming') return `<span class="pill">Due ${formatDate(lead.followUpDate)}</span>`;
  return '<span class="pill">No follow-up date</span>';
}

function leadCard(lead, options = {}) {
  const amount = lead.quoteAmount ? `<div class="lead-amount">${formatMoney(lead.quoteAmount)}</div>` : '';
  const actions = options.hideActions
    ? ''
    : `<div class="lead-actions">
         <button class="btn btn-wa btn-sm" type="button" data-wa="${lead.id}">Follow up on WhatsApp</button>
         <button class="btn btn-sm" type="button" data-open="${lead.id}">Open</button>
       </div>`;

  return `<article class="card lead-card" data-open="${lead.id}">
    <div class="lead-top">
      <div>
        <div class="lead-name">${escapeHtml(lead.customerName)}</div>
        <div class="lead-meta">${escapeHtml(lead.service)} · ${escapeHtml(lead.phone)}</div>
      </div>
      ${amount}
    </div>
    <div class="tagline">${statusPill(lead.status)}${duePill(lead)}</div>
    ${actions}
  </article>`;
}

function emptyState(message) {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

function renderList(container, leads, emptyMessage) {
  container.innerHTML = leads.length
    ? leads.map((lead) => leadCard(lead)).join('')
    : emptyState(emptyMessage);
}

function byFollowUpDate(a, b) {
  return (a.followUpDate || '9999').localeCompare(b.followUpDate || '9999');
}

function followUpBuckets() {
  const active = state.leads.filter((lead) => OPEN_STATUSES.includes(lead.status) && lead.followUpDate);
  return {
    overdue: active.filter((lead) => dueBucket(lead.followUpDate) === 'overdue').sort(byFollowUpDate),
    today: active.filter((lead) => dueBucket(lead.followUpDate) === 'today').sort(byFollowUpDate),
    upcoming: active.filter((lead) => dueBucket(lead.followUpDate) === 'upcoming').sort(byFollowUpDate)
  };
}

function renderDashboard() {
  const buckets = followUpBuckets();
  $('#statOverdue').textContent = buckets.overdue.length;
  $('#statToday').textContent = buckets.today.length;
  $('#statUpcoming').textContent = buckets.upcoming.length;

  const attention = buckets.today.concat(buckets.overdue);
  $('#dashAttention').innerHTML = attention.length
    ? attention.map((lead) => leadCard(lead)).join('')
    : emptyState('No follow-ups due today. Nothing overdue either.');

  const quotes = state.leads
    .filter((lead) => lead.quoteAmount && ['QUOTED', 'FOLLOW-UP'].includes(lead.status))
    .sort(byFollowUpDate);
  $('#dashQuotes').innerHTML = quotes.length
    ? quotes.map((lead) => leadCard(lead)).join('')
    : emptyState('No quotes waiting for follow-up.');

  $('#dashPipeline').innerHTML = STATUSES.map((status) => {
    const count = state.leads.filter((lead) => lead.status === status).length;
    return `<button class="pipe-cell" type="button" data-status-jump="${status}">
        <div class="pipe-count">${count}</div>
        <div class="pipe-label">${status}</div>
      </button>`;
  }).join('');

  const quotedValue = state.leads
    .filter((lead) => lead.quoteAmount)
    .reduce((sum, lead) => sum + Number(lead.quoteAmount), 0);
  const pipelineValue = state.leads
    .filter((lead) => lead.quoteAmount && OPEN_STATUSES.includes(lead.status))
    .reduce((sum, lead) => sum + Number(lead.quoteAmount), 0);
  const wonValue = state.leads
    .filter((lead) => lead.quoteAmount && lead.status === 'WON')
    .reduce((sum, lead) => sum + Number(lead.quoteAmount), 0);

  $('#valQuoted').textContent = formatMoney(quotedValue);
  $('#valPipeline').textContent = formatMoney(pipelineValue);
  $('#valWon').textContent = formatMoney(wonValue);

  const badge = $('#tabBadge');
  const dueCount = buckets.overdue.length + buckets.today.length;
  badge.textContent = dueCount;
  badge.classList.toggle('hidden', dueCount === 0);
}

function renderFollowUps() {
  const buckets = followUpBuckets();
  renderList($('#fuOverdue'), buckets.overdue, 'No overdue follow-ups.');
  renderList($('#fuToday'), buckets.today, 'No follow-ups due today.');
  renderList($('#fuUpcoming'), buckets.upcoming, 'No upcoming follow-ups scheduled.');
}

function filteredLeads() {
  const term = state.search.trim().toLowerCase();
  return state.leads.filter((lead) => {
    if (state.filterStatus !== 'ALL' && lead.status !== state.filterStatus) return false;
    if (state.filterDate !== 'ALL' && dueBucket(lead.followUpDate) !== state.filterDate.toLowerCase()) return false;
    if (!term) return true;
    return [lead.customerName, lead.phone, lead.service]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });
}

function renderLeads() {
  renderList($('#leadList'), filteredLeads(), 'No leads found.');
}

function renderPipeline() {
  $('#pipelineBoard').innerHTML = STATUSES.map((status) => {
    const leads = state.leads.filter((lead) => lead.status === status).sort(byFollowUpDate);
    const body = leads.length
      ? `<div class="list">${leads.map((lead) => leadCard(lead, { hideActions: true })).join('')}</div>`
      : emptyState(`No leads in ${status}.`);
    return `<section class="pipe-group">
        <div class="pipe-group-head"><h3>${status}</h3><span class="pill">${leads.length}</span></div>
        ${body}
      </section>`;
  }).join('');
}

function renderSettings() {
  const form = $('#settingsForm');
  form.businessName.value = state.settings.businessName;
  form.businessPhone.value = state.settings.businessPhone;
  form.defaultTemplate.value = state.settings.defaultTemplate;
  form.tpl_initial.value = state.settings.templates.initial;
  form.tpl_quote.value = state.settings.templates.quote;
  form.tpl_final.value = state.settings.templates.final;
}

function renderDetail(leadId) {
  const lead = getLead(leadId);
  if (!lead) return;

  const notes = lead.notes.length
    ? lead.notes
        .map(
          (note) =>
            `<div class="note-item"><span class="note-date">${formatDate(note.date)}</span>${escapeHtml(note.text)}</div>`
        )
        .join('')
    : '<p class="empty">No notes yet.</p>';

  $('#detailTitle').textContent = lead.customerName;
  $('#detailBody').innerHTML = `
    <div class="detail-section">
      <h3>Customer</h3>
      <div class="detail-row"><span>Name</span><span>${escapeHtml(lead.customerName)}</span></div>
      <div class="detail-row"><span>Phone</span><span><a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a></span></div>
    </div>
    <div class="detail-section">
      <h3>Job</h3>
      <div class="detail-row"><span>Service</span><span>${escapeHtml(lead.service)}</span></div>
      <div class="detail-row"><span>Enquiry</span><span>${escapeHtml(lead.enquiry)}</span></div>
      <div class="detail-row"><span>Source</span><span>${escapeHtml(lead.source || '—')}</span></div>
    </div>
    <div class="detail-section">
      <h3>Quote</h3>
      <div class="detail-row"><span>Amount</span><span>${lead.quoteAmount ? formatMoney(lead.quoteAmount) : '—'}</span></div>
      <div class="detail-row"><span>Quote date</span><span>${formatDate(lead.quoteDate)}</span></div>
    </div>
    <div class="detail-section">
      <h3>Follow-up</h3>
      <div class="detail-row"><span>Status</span><span>${statusPill(lead.status)}</span></div>
      <div class="detail-row"><span>Follow-up date</span><span>${formatDate(lead.followUpDate)}</span></div>
      <input class="input" type="date" id="detailFollowUp" value="${lead.followUpDate || ''}" aria-label="Set follow-up date">
    </div>
    <div class="detail-section">
      <h3>Notes</h3>
      <div class="notes-list">${notes}</div>
      <textarea class="input" id="detailNote" rows="2" placeholder="Add a note"></textarea>
      <button class="btn btn-block btn-sm" type="button" id="detailAddNote" style="margin-top:8px">Add note</button>
    </div>
    <div class="detail-section">
      <h3>Status</h3>
      <select class="input" id="detailStatus" aria-label="Change status">
        ${STATUSES.map((s) => `<option value="${s}"${s === lead.status ? ' selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="detail-section">
      <h3>Actions</h3>
      <div class="action-grid">
        <button class="btn btn-wa full" type="button" data-wa="${lead.id}">Follow up on WhatsApp</button>
        <button class="btn" type="button" id="detailEdit">Edit</button>
        <button class="btn" type="button" id="detailWon">Mark Won</button>
        <button class="btn" type="button" id="detailLost">Mark Lost</button>
        <button class="btn btn-danger" type="button" id="detailDelete">Delete</button>
      </div>
    </div>`;

  $('#detailFollowUp').addEventListener('change', (event) => {
    upsertLead({ id: lead.id, followUpDate: event.target.value });
    renderAll();
    renderDetail(lead.id);
    showToast('Follow-up date saved');
  });
  $('#detailAddNote').addEventListener('click', () => {
    const text = $('#detailNote').value;
    if (!text.trim()) return;
    addNote(lead.id, text);
    renderDetail(lead.id);
    showToast('Note added');
  });
  $('#detailStatus').addEventListener('change', (event) => {
    setStatus(lead.id, event.target.value);
    renderAll();
    renderDetail(lead.id);
    showToast(`Status: ${event.target.value}`);
  });
  $('#detailEdit').addEventListener('click', () => {
    closeModal('detailModal');
    openLeadForm(lead.id);
  });
  $('#detailWon').addEventListener('click', () => {
    setStatus(lead.id, 'WON');
    renderAll();
    renderDetail(lead.id);
    showToast('Marked as Won');
  });
  $('#detailLost').addEventListener('click', () => {
    setStatus(lead.id, 'LOST');
    renderAll();
    renderDetail(lead.id);
    showToast('Marked as Lost');
  });
  $('#detailDelete').addEventListener('click', () => {
    if (!confirm(`Delete ${lead.customerName}? This cannot be undone.`)) return;
    deleteLead(lead.id);
    closeModal('detailModal');
    renderAll();
    showToast('Lead deleted');
  });

  openModal('detailModal');
}

function renderAll() {
  $('#businessName').textContent = state.settings.businessName || 'Devign FollowForge';
  renderDashboard();
  renderFollowUps();
  renderLeads();
  renderPipeline();
}

/* ------------------------------------------------------------ view & modals */

function setView(view) {
  state.view = view;
  $$('.view').forEach((section) => section.classList.toggle('hidden', section.id !== `view-${view}`));
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  window.scrollTo(0, 0);
}

function openModal(id) {
  $(`#${id}`).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(`#${id}`).classList.add('hidden');
  if (!$$('.modal:not(.hidden)').length) document.body.style.overflow = '';
}

function openLeadForm(leadId) {
  const form = $('#leadForm');
  form.reset();
  const lead = leadId ? getLead(leadId) : null;

  $('#leadModalTitle').textContent = lead ? 'Edit lead' : 'New lead';
  form.id.value = lead ? lead.id : '';
  if (lead) {
    form.customerName.value = lead.customerName;
    form.phone.value = lead.phone;
    form.service.value = lead.service;
    form.enquiry.value = lead.enquiry;
    form.source.value = lead.source || '';
    form.status.value = lead.status;
    form.quoteAmount.value = lead.quoteAmount || '';
    form.quoteDate.value = lead.quoteDate || '';
    form.followUpDate.value = lead.followUpDate || '';
  } else {
    form.status.value = 'NEW';
    form.followUpDate.value = shiftDays(2);
  }
  openModal('leadModal');
  form.customerName.focus();
}

/* ------------------------------------------------------------------- events */

function handleLeadFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    customerName: form.customerName.value.trim(),
    phone: form.phone.value.trim(),
    service: form.service.value.trim(),
    enquiry: form.enquiry.value.trim(),
    source: form.source.value,
    status: form.status.value,
    quoteAmount: form.quoteAmount.value ? Number(form.quoteAmount.value) : null,
    quoteDate: form.quoteDate.value,
    followUpDate: form.followUpDate.value
  };
  if (form.id.value) data.id = form.id.value;

  const lead = upsertLead(data);
  if (lead && form.note.value.trim()) addNote(lead.id, form.note.value);

  closeModal('leadModal');
  renderAll();
  showToast(data.id ? 'Lead updated' : 'Lead added');
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  const form = event.target;
  state.settings = {
    businessName: form.businessName.value.trim() || DEFAULT_SETTINGS.businessName,
    businessPhone: form.businessPhone.value.trim(),
    defaultTemplate: form.defaultTemplate.value.trim() || DEFAULT_SETTINGS.defaultTemplate,
    templates: {
      initial: form.tpl_initial.value.trim() || DEFAULT_SETTINGS.templates.initial,
      quote: form.tpl_quote.value.trim() || DEFAULT_SETTINGS.templates.quote,
      final: form.tpl_final.value.trim() || DEFAULT_SETTINGS.templates.final
    }
  };
  saveSettings();
  renderAll();
  showToast('Settings saved');
}

function handleGlobalClick(event) {
  const waBtn = event.target.closest('[data-wa]');
  if (waBtn) {
    event.stopPropagation();
    openWaModal(waBtn.dataset.wa);
    return;
  }

  const openBtn = event.target.closest('[data-open]');
  if (openBtn) {
    renderDetail(openBtn.dataset.open);
    return;
  }

  const closeBtn = event.target.closest('[data-close-modal]');
  if (closeBtn) {
    closeModal(closeBtn.dataset.closeModal);
    return;
  }

  const tab = event.target.closest('.tab');
  if (tab) {
    setView(tab.dataset.view);
    return;
  }

  const jump = event.target.closest('[data-jump]');
  if (jump) {
    setView('followups');
    return;
  }

  const statusJump = event.target.closest('[data-status-jump]');
  if (statusJump) {
    state.filterStatus = statusJump.dataset.statusJump;
    $('#filterStatus').value = state.filterStatus;
    renderLeads();
    setView('leads');
    return;
  }

  const chip = event.target.closest('[data-template]');
  if (chip) {
    const lead = getLead(state.waLeadId);
    if (!lead) return;
    const key = chip.dataset.template;
    const template = key === 'default' ? state.settings.defaultTemplate : state.settings.templates[key];
    $('#waMessage').value = fillTemplate(template, lead);
    $$('#waTemplates .chip').forEach((c) => c.classList.toggle('active', c === chip));
    return;
  }

  if (event.target.classList.contains('modal')) closeModal(event.target.id);
}

function bindEvents() {
  document.addEventListener('click', handleGlobalClick);

  $('#btnNewLead').addEventListener('click', () => openLeadForm(null));
  $('#leadForm').addEventListener('submit', handleLeadFormSubmit);
  $('#settingsForm').addEventListener('submit', handleSettingsSubmit);

  $('#waOpen').addEventListener('click', () => {
    const lead = getLead(state.waLeadId);
    if (!lead) return;
    window.open(waLink(lead.phone, $('#waMessage').value), '_blank', 'noopener');
    closeModal('waModal');
  });

  $('#searchInput').addEventListener('input', (event) => {
    state.search = event.target.value;
    renderLeads();
  });
  $('#filterStatus').addEventListener('change', (event) => {
    state.filterStatus = event.target.value;
    renderLeads();
  });
  $('#filterDate').addEventListener('change', (event) => {
    state.filterDate = event.target.value;
    renderLeads();
  });

  $('#btnLoadDemo').addEventListener('click', () => {
    if (!confirm('Replace all current leads with demo data?')) return;
    seedDemoData(true);
    renderAll();
    showToast('Demo data loaded');
  });
  $('#btnClearData').addEventListener('click', () => {
    if (!confirm('Delete all leads from this browser? This cannot be undone.')) return;
    state.leads = [];
    saveLeads();
    renderAll();
    showToast('All leads cleared');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    $$('.modal:not(.hidden)').forEach((modal) => closeModal(modal.id));
  });
}

/* --------------------------------------------------------------------- init */

function populateStatusSelects() {
  $('#leadFormStatus').innerHTML = STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('');
  const filter = $('#filterStatus');
  filter.innerHTML =
    '<option value="ALL">All statuses</option>' +
    STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('');
}

function init() {
  state.settings = loadSettings();
  state.leads = loadLeads();
  if (!state.leads.length) seedDemoData(false);
  populateStatusSelects();
  renderSettings();
  bindEvents();
  renderAll();
  setView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
