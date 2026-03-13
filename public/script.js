// Dados simulados para teste
const mockData = {
    maquinas: [
        { id: 1, nome: 'Máquina Espresso X1', status: 'active', data: '2024-01-15' },
        { id: 2, nome: 'Máquina Café Filtrado', status: 'active', data: '2024-01-10' },
        { id: 3, nome: 'Máquina Cappuccino', status: 'inactive', data: '2024-01-05' },
    ],
    clientes: [
        { id: 1, nome: 'João Silva', status: 'active', data: '2024-01-20' },
        { id: 2, nome: 'Maria Santos', status: 'active', data: '2024-01-18' },
        { id: 3, nome: 'Pedro Oliveira', status: 'inactive', data: '2024-01-15' },
    ],
    eventos: [
        { id: 1, nome: 'Workshop Café', status: 'active', data: '2024-02-10' },
        { id: 2, nome: 'Degustação', status: 'active', data: '2024-02-05' },
    ],
    estoque: [
        { id: 1, nome: 'Café Arábica', status: 'active', data: '2024-01-25' },
        { id: 2, nome: 'Leite Integral', status: 'active', data: '2024-01-23' },
        { id: 3, nome: 'Cápsulas', status: 'inactive', data: '2024-01-20' },
    ],
    pagamentos: [
        { id: 1, nome: 'Cliente A - Mensalidade', status: 'active', data: '2024-01-30' },
        { id: 2, nome: 'Cliente B - Evento', status: 'active', data: '2024-01-28' },
    ],
    configuracoes: [
        { id: 1, nome: 'Configuração Sistema', status: 'active', data: '2024-01-01' },
    ]
};

// Elementos do DOM
const menuItems = document.querySelectorAll('.menu-item');
const pageTitle = document.getElementById('page-title');
const tableBody = document.getElementById('tableBody');
const totalMaquinas = document.getElementById('totalMaquinas');
const totalClientes = document.getElementById('totalClientes');
const totalEstoque = document.getElementById('totalEstoque');
const totalRecebimentos = document.getElementById('totalRecebimentos');
const btnNovo = document.getElementById('btnNovo');

// Atualizar cards com dados
function atualizarCards() {
    totalMaquinas.textContent = mockData.maquinas.length;
    totalClientes.textContent = mockData.clientes.length;
    totalEstoque.textContent = mockData.estoque.length;
    totalRecebimentos.textContent = 'R$ 1.234,56';
}

// Renderizar tabela baseada na página atual
function renderTable(page) {
    const data = mockData[page] || [];
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.nome}</td>
            <td>
                <span class="status-badge ${item.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${item.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>${item.data}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="editarRegistro(${item.id})">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-action delete" onclick="excluirRegistro(${item.id})">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Trocar de página
function changePage(page) {
    // Atualizar título
    const titles = {
        maquinas: 'Máquinas',
        clientes: 'Clientes',
        eventos: 'Eventos',
        estoque: 'Estoque',
        pagamentos: 'Recebimentos',
        configuracoes: 'Configurações'
    };
    
    pageTitle.textContent = titles[page] || 'Dashboard';
    
    // Atualizar menu ativo
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Renderizar tabela
    renderTable(page);
    
    // Atualizar texto do botão novo
    const btnTexts = {
        maquinas: 'Nova Máquina',
        clientes: 'Novo Cliente',
        eventos: 'Novo Evento',
        estoque: 'Novo Produto',
        pagamentos: 'Novo Recebimento',
        configuracoes: 'Nova Configuração'
    };
    
    const btnNovo = document.getElementById('btnNovo');
    btnNovo.innerHTML = `
        <span class="material-icons">add</span>
        ${btnTexts[page] || 'Novo Registro'}
    `;
}

// Event listeners para menu
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        changePage(page);
    });
});

// Funções de ação (simuladas)
window.editarRegistro = function(id) {
    alert(`Editando registro ${id} - ${pageTitle.textContent}`);
};

window.excluirRegistro = function(id) {
    if (confirm(`Deseja realmente excluir o registro ${id}?`)) {
        alert(`Registro ${id} excluído com sucesso!`);
    }
};

// Botão novo
btnNovo.addEventListener('click', () => {
    const activePage = document.querySelector('.menu-item.active').dataset.page;
    alert(`Criar novo registro em: ${pageTitle.textContent}`);
});

// Testar conexão com o banco
async function testarConexao() {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('Conexão com banco:', data.message);
        if (data.solution === 2) {
            console.log('Banco de dados funcionando corretamente!');
        }
    } catch (error) {
        console.error('Erro ao conectar com o banco:', error);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarCards();
    changePage('maquinas'); // Página inicial
    testarConexao();
});