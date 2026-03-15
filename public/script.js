
const state = {
  usuarioLogado: null,
  maquinas: [],
  produtos: [],
  clientes: [],
  eventos: [],
  pagamentos: [],
  usuarios: [],
  configuracoes: {},
  charts: {}
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBr = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR') : '-';

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options
  });
  if (response.status === 401) {
    showLogin();
    throw new Error('Sessão expirada');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

function atualizarData() {
  $('#currentDate').textContent = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function showLogin() {
  $('#loginPage').style.display = 'flex';
  $('#mainApp').classList.remove('active');
}

function showMain() {
  $('#loginPage').style.display = 'none';
  $('#mainApp').classList.add('active');
  $('#userName').textContent = state.usuarioLogado.nome;
  $('#userGreeting').textContent = state.usuarioLogado.nome.split(' ')[0];
  atualizarData();
}

function getLogoStatus() {
  api('/api/logo-status').then(data => {
    $('#menuLogo').style.display = data.exists ? 'block' : 'none';
  }).catch(() => {});
}

async function carregarBootstrap() {
  const data = await api('/api/bootstrap');
  state.maquinas = data.maquinas || [];
  state.produtos = normalizeProdutos(data.produtos || []);
  state.clientes = normalizeClientes(data.clientes || []);
  state.eventos = normalizeEventos(data.eventos || []);
  state.pagamentos = normalizePagamentos(data.pagamentos || []);
  state.usuarios = data.usuarios || [];
  state.configuracoes = data.configuracoes || {};
  fillConfig();
  atualizarSelects();
  renderAll(data.dashboard);
}

function normalizeProdutos(produtos) {
  return produtos.map(p => ({ ...p, valorCompra: p.valor_compra ?? p.valorCompra, valorVenda: p.valor_venda ?? p.valorVenda }));
}
function normalizeClientes(clientes) {
  return clientes.map(c => ({
    ...c,
    razaoSocial: c.razao_social ?? c.razaoSocial,
    nomeCompleto: c.nome_completo ?? c.nomeCompleto,
    valorLocacao: c.valor_locacao ?? c.valorLocacao ?? 0
  }));
}
function normalizeEventos(eventos) {
  return eventos.map(e => ({
    ...e,
    clienteId: e.clienteId ?? e.cliente_id,
    nomeEvento: e.nomeEvento ?? e.nome_evento,
    dataInicio: e.dataInicio ?? e.data_inicio,
    dataFim: e.dataFim ?? e.data_fim
  }));
}
function normalizePagamentos(items) {
  return items.map(p => ({
    ...p,
    clienteId: p.clienteId ?? p.cliente_id,
    eventoId: p.eventoId ?? p.evento_id,
    produtoId: p.produtoId ?? p.produto_id
  }));
}

function fillConfig() {
  $('#tempoSessao').value = state.configuracoes.tempo_sessao ?? state.configuracoes.tempoSessao ?? 30;
  $('#maxTentativas').value = state.configuracoes.max_tentativas ?? state.configuracoes.maxTentativas ?? 3;
  $('#exigirSenhaForte').checked = Boolean(state.configuracoes.exigir_senha_forte ?? state.configuracoes.exigirSenhaForte);
}

function setActivePage(pageId) {
  $$('.page').forEach(p => p.classList.remove('active-page'));
  $(`#${pageId}`).classList.add('active-page');
  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === pageId));
}

function bindNav() {
  $$('.nav-item').forEach(item => item.addEventListener('click', () => setActivePage(item.dataset.page)));
}

function calcularMargem() {
  const compra = parseFloat($('#valorCompra').value) || 0;
  const venda = parseFloat($('#valorVenda').value) || 0;
  $('#margemLucro').value = compra > 0 ? (((venda - compra) / compra) * 100).toFixed(1) : '';
}

function atualizarSelects() {
  const maqHtml = state.maquinas.map(m => `
    <div class="multi-select-item" data-selectable>
      <input type="checkbox" name="clienteMaquinas" value="${m.id}" id="cli-maq-${m.id}">
      <label for="cli-maq-${m.id}">${m.marca} ${m.modelo}</label>
    </div>`).join('');
  $('#clienteMaquinasContainer').innerHTML = maqHtml;

  $('#clienteOrganizador').innerHTML = '<option value="">Selecione...</option>' + state.clientes.map(c => `<option value="${c.id}">${c.razaoSocial}</option>`).join('');
  $('#clientePagamento').innerHTML = '<option value="">Selecione...</option>' + state.clientes.filter(c=>c.tipo==='fixo').map(c => `<option value="${c.id}" data-valor="${c.valorLocacao || 0}">${c.razaoSocial}</option>`).join('');
  $('#eventoPagamento').innerHTML = '<option value="">Selecione...</option>' + state.eventos.map(e => `<option value="${e.id}">${e.nomeEvento}</option>`).join('');
  $('#produtoVenda').innerHTML = '<option value="">Selecione...</option>' + state.produtos.map(p => `<option value="${p.id}" data-preco="${p.valorVenda}" data-estoque="${p.quantidade}">${p.nome} (Estoque: ${p.quantidade})</option>`).join('');

  $('#eventoMaquinasContainer').innerHTML = state.maquinas.map(m => `
    <div class="multi-select-item" data-selectable>
      <input type="checkbox" name="eventoMaquinas" value="${m.id}" id="evt-maq-${m.id}" data-valor="${m.valor}">
      <label for="evt-maq-${m.id}">${m.marca} ${m.modelo} - ${moeda(m.valor)}</label>
    </div>`).join('');

  $('#insumosContainer').innerHTML = state.produtos.map(p => `
    <div class="insumo-item" data-selectable>
      <div style="flex:1">
        <strong>${p.nome}</strong><br>
        <small>${moeda(p.valorVenda)} | Estoque: ${p.quantidade}</small>
      </div>
      <input type="number" class="insumo-qtd" data-id="${p.id}" data-preco="${p.valorVenda}" min="0" max="${p.quantidade}" value="0">
    </div>`).join('');

  $$('input[name="eventoMaquinas"], .insumo-qtd').forEach(el => el.addEventListener('input', calcularResumoEvento));
  $$('input[name="eventoMaquinas"]').forEach(el => el.addEventListener('change', calcularResumoEvento));
  $$('[data-selectable]').forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    const qty = row.querySelector('.insumo-qtd');
    if (checkbox) {
      checkbox.addEventListener('change', () => row.classList.toggle('selected', checkbox.checked));
      row.classList.toggle('selected', checkbox.checked);
    }
    if (qty) {
      const syncQty = () => row.classList.toggle('selected', Number(qty.value || 0) > 0);
      qty.addEventListener('input', syncQty);
      syncQty();
    }
  });
}

