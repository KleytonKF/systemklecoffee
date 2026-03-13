const tabs = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.tab');
const pageTitle = document.getElementById('page-title');
const apiStatus = document.getElementById('api-status');
const form = document.getElementById('machine-form');
const formMessage = document.getElementById('form-message');
const machinesTable = document.getElementById('machines-table');
const ultimasMaquinas = document.getElementById('ultimasMaquinas');

function switchTab(tabName) {
  tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  sections.forEach(section => section.classList.toggle('active', section.id === tabName));
  pageTitle.textContent = tabName === 'dashboard' ? 'Dashboard' : 'Máquinas';
}

tabs.forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

function normalizeStatus(status) {
  if (status === 'Disponível') return 'disponivel';
  if (status === 'Em uso') return 'emuso';
  return 'manutencao';
}

async function checkApi() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    apiStatus.textContent = data.message;
  } catch (_error) {
    apiStatus.textContent = 'Falha na conexão com a API';
  }
}

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();

    document.getElementById('totalMaquinas').textContent = data.totalMaquinas;
    document.getElementById('disponiveis').textContent = data.disponiveis;
    document.getElementById('emUso').textContent = data.emUso;
    document.getElementById('manutencao').textContent = data.manutencao;

    const total = Math.max(data.totalMaquinas, 1);
    document.getElementById('barDisponiveis').style.width = `${(data.disponiveis / total) * 100}%`;
    document.getElementById('barEmUso').style.width = `${(data.emUso / total) * 100}%`;
    document.getElementById('barManutencao').style.width = `${(data.manutencao / total) * 100}%`;

    if (!data.ultimas.length) {
      ultimasMaquinas.innerHTML = '<div class="empty-state">Nenhuma máquina cadastrada ainda.</div>';
      return;
    }

    ultimasMaquinas.innerHTML = data.ultimas.map(item => `
      <div class="list-item">
        <h4>${item.nome}</h4>
        <small>${item.marca} • ${item.modelo}</small>
        <div style="margin-top:8px;">
          <span class="badge ${normalizeStatus(item.status_maquina)}">${item.status_maquina}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    ultimasMaquinas.innerHTML = '<div class="empty-state">Não foi possível carregar o dashboard.</div>';
  }
}

async function loadMachines() {
  try {
    const response = await fetch('/api/maquinas');
    const data = await response.json();

    if (!data.length) {
      machinesTable.innerHTML = '<div class="empty-state">Nenhuma máquina cadastrada no momento.</div>';
      return;
    }

    machinesTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Status</th>
            <th>Localização</th>
            <th>Patrimônio</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(machine => `
            <tr>
              <td>${machine.nome}</td>
              <td>${machine.marca}</td>
              <td>${machine.modelo}</td>
              <td><span class="badge ${normalizeStatus(machine.status_maquina)}">${machine.status_maquina}</span></td>
              <td>${machine.localizacao || '-'}</td>
              <td>${machine.patrimonio || '-'}</td>
              <td>
                <button class="delete-btn" onclick="deleteMachine(${machine.id})">Excluir</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (_error) {
    machinesTable.innerHTML = '<div class="empty-state">Erro ao carregar as máquinas.</div>';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = 'Salvando...';
  formMessage.className = 'form-message';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/maquinas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Não foi possível salvar.');
    }

    form.reset();
    formMessage.textContent = 'Máquina cadastrada com sucesso.';
    formMessage.className = 'form-message success';
    await Promise.all([loadMachines(), loadDashboard()]);
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
});

async function deleteMachine(id) {
  if (!confirm('Deseja realmente excluir esta máquina?')) return;

  try {
    const response = await fetch(`/api/maquinas/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir.');
    }

    await Promise.all([loadMachines(), loadDashboard()]);
  } catch (error) {
    alert(error.message);
  }
}

window.deleteMachine = deleteMachine;

checkApi();
loadDashboard();
loadMachines();
