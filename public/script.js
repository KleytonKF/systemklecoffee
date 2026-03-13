const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logoutButton');
const currentUserName = document.getElementById('currentUserName');
const currentUserRole = document.getElementById('currentUserRole');

const tabs = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.tab');
const pageTitle = document.getElementById('page-title');
const pageDescription = document.getElementById('page-description');
const apiStatus = document.getElementById('api-status');
const machineForm = document.getElementById('machine-form');
const machineFormMessage = document.getElementById('form-message');
const machinesTable = document.getElementById('machines-table');
const ultimasMaquinas = document.getElementById('ultimasMaquinas');
const totalUsuarios = document.getElementById('totalUsuarios');

const userForm = document.getElementById('user-form');
const userFormMessage = document.getElementById('user-form-message');
const usersTable = document.getElementById('users-table');

let currentUser = null;

function switchTab(tabName) {
  tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  sections.forEach(section => section.classList.toggle('active', section.id === tabName));

  if (tabName === 'dashboard') {
    pageTitle.textContent = 'Dashboard';
    pageDescription.textContent = 'Acompanhe rapidamente o panorama das máquinas da KleCoffee.';
    return;
  }

  if (tabName === 'maquinas') {
    pageTitle.textContent = 'Máquinas';
    pageDescription.textContent = 'Cadastre, visualize e acompanhe todas as máquinas da operação.';
    return;
  }

  pageTitle.textContent = 'Usuários';
  pageDescription.textContent = 'Crie novos acessos e acompanhe os usuários cadastrados no sistema.';
}

tabs.forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

function normalizeStatus(status) {
  if (status === 'Disponível') return 'disponivel';
  if (status === 'Em uso') return 'emuso';
  return 'manutencao';
}

function showLogin() {
  loginView.style.display = 'grid';
  appView.style.display = 'none';
}

function showApp() {
  loginView.style.display = 'none';
  appView.style.display = 'block';
}

function setCurrentUser(usuario) {
  currentUser = usuario;
  currentUserName.textContent = usuario?.nome || '-';
  currentUserRole.textContent = usuario?.perfil || '-';

  const isAdmin = usuario?.perfil === 'Administrador';
  document.querySelector('[data-tab="usuarios"]').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('usuarios').style.display = isAdmin ? '' : 'none';

  if (!isAdmin && document.querySelector('.menu-item.active')?.dataset.tab === 'usuarios') {
    switchTab('dashboard');
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível concluir a solicitação.');
  }

  return data;
}

async function checkApi() {
  try {
    const data = await fetchJson('/api/health', { headers: {} });
    apiStatus.textContent = data.message;
  } catch (_error) {
    apiStatus.textContent = 'Falha na conexão com a API';
  }
}

async function loadDashboard() {
  try {
    const data = await fetchJson('/api/dashboard');

    document.getElementById('totalMaquinas').textContent = data.totalMaquinas;
    document.getElementById('disponiveis').textContent = data.disponiveis;
    document.getElementById('emUso').textContent = data.emUso;
    document.getElementById('manutencao').textContent = data.manutencao;
    totalUsuarios.textContent = data.totalUsuarios;

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
    ultimasMaquinas.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function loadMachines() {
  try {
    const data = await fetchJson('/api/maquinas');

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
  } catch (error) {
    machinesTable.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function loadUsers() {
  if (currentUser?.perfil !== 'Administrador') {
    usersTable.innerHTML = '<div class="empty-state">Apenas administradores podem visualizar os usuários.</div>';
    return;
  }

  try {
    const data = await fetchJson('/api/usuarios');

    if (!data.length) {
      usersTable.innerHTML = '<div class="empty-state">Nenhum usuário cadastrado.</div>';
      return;
    }

    usersTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(user => `
            <tr>
              <td>${user.nome}</td>
              <td>${user.email}</td>
              <td><span class="badge neutral-badge">${user.perfil}</span></td>
              <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    usersTable.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = 'Entrando...';
  loginMessage.className = 'form-message';

  const payload = Object.fromEntries(new FormData(loginForm).entries());

  try {
    const data = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setCurrentUser(data.usuario);
    showApp();
    loginForm.reset();
    await initializeAppData();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = 'form-message error';
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await fetchJson('/api/auth/logout', { method: 'POST' });
  } catch (_error) {
    // ignora e volta para o login mesmo assim
  }

  currentUser = null;
  showLogin();
});

machineForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  machineFormMessage.textContent = 'Salvando...';
  machineFormMessage.className = 'form-message';

  const payload = Object.fromEntries(new FormData(machineForm).entries());

  try {
    await fetchJson('/api/maquinas', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    machineForm.reset();
    machineFormMessage.textContent = 'Máquina cadastrada com sucesso.';
    machineFormMessage.className = 'form-message success';
    await Promise.all([loadMachines(), loadDashboard()]);
  } catch (error) {
    machineFormMessage.textContent = error.message;
    machineFormMessage.className = 'form-message error';
  }
});

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  userFormMessage.textContent = 'Criando usuário...';
  userFormMessage.className = 'form-message';

  const payload = Object.fromEntries(new FormData(userForm).entries());

  try {
    await fetchJson('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    userForm.reset();
    userFormMessage.textContent = 'Usuário criado com sucesso.';
    userFormMessage.className = 'form-message success';
    await Promise.all([loadUsers(), loadDashboard()]);
  } catch (error) {
    userFormMessage.textContent = error.message;
    userFormMessage.className = 'form-message error';
  }
});

async function deleteMachine(id) {
  if (!confirm('Deseja realmente excluir esta máquina?')) return;

  try {
    await fetchJson(`/api/maquinas/${id}`, { method: 'DELETE' });
    await Promise.all([loadMachines(), loadDashboard()]);
  } catch (error) {
    alert(error.message);
  }
}

async function initializeAppData() {
  switchTab('dashboard');
  await Promise.all([checkApi(), loadDashboard(), loadMachines(), loadUsers()]);
}

async function bootstrap() {
  try {
    const data = await fetchJson('/api/auth/me', { headers: {} });
    setCurrentUser(data.usuario);
    showApp();
    await initializeAppData();
  } catch (_error) {
    showLogin();
  }
}

window.deleteMachine = deleteMachine;
bootstrap();
