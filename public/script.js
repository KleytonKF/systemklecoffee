const state = {
  user: null,
  machines: [],
  clients: [],
  events: [],
  products: [],
  payments: [],
  saleItems: []
};

const el = (selector) => document.querySelector(selector);
const els = (selector) => [...document.querySelectorAll(selector)];

function showToast(message, isError = false) {
  const toast = el('#toast');
  toast.textContent = message;
  toast.style.background = isError ? '#8f2d1e' : '#231815';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2600);
}

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '-';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

async function checkAuth() {
  try {
    state.user = await api('/api/me');
    openApp();
    await loadAllData();
  } catch {
    openLogin();
  }
}

function openLogin() {
  el('#loginScreen').classList.remove('hidden');
  el('#appScreen').classList.add('hidden');
}

function openApp() {
  el('#loginScreen').classList.add('hidden');
  el('#appScreen').classList.remove('hidden');
  el('#userLabel').textContent = `${state.user.name} · ${state.user.email}`;
}

function setupTabs() {
  els('.menu-link').forEach(btn => {
    btn.addEventListener('click', () => {
      els('.menu-link').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      els('.tab-section').forEach(section => section.classList.remove('active'));
      el(`#${btn.dataset.tab}`).classList.add('active');
      el('#tabTitle').textContent = btn.textContent;
    });
  });
}

async function loadAllData() {
  await Promise.all([
    loadDashboard(),
    loadMachines(),
    loadClients(),
    loadEvents(),
    loadProducts(),
    loadPayments(),
    loadAvailableMachines()
  ]);
  buildReferences();
}

async function loadDashboard() {
  const data = await api('/api/dashboard');
  el('#totalMachines').textContent = data.totals.machines;
  el('#totalClients').textContent = data.totals.fixedClients;
  el('#totalEvents').textContent = data.totals.events;
  el('#totalRevenue').textContent = currency(data.totals.revenue);

  el('#maintenanceList').innerHTML = data.maintenanceAlerts.length
    ? data.maintenanceAlerts.map(item => `<div class="notice-item"><strong>${item.brand} ${item.model}</strong><div>Série: ${item.serial_number}</div><div>Próxima manutenção: ${formatDate(item.next_maintenance)}</div></div>`).join('')
    : '<div class="notice-item">Nenhum alerta de manutenção.</div>';

  el('#lowStockList').innerHTML = data.lowStock.length
    ? data.lowStock.map(item => `<div class="notice-item"><strong>${item.name}</strong><div>Estoque: ${item.stock_quantity}</div><div>Alerta: ${item.low_stock_alert}</div></div>`).join('')
    : '<div class="notice-item">Nenhum produto com estoque baixo.</div>';

  el('#recentPaymentsBody').innerHTML = data.recentPayments.length
    ? data.recentPayments.map(item => `<tr><td>${formatDate(item.payment_date)}</td><td>${item.customer_name}</td><td>${item.payment_type}</td><td>${currency(item.amount)}</td><td>${item.method}</td></tr>`).join('')
    : '<tr><td colspan="5">Sem pagamentos registrados.</td></tr>';
}

async function loadMachines() {
  state.machines = await api('/api/machines');
  el('#machinesList').innerHTML = state.machines.length
    ? state.machines.map(machine => `
      <article class="item-card">
        ${machine.photo_url ? `<img src="${machine.photo_url}" alt="Máquina">` : '<img alt="Sem foto">'}
        <div class="item-content">
          <h4>${machine.brand} ${machine.model}</h4>
          <p><strong>Série:</strong> ${machine.serial_number}</p>
          <p><strong>Valor:</strong> ${currency(machine.value)}</p>
          <p><strong>Status:</strong> ${machine.status}</p>
          <p><strong>Última manutenção:</strong> ${formatDate(machine.last_maintenance)}</p>
          <p><strong>Próxima manutenção:</strong> ${formatDate(machine.next_maintenance)}</p>
          <p><strong>Alocada para:</strong> ${machine.allocated_to || 'Livre'}</p>
        </div>
      </article>
    `).join('')
    : '<div class="notice-item">Nenhuma máquina cadastrada.</div>';
}

