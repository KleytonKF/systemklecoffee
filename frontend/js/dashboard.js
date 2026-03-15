const API_URL = 'http://localhost:3000/api';

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarStats();
    carregarAtividades();
    carregarGraficoVendas();
});

// Carregar estatísticas
async function carregarStats() {
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`);
        const data = await response.json();
        
        document.getElementById('totalMaquinas').textContent = data.maquinas.total || 0;
        document.getElementById('maquinasManutencao').textContent = 
            `${data.maquinas.manutencao || 0} em manutenção`;
        
        document.getElementById('totalClientes').textContent = data.clientes.total || 0;
        
        document.getElementById('vendasHoje').textContent = 
            `R$ ${(data.vendas_hoje.valor_total || 0).toFixed(2)}`;
        document.getElementById('totalVendasHoje').textContent = 
            `${data.vendas_hoje.total_vendas || 0} vendas`;
        
        document.getElementById('estoqueBaixo').textContent = data.estoque_baixo.total || 0;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar atividades recentes
async function carregarAtividades() {
    try {
        const response = await fetch(`${API_URL}/dashboard/atividades-recentes`);
        const atividades = await response.json();
        
        const tbody = document.querySelector('#tabelaAtividades tbody');
        
        if (atividades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma atividade recente</td></tr>';
            return;
        }
        
        tbody.innerHTML = atividades.map(atividade => `
            <tr>
                <td>
                    <span class="status-badge ${getTipoClass(atividade.tipo)}">
                        ${atividade.tipo}
                    </span>
                </td>
                <td>${atividade.descricao}</td>
                <td>${formatarDataHora(atividade.data_hora)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

// Carregar gráfico de vendas
async function carregarGraficoVendas() {
    try {
        const response = await fetch(`${API_URL}/dashboard/vendas-semanais`);
        const vendas = await response.json();
        
        const ctx = document.getElementById('vendasChart').getContext('2d');
        
        // Preparar dados para o gráfico
        const labels = vendas.map(v => formatarData(v.data));
        const dados = vendas.map(v => v.total || 0);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: dados,
                    borderColor: '#6B4F3C',
                    backgroundColor: 'rgba(107, 79, 60, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico:', error);
    }
}

// Funções auxiliares
function getTipoClass(tipo) {
    const classes = {
        'Venda': 'status-active',
        'Estoque': 'status-warning',
        'Cliente': 'status-info',
        'Máquina': 'status-primary',
        'Evento': 'status-pending'
    };
    return classes[tipo] || 'status-pending';
}

function formatarDataHora(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
}

function formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function atualizarAtividades() {
    carregarAtividades();
}