function calcularResumoEvento() {
  const valorMaquinas = $$('input[name="eventoMaquinas"]:checked').reduce((t, cb) => t + Number(cb.dataset.valor || 0), 0);
  const valorInsumos = $$('.insumo-qtd').reduce((t, input) => t + (Number(input.value || 0) * Number(input.dataset.preco || 0)), 0);
  $$('[data-selectable]').forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    const qty = row.querySelector('.insumo-qtd');
    if (checkbox) row.classList.toggle('selected', checkbox.checked);
    if (qty) row.classList.toggle('selected', Number(qty.value || 0) > 0);
  });
  $('#resumoMaquinas').textContent = moeda(valorMaquinas);
  $('#resumoInsumos').textContent = moeda(valorInsumos);
  $('#resumoTotal').textContent = moeda(valorMaquinas + valorInsumos);
}

function getPagamentoNome(p) {
  if (p.tipo === 'cliente') return state.clientes.find(c => c.id === p.clienteId)?.razaoSocial || 'Cliente';
  if (p.tipo === 'evento') return state.eventos.find(e => e.id === p.eventoId)?.nomeEvento || 'Evento';
  return state.produtos.find(pr => pr.id === p.produtoId)?.nome || 'Produto';
}

function getEventoTotal(e) {
  let total = (e.maquinas || []).reduce((t, id) => t + Number(state.maquinas.find(m => m.id === id)?.valor || 0), 0);
  total += (e.insumos || []).reduce((t, i) => t + (Number(state.produtos.find(p => p.id === i.id)?.valorVenda || 0) * Number(i.quantidade || 0)), 0);
  return total;
}

function renderDashboard(dashboard = null) {
  const receitaTotal = state.pagamentos.reduce((t, p) => t + Number(p.valor || 0), 0);
  const ticket = state.pagamentos.length ? receitaTotal / state.pagamentos.length : 0;
  $('#totalMaquinasDashboard').textContent = state.maquinas.length;
  $('#totalClientesDashboard').textContent = state.clientes.length;
  $('#totalEventosDashboard').textContent = state.eventos.length;
  $('#totalProdutosDashboard').textContent = state.produtos.length;
  $('#totalPagamentosDashboard').textContent = state.pagamentos.length;
  $('#estoqueBaixoDashboard').textContent = state.produtos.filter(p => p.quantidade < 20).length;
  $('#receitaTotalDashboard').textContent = moeda(receitaTotal);
  $('#ticketMedioDashboard').textContent = moeda(ticket);

  const recentes = (dashboard?.ultimosPagamentos || state.pagamentos).slice(0,5);
  $('#ultimosPagamentos').innerHTML = recentes.map(p => `
    <tr>
      <td><strong>${getPagamentoNome(p)}</strong></td>
      <td>${p.tipo}</td>
      <td>${p.descricao}</td>
      <td>${moeda(p.valor)}</td>
      <td>${dataBr(p.data)}</td>
      <td><span class="badge ${badgeStatus(p.status)}">${p.status}</span></td>
    </tr>`).join('') || `<tr><td colspan="6">Nenhum pagamento</td></tr>`;

  const pagamentosPorMes = dashboard?.pagamentosPorMes || [];
  const receitasPorTipo = dashboard?.receitasPorTipo || [];
  const eventosPorStatus = dashboard?.eventosPorStatus || [];

  createOrUpdateChart('graficoLinha', 'line', {
    labels: pagamentosPorMes.map(i => i.mes),
    datasets: [{ label: 'Pagamentos', data: pagamentosPorMes.map(i => i.total), borderColor: '#E0400D', backgroundColor: 'rgba(224,64,13,0.1)', tension: .35, fill: true }]
  }, { plugins: { legend: { display: false } } });

  createOrUpdateChart('graficoPizza', 'doughnut', {
    labels: receitasPorTipo.map(i => i.tipo),
    datasets: [{ data: receitasPorTipo.map(i => i.total), backgroundColor: ['#E0400D','#F57C4A','#FAA67B','#FFD7C7'] }]
  }, { cutout: '65%' });

  createOrUpdateChart('graficoStatus', 'bar', {
    labels: eventosPorStatus.map(i => i.status),
    datasets: [{ label: 'Eventos', data: eventosPorStatus.map(i => i.total), backgroundColor: ['#f59e0b','#3b82f6','#22c55e'] }]
  }, { plugins: { legend: { display: false } } });
}