async function loadAvailableMachines() {
  const available = await api('/api/machines/available');
  const options = '<option value="">Máquina disponível</option>' + available.map(m => `<option value="${m.id}">${m.brand} ${m.model} · ${m.serial_number}</option>`).join('');
  el('#clientMachineSelect').innerHTML = options;
  el('#eventMachineSelect').innerHTML = '<option value="">Máquina</option>' + available.map(m => `<option value="${m.id}">${m.brand} ${m.model} · ${m.serial_number}</option>`).join('');
}

async function loadClients() {
  state.clients = await api('/api/clients');
  el('#clientsBody').innerHTML = state.clients.length
    ? state.clients.map(client => `<tr><td>${client.corporate_name}</td><td>${client.contact_name}</td><td>${client.client_type}</td><td>${client.brand ? `${client.brand} ${client.model}` : '-'}</td><td>${client.monthly_fee ? currency(client.monthly_fee) : '-'}</td></tr>`).join('')
    : '<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>';
}

async function loadEvents() {
  state.events = await api('/api/events');
  el('#eventsBody').innerHTML = state.events.length
    ? state.events.map(event => `<tr><td>${event.title}</td><td>${event.corporate_name}</td><td>${formatDate(event.start_date)}</td><td>${event.location || '-'}</td><td>${event.status}</td></tr>`).join('')
    : '<tr><td colspan="5">Nenhum evento cadastrado.</td></tr>';
}

async function loadProducts() {
  state.products = await api('/api/products');
  el('#productsList').innerHTML = state.products.length
    ? state.products.map(product => `
      <article class="item-card">
        ${product.photo_url ? `<img src="${product.photo_url}" alt="Produto">` : '<img alt="Sem foto">'}
        <div class="item-content">
          <h4>${product.name}</h4>
          <p><strong>SKU:</strong> ${product.sku || '-'}</p>
          <p><strong>Estoque:</strong> ${product.stock_quantity}</p>
          <p><strong>Compra:</strong> ${currency(product.purchase_price)}</p>
          <p><strong>Venda:</strong> ${currency(product.sale_price)}</p>
          <p><strong>Margem:</strong> ${product.margin_percent || 0}%</p>
          <p><strong>Alerta:</strong> ${product.low_stock_alert}</p>
        </div>
      </article>
    `).join('')
    : '<div class="notice-item">Nenhum produto cadastrado.</div>';
}

async function loadPayments() {
  state.payments = await api('/api/payments');
  el('#paymentsBody').innerHTML = state.payments.length
    ? state.payments.map(payment => `<tr><td>${formatDate(payment.payment_date)}</td><td>${payment.customer_name}</td><td>${payment.payment_type}</td><td>${currency(payment.amount)}</td><td>${payment.method}</td></tr>`).join('')
    : '<tr><td colspan="5">Nenhum pagamento registrado.</td></tr>';
}

function buildReferences() {
  el('#eventClientSelect').innerHTML = '<option value="">Selecione o cliente</option>' + state.clients.map(c => `<option value="${c.id}">${c.corporate_name} · ${c.contact_name}</option>`).join('');
  const paymentType = el('#paymentTypeSelect').value;
  refreshPaymentReferences(paymentType);
  el('#saleProductSelect').innerHTML = '<option value="">Produto</option>' + state.products.map(p => `<option value="${p.id}" data-price="${p.sale_price}">${p.name} · estoque ${p.stock_quantity}</option>`).join('');
}

function refreshPaymentReferences(type) {
  let options = '<option value="">Referência</option>';
  if (type === 'cliente_fixo') {
    options += state.clients.filter(c => c.client_type === 'fixo').map(c => `<option value="${c.id}" data-name="${c.corporate_name}">${c.corporate_name}</option>`).join('');
  } else if (type === 'evento') {
    options += state.events.map(e => `<option value="${e.id}" data-name="${e.title}">${e.title} · ${e.corporate_name}</option>`).join('');
  } else {
    options += '<option value="">Venda avulsa</option>';
  }
  el('#paymentReferenceSelect').innerHTML = options;
  el('#saleItemsBox').classList.toggle('hidden', type !== 'venda_produto');
}

