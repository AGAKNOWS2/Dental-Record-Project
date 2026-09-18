const storageKey = 'carelog-patients';
const seedPatients = [
  { id: 1, name: 'Maya Thompson', address: '18 Willow Lane, Portland', telephone: '(555) 014-2288', age: 34, occupation: 'Teacher', status: 'Active' },
  { id: 2, name: 'Robert Chen', address: '72 Cedar Street, Austin', telephone: '(555) 016-9041', age: 61, occupation: 'Architect', status: 'Follow-up' },
  { id: 3, name: 'Nadia Williams', address: '4 Harbor View, Seattle', telephone: '(555) 019-3320', age: 27, occupation: 'Designer', status: 'Active' },
  { id: 4, name: 'James Osei', address: '91 Maple Road, Denver', telephone: '(555) 011-7604', age: 49, occupation: 'Engineer', status: 'Archived' }
];

let patients = JSON.parse(localStorage.getItem(storageKey) || 'null') || seedPatients;
const tableBody = document.querySelector('#patientTableBody');
const emptyState = document.querySelector('#emptyState');
const modalBackdrop = document.querySelector('#modalBackdrop');
const patientForm = document.querySelector('#patientForm');
const searchInput = document.querySelector('#searchInput');
const statusFilter = document.querySelector('#statusFilter');
const entriesBody = document.querySelector('#entriesBody');
let editingPatientId = null;

const initials = (name) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

function savePatients() {
  localStorage.setItem(storageKey, JSON.stringify(patients));
}

function updateStats() {
  document.querySelector('#totalCount').textContent = patients.length;
  document.querySelector('#activeCount').textContent = patients.filter((patient) => patient.status === 'Active').length;
  document.querySelector('#followUpCount').textContent = patients.filter((patient) => patient.status === 'Follow-up').length;
  document.querySelector('#archivedCount').textContent = patients.filter((patient) => patient.status === 'Archived').length;
}

function renderPatients() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const filteredPatients = patients.filter((patient) => {
    const searchableText = `${patient.name} ${patient.address} ${patient.telephone} ${patient.occupation}`.toLowerCase();
    return searchableText.includes(query) && (selectedStatus === 'all' || patient.status === selectedStatus);
  });

  tableBody.innerHTML = filteredPatients.map((patient) => {
    const statusClass = patient.status.toLowerCase().replace('-', '-');
    return `<tr class="fade-in">
      <td><div class="patient-name"><span class="avatar">${escapeHtml(initials(patient.name))}</span><span>${escapeHtml(patient.name)}<small class="patient-address">${escapeHtml(patient.address)}</small></span></div></td>
      <td><span class="contact-line">${escapeHtml(patient.telephone)}</span></td>
      <td>${escapeHtml(patient.age)}</td>
      <td>${escapeHtml(patient.occupation || '—')}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(patient.status)}</span></td>
      <td><button class="action-button" type="button" data-edit="${patient.id}" aria-label="Edit ${escapeHtml(patient.name)}">⋮</button></td>
    </tr>`;
  }).join('');

  emptyState.hidden = filteredPatients.length !== 0;
  tableBody.parentElement.hidden = filteredPatients.length === 0;
  updateStats();
}

function readEntryRows() {
  return [...entriesBody.querySelectorAll('[data-entry-row]')].map((row) => ({
    date: row.querySelector('[data-entry-field="date"]').value,
    description: row.querySelector('[data-entry-field="description"]').value.trim(),
    price: row.querySelector('[data-entry-field="price"]').value,
    breakdown: row.querySelector('[data-entry-field="breakdown"]').value.trim()
  }));
}

function renderEntryRows(entries = []) {
  const rows = entries.length ? entries : [{}];
  entriesBody.innerHTML = rows.map((entry, index) => `<tr data-entry-row>
    <td><input class="entry-input" data-entry-field="date" type="date" value="${escapeHtml(entry.date || '')}" aria-label="Entry ${index + 1} date"></td>
    <td><input class="entry-input" data-entry-field="description" type="text" value="${escapeHtml(entry.description || '')}" placeholder="e.g. Consultation" aria-label="Entry ${index + 1} description"></td>
    <td><input class="entry-input entry-price" data-entry-field="price" type="number" min="0" step="0.01" value="${escapeHtml(entry.price || '')}" placeholder="₱0.00" aria-label="Entry ${index + 1} price in Philippine pesos"></td>
    <td><input class="entry-input" data-entry-field="breakdown" type="text" value="${escapeHtml(entry.breakdown || '')}" placeholder="e.g. ₱4,500 visit + ₱1,000 supplies" aria-label="Entry ${index + 1} price breakdown"></td>
    <td><button class="entry-remove" type="button" data-remove-entry="${index}" aria-label="Remove entry ${index + 1}">×</button></td>
  </tr>`).join('');
}

function openForm(patient = null) {
  editingPatientId = patient ? patient.id : null;
  document.querySelector('#formTitle').textContent = patient ? 'Edit patient record' : 'Add a new patient';
  if (patient) {
    Object.entries(patient).forEach(([field, value]) => {
      if (patientForm.elements[field]) patientForm.elements[field].value = value;
    });
  }
  renderEntryRows(patient?.entries || []);
  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  patientForm.elements.name.focus();
}

function closeForm() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = '';
  patientForm.reset();
  editingPatientId = null;
  document.querySelector('#formTitle').textContent = 'Add a new patient';
}

document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date());
document.querySelector('#openFormButton').addEventListener('click', openForm);
document.querySelector('#emptyAddButton').addEventListener('click', openForm);
document.querySelector('#closeFormButton').addEventListener('click', closeForm);
document.querySelector('#cancelFormButton').addEventListener('click', closeForm);
document.querySelector('#addEntryButton').addEventListener('click', () => renderEntryRows([...readEntryRows(), {}]));
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeForm(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modalBackdrop.hidden) closeForm(); });
searchInput.addEventListener('input', renderPatients);
statusFilter.addEventListener('change', renderPatients);

tableBody.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit]');
  if (!editButton) return;
  const patient = patients.find((item) => item.id === Number(editButton.dataset.edit));
  if (patient) openForm(patient);
});

entriesBody.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-entry]');
  if (!removeButton) return;
  const rows = readEntryRows();
  rows.splice(Number(removeButton.dataset.removeEntry), 1);
  renderEntryRows(rows);
});

patientForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(patientForm);
  const updatedPatient = {
    id: editingPatientId || Date.now(),
    name: formData.get('name').trim(),
    address: formData.get('address').trim(),
    telephone: formData.get('telephone').trim(),
    age: Number(formData.get('age')),
    occupation: formData.get('occupation').trim(),
    status: formData.get('status'),
    entries: readEntryRows().filter((entry) => Object.values(entry).some((value) => value !== ''))
  };
  if (editingPatientId) {
    patients = patients.map((patient) => patient.id === editingPatientId ? updatedPatient : patient);
  } else {
    patients.unshift(updatedPatient);
  }
  savePatients();
  renderPatients();
  closeForm();
});

renderPatients();