function createOrUpdateChart(id, type, data, extraOptions = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (state.charts[id]) state.charts[id].destroy();
  const safeData = { ...data };
  if (!safeData.labels || !safeData.labels.length) {
    safeData.labels = ['Sem dados'];
    safeData.datasets = (safeData.datasets || []).map(ds => ({ ...ds, data: [0] }));
  }
  state.charts[id] = new Chart(ctx, {
    type,
    data: safeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: { legend: { labels: { usePointStyle: true, boxWidth: 10 } }, tooltip: { padding: 10 }, ...(extraOptions.plugins || {}) },
      scales: type === 'doughnut' ? {} : { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.12)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } },
      ...extraOptions
    }
  });
}

function badgeStatus(status) {
  return status === 'pago' || status === 'concluido' ? 'badge-success'
    : status === 'parcial' || status === 'proximo' ? 'badge-warning'
    : status === 'andamento' ? 'badge-info'
    : 'badge-danger';
}

function renderMaquinas() {
  $('#statsMaquinas').textContent = `${state.maquinas.length} máquinas`;
  $('#listaMaquinasContainer').innerHTML = state.maquinas.map(m => `
    <tr>
      <td><div class="maquina-img-large">${m.imagem ? `<img src="${m.imagem}" alt="">` : '<i class="fas fa-coffee"></i>'}</div></td>
      <td><strong>${m.marca} ${m.modelo}</strong></td>
      <td><span class="badge badge-info">${m.sn}</span></td>
      <td><strong>${moeda(m.valor)}</strong></td>
      <td><span class="badge ${Number(m.valor) > 400 ? 'badge-purple' : Number(m.valor) > 200 ? 'badge-info' : 'badge-success'}">${Number(m.valor) > 400 ? 'Premium' : Number(m.valor) > 200 ? 'Padrão' : 'Econômica'}</span></td>
      <td class="acoes-cell">
        <button class="btn-icon" onclick="window.verDetalhes('maquina', ${m.id})"><i class="fas fa-eye"></i></button>
        <button class="btn-icon" onclick="window.editarRegistro('maquina', ${m.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="window.excluirRegistro('maquina', ${m.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6">Nenhuma máquina cadastrada.</td></tr>`;
}

function renderClientes() {
  $('#statsClientes').textContent = `${state.clientes.length} clientes`;
  $('#listaClientesContainer').innerHTML = state.clientes.map(c => {
    const nomesMaquinas = (c.maquinas || []).map(id => state.maquinas.find(m => m.id === id)?.marca).filter(Boolean).join(', ');
    return `
      <tr>
        <td><strong>${c.razaoSocial}</strong><br><small>${c.email}</small></td>
        <td><span class="badge ${c.tipo === 'fixo' ? 'badge-success' : 'badge-info'}">${c.tipo}</span></td>
        <td>${c.contato}<br><small>${c.nomeCompleto}</small></td>
        <td>${c.cidade}/${c.uf}</td>
        <td>${(c.maquinas || []).length} máquinas<br><small>${nomesMaquinas || '-'}</small></td>
        <td>${c.tipo === 'fixo' ? moeda(c.valorLocacao || 0) : '-'}</td>
        <td class="acoes-cell">
          <button class="btn-icon" onclick="window.verDetalhes('cliente', ${c.id})"><i class="fas fa-eye"></i></button>
          <button class="btn-icon" onclick="window.editarRegistro('cliente', ${c.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="window.excluirRegistro('cliente', ${c.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="7">Nenhum cliente cadastrado.</td></tr>`;
}

function renderEventos() {
  $('#statsEventos').textContent = `${state.eventos.length} eventos`;
  $('#listaEventosContainer').innerHTML = state.eventos.map(e => `
    <tr>
      <td><strong>${e.nomeEvento}</strong></td>
      <td>${state.clientes.find(c => c.id === e.clienteId)?.razaoSocial || '-'}</td>
      <td>${dataBr(e.dataInicio)}<br><small>até ${dataBr(e.dataFim)}</small></td>
      <td>${e.cidade}/${e.uf}</td>
      <td>${(e.maquinas || []).length} máquinas</td>
      <td><strong>${moeda(getEventoTotal(e))}</strong></td>
      <td><span class="badge ${badgeStatus(e.status)}">${e.status}</span></td>
      <td class="acoes-cell">
        <button class="btn-icon" onclick="window.verDetalhes('evento', ${e.id})"><i class="fas fa-eye"></i></button>
        <button class="btn-icon" onclick="window.editarRegistro('evento', ${e.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="window.excluirRegistro('evento', ${e.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="8">Nenhum evento cadastrado.</td></tr>`;
}

function renderProdutos() {
  $('#statsProdutos').textContent = `${state.produtos.length} produtos`;
  $('#listaProdutosContainer').innerHTML = state.produtos.map(p => {
    const lucro = Number(p.valorVenda) - Number(p.valorCompra);
    const percent = Math.min((Number(p.quantidade) / 100) * 100, 100);
    return `
      <div class="produto-card-moderno">
        <div class="produto-header-moderno">
          <div class="produto-img-large">${p.imagem ? `<img src="${p.imagem}" alt="">` : '<i class="fas fa-box"></i>'}</div>
          <div class="produto-info-moderno">
            <h4>${p.nome}</h4>
            <div class="produto-precos-moderno">
              <span class="preco-compra-moderno">Compra: ${moeda(p.valorCompra)}</span>
              <span class="preco-venda-moderno">Venda: ${moeda(p.valorVenda)}</span>
            </div>
            <div class="produto-detalhes">
              <span class="produto-badge"><i class="fas fa-chart-line"></i> Lucro: ${moeda(lucro)}</span>
              <span class="produto-badge"><i class="fas fa-percent"></i> ${Number(p.margem).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div><strong>Estoque:</strong> ${p.quantidade} un
          <div class="estoque-indicator"><div class="estoque-bar" style="width:${percent}%"></div></div>
        </div>
        <div class="acoes-cell" style="justify-content:flex-end;margin-top:.85rem">
          <button class="btn-icon" onclick="window.verDetalhes('produto', ${p.id})"><i class="fas fa-eye"></i></button>
          <button class="btn-icon" onclick="window.editarRegistro('produto', ${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="window.excluirRegistro('produto', ${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }).join('') || '<div>Nenhum produto cadastrado.</div>';
}

function renderPagamentos() {
  $('#statsPagamentos').textContent = `${state.pagamentos.length} pagamentos`;
  $('#historicoPagamentos').innerHTML = state.pagamentos.map(p => `
    <tr>
      <td><strong>${getPagamentoNome(p)}</strong></td>
      <td>${p.tipo}</td>
      <td>${p.descricao}</td>
      <td><strong>${moeda(p.valor)}</strong></td>
      <td>${dataBr(p.data)}</td>
      <td><span class="badge ${badgeStatus(p.status)}">${p.status}</span></td>
      <td class="acoes-cell">
        <button class="btn-icon" onclick="window.verDetalhes('pagamento', ${p.id})"><i class="fas fa-eye"></i></button>
        <button class="btn-icon" onclick="window.editarRegistro('pagamento', ${p.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="window.excluirRegistro('pagamento', ${p.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7">Nenhum pagamento cadastrado.</td></tr>`;
}

function renderUsuarios() {
  $('#statsUsuarios').textContent = `${state.usuarios.length} usuários`;
  $('#listaUsuariosContainer').innerHTML = state.usuarios.map(u => `
    <tr>
      <td><strong>@${u.usuario}</strong></td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.nivel === 'admin' ? 'badge-purple' : u.nivel === 'gerente' ? 'badge-info' : 'badge-success'}">${u.nivel}</span></td>
      <td><span class="badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}">${u.status}</span></td>
      <td class="acoes-cell">
        <button class="btn-icon" onclick="window.editarRegistro('usuario', ${u.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="window.excluirRegistro('usuario', ${u.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6">Nenhum usuário cadastrado.</td></tr>`;
}

function renderAll(dashboard = null) {
  renderDashboard(dashboard);
  renderMaquinas();
  renderClientes();
  renderEventos();
  renderProdutos();
  renderPagamentos();
  renderUsuarios();
}

function clienteDetalhes(c) {
  const maquinas = (c.maquinas || []).map(id => state.maquinas.find(m => m.id === id)).filter(Boolean);
  return `
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Razão Social / Nome</span><span class="info-value">${c.razaoSocial}</span></div>
      <div class="info-item"><span class="info-label">Tipo</span><span class="info-value">${c.tipo}</span></div>
      <div class="info-item"><span class="info-label">CNPJ / CPF</span><span class="info-value">${c.cnpj}</span></div>
      <div class="info-item"><span class="info-label">Responsável</span><span class="info-value">${c.nomeCompleto}</span></div>
      <div class="info-item"><span class="info-label">CPF</span><span class="info-value">${c.cpf}</span></div>
      <div class="info-item"><span class="info-label">Contato</span><span class="info-value">${c.contato}</span></div>
      <div class="info-item"><span class="info-label">Email</span><span class="info-value">${c.email}</span></div>
      <div class="info-item"><span class="info-label">Logradouro</span><span class="info-value">${c.logradouro}</span></div>
      <div class="info-item"><span class="info-label">Número</span><span class="info-value">${c.numero}</span></div>
      <div class="info-item"><span class="info-label">Complemento</span><span class="info-value">${c.complemento || '-'}</span></div>
      <div class="info-item"><span class="info-label">Bairro</span><span class="info-value">${c.bairro}</span></div>
      <div class="info-item"><span class="info-label">Cidade / UF</span><span class="info-value">${c.cidade}/${c.uf}</span></div>
      <div class="info-item"><span class="info-label">CEP</span><span class="info-value">${c.cep}</span></div>
      <div class="info-item"><span class="info-label">Valor Locação</span><span class="info-value">${c.tipo === 'fixo' ? moeda(c.valorLocacao) : '-'}</span></div>
      <div class="info-item" style="grid-column:1/-1"><span class="info-label">Máquinas vinculadas</span><span class="info-value">${maquinas.length ? maquinas.map(m => `${m.marca} ${m.modelo}`).join(', ') : 'Nenhuma'}</span></div>
    </div>`;
}

window.verDetalhes = function(tipo, id) {
  let html = '', title = 'Detalhes';
  if (tipo === 'maquina') {
    const m = state.maquinas.find(i => i.id === id);
    title = 'Detalhes da Máquina';
    html = `<div class="info-grid">
      <div class="info-item"><span class="info-label">Marca</span><span class="info-value">${m.marca}</span></div>
      <div class="info-item"><span class="info-label">Modelo</span><span class="info-value">${m.modelo}</span></div>
      <div class="info-item"><span class="info-label">Nº Série</span><span class="info-value">${m.sn}</span></div>
      <div class="info-item"><span class="info-label">Valor</span><span class="info-value">${moeda(m.valor)}</span></div>
    </div>`;
  }
  if (tipo === 'cliente') {
    title = 'Detalhes do Cliente';
    html = clienteDetalhes(state.clientes.find(i => i.id === id));
  }
  if (tipo === 'evento') {
    const e = state.eventos.find(i => i.id === id);
    title = 'Detalhes do Evento';
    html = `<div class="info-grid">
      <div class="info-item"><span class="info-label">Evento</span><span class="info-value">${e.nomeEvento}</span></div>
      <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${state.clientes.find(c => c.id === e.clienteId)?.razaoSocial || '-'}</span></div>
      <div class="info-item"><span class="info-label">Data início</span><span class="info-value">${dataBr(e.dataInicio)}</span></div>
      <div class="info-item"><span class="info-label">Data fim</span><span class="info-value">${dataBr(e.dataFim)}</span></div>
      <div class="info-item"><span class="info-label">Local</span><span class="info-value">${e.logradouro}, ${e.numero} - ${e.cidade}/${e.uf}</span></div>
      <div class="info-item"><span class="info-label">Status</span><span class="info-value">${e.status}</span></div>
      <div class="info-item" style="grid-column:1/-1"><span class="info-label">Observações</span><span class="info-value">${e.observacoes || '-'}</span></div>
    </div>`;
  }
  if (tipo === 'produto') {
    const p = state.produtos.find(i => i.id === id);
    title = 'Detalhes do Produto';
    html = `<div class="info-grid">
      <div class="info-item"><span class="info-label">Nome</span><span class="info-value">${p.nome}</span></div>
      <div class="info-item"><span class="info-label">Estoque</span><span class="info-value">${p.quantidade}</span></div>
      <div class="info-item"><span class="info-label">Compra</span><span class="info-value">${moeda(p.valorCompra)}</span></div>
      <div class="info-item"><span class="info-label">Venda</span><span class="info-value">${moeda(p.valorVenda)}</span></div>
      <div class="info-item"><span class="info-label">Margem</span><span class="info-value">${Number(p.margem).toFixed(1)}%</span></div>
      <div class="info-item"><span class="info-label">Lucro unitário</span><span class="info-value">${moeda(Number(p.valorVenda)-Number(p.valorCompra))}</span></div>
    </div>`;
  }
  if (tipo === 'pagamento') {
    const p = state.pagamentos.find(i => i.id === id);
    title = 'Detalhes do Pagamento';
    html = `<div class="info-grid">
      <div class="info-item"><span class="info-label">Referência</span><span class="info-value">${getPagamentoNome(p)}</span></div>
      <div class="info-item"><span class="info-label">Tipo</span><span class="info-value">${p.tipo}</span></div>
      <div class="info-item"><span class="info-label">Descrição</span><span class="info-value">${p.descricao}</span></div>
      <div class="info-item"><span class="info-label">Valor</span><span class="info-value">${moeda(p.valor)}</span></div>
      <div class="info-item"><span class="info-label">Data</span><span class="info-value">${dataBr(p.data)}</span></div>
      <div class="info-item"><span class="info-label">Status</span><span class="info-value">${p.status}</span></div>
    </div>`;
  }
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modalView').classList.add('active');
};

let editContext = null;
window.editarRegistro = function(tipo, id) {
  editContext = { tipo, id };
  let html = '', title = 'Editar';
  if (tipo === 'maquina') {
    const m = state.maquinas.find(i => i.id === id);
    title = 'Editar Máquina';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Marca</label><input id="editMarca" value="${m.marca}"></div>
        <div class="form-group"><label>Modelo</label><input id="editModelo" value="${m.modelo}"></div>
        <div class="form-group"><label>Nº Série</label><input id="editSn" value="${m.sn}"></div>
        <div class="form-group"><label>Valor</label><input id="editValor" type="number" step="0.01" value="${m.valor}"></div>
        <div class="form-group"><label>Imagem</label><input id="editImagem" value="${m.imagem || ''}"></div>
      </div>`;
  }
  if (tipo === 'cliente') {
    const c = state.clientes.find(i => i.id === id);
    title = 'Editar Cliente';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Razão Social</label><input id="editRazaoSocial" value="${c.razaoSocial}"></div>
        <div class="form-group"><label>CNPJ / CPF</label><input id="editCnpj" value="${c.cnpj}"></div>
        <div class="form-group"><label>Responsável</label><input id="editNomeCompleto" value="${c.nomeCompleto}"></div>
        <div class="form-group"><label>CPF</label><input id="editCpf" value="${c.cpf}"></div>
        <div class="form-group"><label>Contato</label><input id="editContato" value="${c.contato}"></div>
        <div class="form-group"><label>Email</label><input id="editEmail" value="${c.email}"></div>
        <div class="form-group"><label>Logradouro</label><input id="editLogradouro" value="${c.logradouro}"></div>
        <div class="form-group"><label>Número</label><input id="editNumero" value="${c.numero}"></div>
        <div class="form-group"><label>Complemento</label><input id="editComplemento" value="${c.complemento || ''}"></div>
        <div class="form-group"><label>Bairro</label><input id="editBairro" value="${c.bairro}"></div>
        <div class="form-group"><label>Cidade</label><input id="editCidade" value="${c.cidade}"></div>
        <div class="form-group"><label>UF</label><input id="editUf" value="${c.uf}"></div>
        <div class="form-group"><label>CEP</label><input id="editCep" value="${c.cep}"></div>
        <div class="form-group"><label>Valor Locação</label><input id="editValorLocacao" type="number" step="0.01" value="${c.valorLocacao || ''}"></div>
      </div>`;
  }
  if (tipo === 'evento') {
    const e = state.eventos.find(i => i.id === id);
    title = 'Editar Evento';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Nome</label><input id="editNomeEvento" value="${e.nomeEvento}"></div>
        <div class="form-group"><label>Data início</label><input id="editDataInicio" type="date" value="${e.dataInicio}"></div>
        <div class="form-group"><label>Data fim</label><input id="editDataFim" type="date" value="${e.dataFim}"></div>
        <div class="form-group"><label>Status</label><select id="editStatusEvento">
          <option value="proximo" ${e.status==='proximo'?'selected':''}>próximo</option>
          <option value="andamento" ${e.status==='andamento'?'selected':''}>andamento</option>
          <option value="concluido" ${e.status==='concluido'?'selected':''}>concluido</option>
        </select></div>
      </div>`;
  }
  if (tipo === 'produto') {
    const p = state.produtos.find(i => i.id === id);
    title = 'Editar Produto';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Nome</label><input id="editNomeProduto" value="${p.nome}"></div>
        <div class="form-group"><label>Imagem</label><input id="editImagemProduto" value="${p.imagem || ''}"></div>
        <div class="form-group"><label>Valor Compra</label><input id="editValorCompra" type="number" step="0.01" value="${p.valorCompra}"></div>
        <div class="form-group"><label>Valor Venda</label><input id="editValorVenda" type="number" step="0.01" value="${p.valorVenda}"></div>
        <div class="form-group"><label>Quantidade</label><input id="editQuantidade" type="number" value="${p.quantidade}"></div>
      </div>`;
  }
  if (tipo === 'pagamento') {
    const p = state.pagamentos.find(i => i.id === id);
    title = 'Editar Pagamento';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Descrição</label><input id="editDescricaoPagamento" value="${p.descricao}"></div>
        <div class="form-group"><label>Valor</label><input id="editValorPagamento" type="number" step="0.01" value="${p.valor}"></div>
        <div class="form-group"><label>Data</label><input id="editDataPagamento" type="date" value="${p.data}"></div>
        <div class="form-group"><label>Status</label><select id="editStatusPagamento">
          <option value="pago" ${p.status==='pago'?'selected':''}>pago</option>
          <option value="parcial" ${p.status==='parcial'?'selected':''}>parcial</option>
          <option value="pendente" ${p.status==='pendente'?'selected':''}>pendente</option>
        </select></div>
      </div>`;
  }
  if (tipo === 'usuario') {
    const u = state.usuarios.find(i => i.id === id);
    title = 'Editar Usuário';
    html = `
      <div class="form-row">
        <div class="form-group"><label>Nome</label><input id="editUsuarioNome" value="${u.nome}"></div>
        <div class="form-group"><label>Usuário</label><input id="editUsuarioLogin" value="${u.usuario}"></div>
        <div class="form-group"><label>Email</label><input id="editUsuarioEmail" value="${u.email}"></div>
        <div class="form-group"><label>Nível</label><select id="editUsuarioNivel">
          <option value="admin" ${u.nivel==='admin'?'selected':''}>admin</option>
          <option value="gerente" ${u.nivel==='gerente'?'selected':''}>gerente</option>
          <option value="operador" ${u.nivel==='operador'?'selected':''}>operador</option>
        </select></div>
        <div class="form-group"><label>Status</label><select id="editUsuarioStatus">
          <option value="ativo" ${u.status==='ativo'?'selected':''}>ativo</option>
          <option value="inativo" ${u.status==='inativo'?'selected':''}>inativo</option>
        </select></div>
        <div class="form-group"><label>Nova senha</label><input id="editUsuarioSenha" type="password" placeholder="deixe em branco para manter"></div>
      </div>`;
  }
  $('#modalEditTitle').textContent = title;
  $('#modalEditBody').innerHTML = html;
  $('#modalEdit').classList.add('active');
};

$('#saveEditButton').addEventListener('click', async () => {
  if (!editContext) return;
  const { tipo, id } = editContext;
  try {
    if (tipo === 'maquina') {
      await api(`/api/maquinas/${id}`, { method: 'PUT', body: JSON.stringify({
        marca: $('#editMarca').value, modelo: $('#editModelo').value, sn: $('#editSn').value,
        valor: Number($('#editValor').value), imagem: $('#editImagem').value
      })});
    }
    if (tipo === 'cliente') {
      const original = state.clientes.find(i => i.id === id);
      await api(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify({
        ...original,
        tipo: original.tipo,
        razaoSocial: $('#editRazaoSocial').value,
        cnpj: $('#editCnpj').value,
        nomeCompleto: $('#editNomeCompleto').value,
        cpf: $('#editCpf').value,
        contato: $('#editContato').value,
        email: $('#editEmail').value,
        logradouro: $('#editLogradouro').value,
        numero: $('#editNumero').value,
        complemento: $('#editComplemento').value,
        bairro: $('#editBairro').value,
        cidade: $('#editCidade').value,
        uf: $('#editUf').value,
        cep: $('#editCep').value,
        valorLocacao: Number($('#editValorLocacao').value || 0),
        maquinas: original.maquinas || []
      })});
    }
    if (tipo === 'evento') {
      const original = state.eventos.find(i => i.id === id);
      await api(`/api/eventos/${id}`, { method: 'PUT', body: JSON.stringify({
        ...original,
        nomeEvento: $('#editNomeEvento').value,
        dataInicio: $('#editDataInicio').value,
        dataFim: $('#editDataFim').value,
        status: $('#editStatusEvento').value
      })});
    }
    if (tipo === 'produto') {
      const compra = Number($('#editValorCompra').value);
      const venda = Number($('#editValorVenda').value);
      await api(`/api/produtos/${id}`, { method: 'PUT', body: JSON.stringify({
        nome: $('#editNomeProduto').value,
        imagem: $('#editImagemProduto').value,
        valorCompra: compra,
        valorVenda: venda,
        margem: compra > 0 ? ((venda-compra)/compra)*100 : 0,
        quantidade: Number($('#editQuantidade').value)
      })});
    }
    if (tipo === 'pagamento') {
      const original = state.pagamentos.find(i => i.id === id);
      await api(`/api/pagamentos/${id}`, { method: 'PUT', body: JSON.stringify({
        ...original,
        descricao: $('#editDescricaoPagamento').value,
        valor: Number($('#editValorPagamento').value),
        data: $('#editDataPagamento').value,
        status: $('#editStatusPagamento').value
      })});
    }
    if (tipo === 'usuario') {
      await api(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify({
        nome: $('#editUsuarioNome').value,
        usuario: $('#editUsuarioLogin').value,
        email: $('#editUsuarioEmail').value,
        nivel: $('#editUsuarioNivel').value,
        status: $('#editUsuarioStatus').value,
        senha: $('#editUsuarioSenha').value
      })});
    }
    await carregarBootstrap();
    $('#modalEdit').classList.remove('active');
  } catch (e) { alert(e.message); }
});

window.excluirRegistro = async function(tipo, id) {
  if (!confirm('Tem certeza que deseja excluir este registro?')) return;
  const routes = { maquina:'maquinas', cliente:'clientes', evento:'eventos', produto:'produtos', pagamento:'pagamentos', usuario:'usuarios' };
  try {
    await api(`/api/${routes[tipo]}/${id}`, { method: 'DELETE' });
    await carregarBootstrap();
  } catch (e) { alert(e.message); }
};

function bindModalClose() {
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', () => $('#modalView').classList.remove('active')));
  $$('[data-close-edit]').forEach(b => b.addEventListener('click', () => $('#modalEdit').classList.remove('active')));
  [$('#modalView'), $('#modalEdit')].forEach(modal => modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('active');
  }));
}

function bindTipoCliente() {
  $$('.tipo-option').forEach(opt => opt.addEventListener('click', () => {
    $$('.tipo-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    $('#clienteFixoFields').style.display = opt.dataset.tipo === 'fixo' ? 'block' : 'none';
  }));
}

async function handleLogin() {
  try {
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({
      username: $('#loginUsername').value,
      password: $('#loginPassword').value,
      rememberMe: $('#rememberMe').checked
    })});
    state.usuarioLogado = data.user;
    showMain();
    await carregarBootstrap();
  } catch (e) {
    $('#loginError').textContent = e.message;
    $('#loginError').classList.add('active');
  }
}

async function handleLogout() {
  await api('/api/logout', { method: 'POST' });
  showLogin();
}

async function criarMaquina(e) {
  e.preventDefault();
  await api('/api/maquinas', { method:'POST', body: JSON.stringify({
    marca: $('#marca').value, modelo: $('#modelo').value, sn: $('#sn').value,
    valor: Number($('#valor').value), imagem: $('#imagemUrl').value
  })});
  e.target.reset();
  await carregarBootstrap();
}

async function criarProduto(e) {
  e.preventDefault();
  const compra = Number($('#valorCompra').value);
  const venda = Number($('#valorVenda').value);
  await api('/api/produtos', { method:'POST', body: JSON.stringify({
    nome: $('#nomeProduto').value, imagem: $('#imagemProduto').value,
    valorCompra: compra, valorVenda: venda,
    margem: compra > 0 ? ((venda-compra)/compra)*100 : 0,
    quantidade: Number($('#quantidadeProduto').value)
  })});
  e.target.reset();
  await carregarBootstrap();
}

async function criarCliente(e) {
  e.preventDefault();
  const tipo = $('.tipo-option.active').dataset.tipo;
  const maquinas = tipo === 'fixo' ? $$('input[name="clienteMaquinas"]:checked').map(i => Number(i.value)) : [];
  await api('/api/clientes', { method:'POST', body: JSON.stringify({
    tipo,
    razaoSocial: $('#razaoSocial').value,
    cnpj: $('#cnpj').value,
    nomeCompleto: $('#nomeCompleto').value,
    cpf: $('#cpf').value,
    contato: $('#contato').value,
    email: $('#email').value,
    logradouro: $('#logradouro').value,
    numero: $('#numero').value,
    complemento: $('#complemento').value,
    bairro: $('#bairro').value,
    cidade: $('#cidade').value,
    uf: $('#uf').value,
    cep: $('#cep').value,
    maquinas,
    valorLocacao: Number($('#valorLocacao').value || 0)
  })});
  e.target.reset();
  await carregarBootstrap();
}

async function criarEvento(e) {
  e.preventDefault();
  const maquinas = $$('input[name="eventoMaquinas"]:checked').map(i => Number(i.value));
  const insumos = $$('.insumo-qtd').map(input => ({ id: Number(input.dataset.id), quantidade: Number(input.value || 0) })).filter(i => i.quantidade > 0);
  await api('/api/eventos', { method:'POST', body: JSON.stringify({
    clienteId: Number($('#clienteOrganizador').value),
    nomeEvento: $('#nomeEvento').value,
    dataInicio: $('#dataInicio').value,
    dataFim: $('#dataFim').value,
    logradouro: $('#eventoLogradouro').value,
    numero: $('#eventoNumero').value,
    cidade: $('#eventoCidade').value,
    uf: $('#eventoUf').value,
    maquinas, insumos, status:'proximo', observacoes: $('#observacoes').value
  })});
  e.target.reset();
  await carregarBootstrap();
}

async function criarUsuario(e) {
  e.preventDefault();
  if ($('#usuarioSenha').value !== $('#usuarioConfirmarSenha').value) return alert('As senhas não coincidem.');
  await api('/api/usuarios', { method:'POST', body: JSON.stringify({
    nome: $('#usuarioNome').value,
    usuario: $('#usuarioLogin').value,
    senha: $('#usuarioSenha').value,
    email: $('#usuarioEmail').value,
    nivel: $('#usuarioNivel').value
  })});
  e.target.reset();
  await carregarBootstrap();
}

async function registrarPagamentoCliente() {
  const clienteId = Number($('#clientePagamento').value);
  const descricao = `Mensalidade - ${$('#mesReferencia').value}`;
  await api('/api/pagamentos', { method:'POST', body: JSON.stringify({
    tipo:'cliente', clienteId, descricao,
    valor:Number($('#valorPagamentoCliente').value),
    data:$('#dataPagamentoCliente').value, status:'pago'
  })});
  await carregarBootstrap();
}
async function registrarPagamentoEvento() {
  const eventoId = Number($('#eventoPagamento').value);
  const evento = state.eventos.find(e=>e.id===eventoId);
  const valorTotal = getEventoTotal(evento);
  const valor = Number($('#valorReceberEvento').value);
  await api('/api/pagamentos', { method:'POST', body: JSON.stringify({
    tipo:'evento', eventoId, descricao:`${evento.nomeEvento} - ${valor >= valorTotal ? 'Total' : 'Parcial'}`,
    valor, data:$('#dataPagamentoEvento').value, status: valor >= valorTotal ? 'pago' : 'parcial'
  })});
  await carregarBootstrap();
}
async function registrarVenda() {
  const produtoId = Number($('#produtoVenda').value);
  const quantidade = Number($('#quantidadeVenda').value);
  const produto = state.produtos.find(p=>p.id===produtoId);
  await api('/api/pagamentos', { method:'POST', body: JSON.stringify({
    tipo:'venda', produtoId, quantidade, descricao:`${produto.nome} - ${quantidade} un`,
    valor: Number($('#totalVenda').value), data: $('#dataVenda').value, status:'pago'
  })});
  await carregarBootstrap();
}

function bindPagamentos() {
  $('#tipoPagamento').addEventListener('change', () => {
    const tipo = $('#tipoPagamento').value;
    $('#pagamentoCliente').style.display = tipo === 'cliente' ? 'block' : 'none';
    $('#pagamentoEvento').style.display = tipo === 'evento' ? 'block' : 'none';
    $('#pagamentoVenda').style.display = tipo === 'venda' ? 'block' : 'none';
  });
  $('#clientePagamento').addEventListener('change', () => {
    const option = $('#clientePagamento').selectedOptions[0];
    $('#valorPagamentoCliente').value = option?.dataset.valor || '';
  });
  $('#eventoPagamento').addEventListener('change', () => {
    const evento = state.eventos.find(e => e.id === Number($('#eventoPagamento').value));
    $('#valorTotalEvento').value = evento ? getEventoTotal(evento).toFixed(2) : '';
  });
  $('#produtoVenda').addEventListener('change', () => {
    const option = $('#produtoVenda').selectedOptions[0];
    $('#precoVenda').value = option?.dataset.preco || '';
    calcTotalVenda();
  });
  $('#quantidadeVenda').addEventListener('input', calcTotalVenda);
  $('#registrarPagamentoClienteBtn').addEventListener('click', registrarPagamentoCliente);
  $('#registrarPagamentoEventoBtn').addEventListener('click', registrarPagamentoEvento);
  $('#registrarVendaBtn').addEventListener('click', registrarVenda);
}
function calcTotalVenda() {
  $('#totalVenda').value = ((Number($('#precoVenda').value) || 0) * (Number($('#quantidadeVenda').value) || 0)).toFixed(2);
}

async function salvarConfiguracoes() {
  await api('/api/configuracoes', { method:'PUT', body: JSON.stringify({
    tempoSessao: Number($('#tempoSessao').value),
    maxTentativas: Number($('#maxTentativas').value),
    exigirSenhaForte: $('#exigirSenhaForte').checked
  })});
  await carregarBootstrap();
  alert('Configurações salvas com sucesso.');
}

function bindForms() {
  $('#formMaquina').addEventListener('submit', criarMaquina);
  $('#formProduto').addEventListener('submit', criarProduto);
  $('#formCliente').addEventListener('submit', criarCliente);
  $('#formEvento').addEventListener('submit', criarEvento);
  $('#formUsuario').addEventListener('submit', criarUsuario);
  $('#valorCompra').addEventListener('input', calcularMargem);
  $('#valorVenda').addEventListener('input', calcularMargem);
  $('#salvarConfiguracoesBtn').addEventListener('click', salvarConfiguracoes);
}

async function boot() {
  bindNav();
  bindModalClose();
  bindTipoCliente();
  bindForms();
  bindPagamentos();
  getLogoStatus();
  $('#loginButton').addEventListener('click', handleLogin);
  $('#logoutButton').addEventListener('click', handleLogout);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && $('#loginPage').style.display !== 'none') handleLogin();
  });

  const session = await api('/api/session');
  if (session.user) {
    state.usuarioLogado = session.user;
    showMain();
    await carregarBootstrap();
  } else {
    showLogin();
  }
}

boot();