function setupLogin() {
  el('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const payload = Object.fromEntries(form.entries());
      const data = await api('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      state.user = data.user;
      openApp();
      await loadAllData();
      showToast('Login realizado');
    } catch (error) {
      showToast(error.message, true);
    }
  });

  el('#logoutBtn').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    openLogin();
  });
}

function setupForms() {
  el('#machineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/machines', { method: 'POST', body: new FormData(e.target) });
      e.target.reset();
      showToast('Máquina cadastrada');
      await loadDashboard();
      await loadMachines();
      await loadAvailableMachines();
    } catch (error) { showToast(error.message, true); }
  });

  el('#clientTypeSelect').addEventListener('change', (e) => {
    const monthly = el('input[name="monthly_fee"]');
    monthly.disabled = e.target.value === 'evento';
    if (monthly.disabled) monthly.value = '';
  });

  el('#clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const payload = Object.fromEntries(form.entries());
      await api('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      e.target.reset();
      showToast('Cliente cadastrado');
      await loadAllData();
    } catch (error) { showToast(error.message, true); }
  });

  el('#eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const payload = Object.fromEntries(form.entries());
      await api('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      e.target.reset();
      showToast('Evento cadastrado');
      await loadAllData();
    } catch (error) { showToast(error.message, true); }
  });

  el('#productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/products', { method: 'POST', body: new FormData(e.target) });
      e.target.reset();
      showToast('Produto cadastrado');
      await loadAllData();
    } catch (error) { showToast(error.message, true); }
  });

  el('#paymentTypeSelect').addEventListener('change', (e) => refreshPaymentReferences(e.target.value));
  el('#paymentReferenceSelect').addEventListener('change', (e) => {
    const selected = e.target.selectedOptions[0];
    if (selected?.dataset?.name) el('input[name="customer_name"]').value = selected.dataset.name;
  });
  el('#saleProductSelect').addEventListener('change', (e) => {
    const selected = e.target.selectedOptions[0];
    if (selected?.dataset?.price) el('#saleUnitPrice').value = selected.dataset.price;
  });

  el('#addSaleItemBtn').addEventListener('click', () => {
    const productId = el('#saleProductSelect').value;
    const productName = el('#saleProductSelect').selectedOptions[0]?.textContent;
    const quantity = Number(el('#saleQty').value);
    const unitPrice = Number(el('#saleUnitPrice').value);
    if (!productId || !quantity || !unitPrice) return showToast('Preencha produto, quantidade e valor unitário', true);
    state.saleItems.push({ product_id: Number(productId), product_name: productName, quantity, unit_price: unitPrice });
    renderSaleItems();
    const total = state.saleItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    el('input[name="amount"]').value = total.toFixed(2);
    el('#saleQty').value = '';
  });

  el('#paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const payload = Object.fromEntries(form.entries());
      if (payload.payment_type === 'venda_produto') payload.items = state.saleItems;
      await api('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      e.target.reset();
      state.saleItems = [];
      renderSaleItems();
      refreshPaymentReferences(el('#paymentTypeSelect').value);
      showToast('Pagamento registrado');
      await loadAllData();
    } catch (error) { showToast(error.message, true); }
  });
}

function renderSaleItems() {
  const box = el('#saleItemsList');
  box.innerHTML = state.saleItems.length
    ? state.saleItems.map((item, index) => `<div class="sale-row"><span>${item.product_name} · ${item.quantity} x ${currency(item.unit_price)}</span><button class="btn secondary" type="button" data-remove-sale="${index}">Remover</button></div>`).join('')
    : '<div class="notice-item">Nenhum item adicionado.</div>';

  box.querySelectorAll('[data-remove-sale]').forEach(button => {
    button.addEventListener('click', () => {
      state.saleItems.splice(Number(button.dataset.removeSale), 1);
      renderSaleItems();
      const total = state.saleItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      el('input[name="amount"]').value = total ? total.toFixed(2) : '';
    });
  });
}

setupTabs();
setupLogin();
setupForms();
checkAuth();
