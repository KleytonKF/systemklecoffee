let usuarios = [
            { id: 1, nome: 'Kléber', usuario: 'kleber', senha: '123456', email: 'kleber@klecoffee.com', nivel: 'admin', status: 'ativo' },
            { id: 2, nome: 'Maria Silva', usuario: 'maria', senha: '123456', email: 'maria@klecoffee.com', nivel: 'gerente', status: 'ativo' }
        ];
        let usuarioLogado = null;
        let nextUsuarioId = 3;
        let configuracoes = { tempoSessao: 30, maxTentativas: 3, exigirSenhaForte: true };
        let maquinas = [
            { id: 1, marca: 'Nespresso', modelo: 'Inissia', sn: 'SN12345', valor: 189.90, imagem: '' },
            { id: 2, marca: 'Jura', modelo: 'E8', sn: 'J87654Z', valor: 549.90, imagem: 'https://images.unsplash.com/photo-1525548002014-e18135c82ff3?w=200&h=150&fit=crop' },
            { id: 3, marca: 'Siemens', modelo: 'EQ.6', sn: 'SIEM-2026', valor: 425.00, imagem: '' }
        ];
        let produtos = [
            { id: 1, nome: 'Cápsula Intenso', imagem: '', valorCompra: 0.50, valorVenda: 1.20, margem: 140, quantidade: 150 },
            { id: 2, nome: 'Cápsula Suave', imagem: '', valorCompra: 0.50, valorVenda: 1.20, margem: 140, quantidade: 200 },
            { id: 3, nome: 'Café em Grão', imagem: '', valorCompra: 18.00, valorVenda: 35.00, margem: 94.44, quantidade: 25 },
            { id: 4, nome: 'Açúcar 1kg', imagem: '', valorCompra: 3.50, valorVenda: 7.00, margem: 100, quantidade: 50 }
        ];
        let clientes = [
            { id: 1, tipo: 'fixo', razaoSocial: 'Café com Prosa Ltda', cnpj: '12.345.678/0001-90', nomeCompleto: 'João Silva', cpf: '123.456.789-00', contato: '(11) 99999-8888', email: 'contato@cafeprosa.com', logradouro: 'Rua das Flores', numero: '123', complemento: '', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', cep: '01234-567', maquinas: [2], valorLocacao: 347.00 },
            { id: 2, tipo: 'evento', razaoSocial: 'Festival de Inverno', cnpj: '98.765.432/0001-10', nomeCompleto: 'Maria Oliveira', cpf: '987.654.321-00', contato: '(11) 97777-6666', email: 'contato@festival.com', logradouro: 'Av. Paulista', numero: '1000', complemento: '', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', cep: '01310-100', maquinas: [] }
        ];
        let eventos = [{ id: 1, clienteId: 1, nomeEvento: 'Feira do Café', dataInicio: '2026-04-15', dataFim: '2026-04-18', logradouro: 'Av. das Nações', numero: '5000', bairro: 'Morumbi', cidade: 'São Paulo', uf: 'SP', cep: '04795-100', maquinas: [1, 2], insumos: [{ id: 1, quantidade: 50 }, { id: 2, quantidade: 30 }], status: 'proximo' }];
        let pagamentos = [
            { id: 1, tipo: 'cliente', clienteId: 1, descricao: 'Mensalidade - Mar/2026', valor: 347.00, data: '2026-03-10', status: 'pago' },
            { id: 2, tipo: 'evento', eventoId: 1, descricao: 'Feira do Café - Parcial', valor: 1500.00, data: '2026-03-05', status: 'parcial' },
            { id: 3, tipo: 'venda', produtoId: 1, descricao: 'Cápsula Intenso - 10 un', valor: 12.00, data: '2026-03-13', status: 'pago' }
        ];
        let nextPagamentoId = 4, nextMaquinaId = 4, nextClienteId = 3, nextEventoId = 2, nextProdutoId = 5;
        let filtrosMaquinas = { busca: '', marca: 'todas', valorMax: '' };
        let filtrosClientes = { busca: '', tipo: 'todos', cidade: 'todas' };
        let filtrosEventos = { busca: '', status: 'todos', periodo: 'todos' };
        let filtrosProdutos = { busca: '', estoque: 'todos', margem: 'todos' };
        let filtrosPagamentos = { tipo: 'todos', status: 'todos', periodo: 'todos' };

        function verificarLoginSalvo() {
            const savedUser = localStorage.getItem('klecoffee_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const usuario = usuarios.find(u => u.usuario === user.usuario && u.senha === user.senha && u.status === 'ativo');
                if (usuario) { usuarioLogado = usuario; mostrarMainApp(); }
            }
        }
        window.fazerLogin = function() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const usuario = usuarios.find(u => u.usuario === username && u.senha === password && u.status === 'ativo');
            if (usuario) {
                usuarioLogado = usuario;
                if (rememberMe) localStorage.setItem('klecoffee_user', JSON.stringify({ usuario: usuario.usuario, senha: usuario.senha }));
                mostrarMainApp();
            } else {
                document.getElementById('loginError').classList.add('active');
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginPassword').focus();
            }
        };
        function mostrarMainApp() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').classList.add('active');
            document.getElementById('userName').innerText = usuarioLogado.nome;
            document.getElementById('userGreeting').innerText = usuarioLogado.nome.split(' ')[0];
            atualizarData(); initCharts(); renderizarListaMaquinas(); renderizarListaClientes(); renderizarListaEventos(); renderizarListaProdutos(); renderizarHistoricoPagamentos(); renderizarListaUsuarios(); atualizarSelects(); setActivePage('dashboard');
        }
        window.fazerLogout = function() { if (confirm('Deseja realmente sair do sistema?')) { usuarioLogado = null; localStorage.removeItem('klecoffee_user'); document.getElementById('loginPage').style.display = 'flex'; document.getElementById('mainApp').classList.remove('active'); } };
        document.addEventListener('keypress', function(e) { if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') fazerLogin(); });
        function validarSenhaForte(senha) { if (!configuracoes.exigirSenhaForte) return true; return /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha) && /[!@#$%^&*(),.?":{}|<>]/.test(senha) && senha.length >= 6; }
        function atualizarData() { const hoje = new Date(); document.getElementById('currentDate').innerText = hoje.toLocaleDateString('pt-BR', { year:'numeric', month:'long', day:'numeric' }); }
        function initCharts() {
            const ctxLinha = document.getElementById('graficoLinha')?.getContext('2d');
            if (ctxLinha) new Chart(ctxLinha, { type:'line', data:{ labels:['Out/25','Nov/25','Dez/25','Jan/26','Fev/26','Mar/26'], datasets:[{ label:'Máquinas', data:[112,124,135,142,148,156], borderColor:'#E0400D', backgroundColor:'rgba(224,64,13,0.12)', tension:.35, pointBackgroundColor:'#E0400D', borderWidth:3, fill:true }]}, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:false, min:80 } } } });
            const ctxPizza = document.getElementById('graficoPizza')?.getContext('2d');
            if (ctxPizza) new Chart(ctxPizza, { type:'doughnut', data:{ labels:['Mensalidades','Eventos','Vendas'], datasets:[{ data:[18300,7200,4100], backgroundColor:['#E0400D','#F57C4A','#FAA67B'], borderWidth:0 }]}, options:{ cutout:'72%', plugins:{ legend:{ position:'bottom' } } } });
        }
        window.fecharModal = () => document.getElementById('modalView').classList.remove('active');
        window.fecharModalEdit = () => document.getElementById('modalEdit').classList.remove('active');
        window.calcularMargem = function() { const compra = parseFloat(document.getElementById('valorCompra')?.value)||0; const venda = parseFloat(document.getElementById('valorVenda')?.value)||0; if (document.getElementById('margemLucro') && compra>0) document.getElementById('margemLucro').value = ((venda-compra)/compra*100).toFixed(1); };
        window.calcularMargemEdit = function() { const compra = parseFloat(document.getElementById('editValorCompra')?.value)||0; const venda = parseFloat(document.getElementById('editValorVenda')?.value)||0; if (document.getElementById('editMargem') && compra>0) document.getElementById('editMargem').value = ((venda-compra)/compra*100).toFixed(1); };
        function calcularResumoEvento() { let valorMaquinas = 0, valorInsumos = 0; document.querySelectorAll('input[name="eventoMaquinas"]:checked').forEach(cb => { const m = maquinas.find(m => m.id === parseInt(cb.value)); if (m) valorMaquinas += m.valor; }); document.querySelectorAll('.insumo-qtd').forEach(input => { valorInsumos += (parseInt(input.value)||0) * parseFloat(input.dataset.preco); }); document.getElementById('resumoMaquinas').innerText = `R$ ${valorMaquinas.toFixed(2)}`; document.getElementById('resumoInsumos').innerText = `R$ ${valorInsumos.toFixed(2)}`; document.getElementById('resumoTotal').innerText = `R$ ${(valorMaquinas+valorInsumos).toFixed(2)}`; }
        document.querySelectorAll('.tipo-option').forEach(opt => opt.addEventListener('click', function(){ document.querySelectorAll('.tipo-option').forEach(o=>o.classList.remove('active')); this.classList.add('active'); document.getElementById('clienteFixoFields').style.display = this.dataset.tipo === 'fixo' ? 'block' : 'none'; }));
        function atualizarSelects() {
            const containerCliente = document.getElementById('clienteMaquinasContainer'); if (containerCliente) containerCliente.innerHTML = maquinas.map(m => `<div class="multi-select-item"><input type="checkbox" name="clienteMaquinas" value="${m.id}" id="cli-maq-${m.id}"><label for="cli-maq-${m.id}">${m.marca} ${m.modelo}</label></div>`).join('');
            const selectCliente = document.getElementById('clienteOrganizador'); if (selectCliente) selectCliente.innerHTML = '<option value="">Selecione...</option>' + clientes.map(c => `<option value="${c.id}">${c.razaoSocial}</option>`).join('');
            const selectClientePag = document.getElementById('clientePagamento'); if (selectClientePag) selectClientePag.innerHTML = '<option value="">Selecione...</option>' + clientes.map(c => `<option value="${c.id}">${c.razaoSocial}</option>`).join('');
            const selectEventoPag = document.getElementById('eventoPagamento'); if (selectEventoPag) selectEventoPag.innerHTML = '<option value="">Selecione...</option>' + eventos.map(e => `<option value="${e.id}">${e.nomeEvento}</option>`).join('');
            const selectProdutoVenda = document.getElementById('produtoVenda'); if (selectProdutoVenda) selectProdutoVenda.innerHTML = '<option value="">Selecione...</option>' + produtos.map(p => `<option value="${p.id}">${p.nome} (Estoque: ${p.quantidade})</option>`).join('');
            const containerMaquinas = document.getElementById('eventoMaquinasContainer'); if (containerMaquinas) { containerMaquinas.innerHTML = maquinas.map(m => `<div class="multi-select-item"><input type="checkbox" name="eventoMaquinas" value="${m.id}" id="evt-maq-${m.id}" data-valor="${m.valor}"><label for="evt-maq-${m.id}">${m.marca} ${m.modelo} - R$ ${m.valor.toFixed(2)}</label></div>`).join(''); document.querySelectorAll('input[name="eventoMaquinas"]').forEach(cb => cb.addEventListener('change', calcularResumoEvento)); }
            const containerInsumos = document.getElementById('insumosContainer'); if (containerInsumos) { containerInsumos.innerHTML = produtos.map(p => `<div class="insumo-item"><div style="flex:1;"><strong ${p.quantidade < 20 ? 'style="color:#dc3545;"' : ''}>${p.nome}</strong><br><small>R$ ${p.valorVenda.toFixed(2)} | Estoque: ${p.quantidade}</small></div><input type="number" class="insumo-qtd" data-id="${p.id}" data-preco="${p.valorVenda}" min="0" max="${p.quantidade}" value="0"></div>`).join(''); document.querySelectorAll('.insumo-qtd').forEach(i => i.addEventListener('input', calcularResumoEvento)); }
            const filtroMarca = document.getElementById('filtroMaquinaMarca'); if (filtroMarca) filtroMarca.innerHTML = '<option value="todas">Todas</option>' + [...new Set(maquinas.map(m => m.marca))].map(m => `<option value="${m}">${m}</option>`).join('');
            const filtroCidade = document.getElementById('filtroClienteCidade'); if (filtroCidade) filtroCidade.innerHTML = '<option value="todas">Todas</option>' + [...new Set(clientes.map(c => c.cidade))].map(c => `<option value="${c}">${c}</option>`).join('');
        }
        window.aplicarFiltrosMaquinas = function(){ filtrosMaquinas.busca = document.getElementById('filtroMaquinaBusca').value.toLowerCase(); filtrosMaquinas.marca = document.getElementById('filtroMaquinaMarca').value; filtrosMaquinas.valorMax = parseFloat(document.getElementById('filtroMaquinaValor').value) || ''; renderizarListaMaquinas(); };
        window.limparFiltrosMaquinas = function(){ document.getElementById('filtroMaquinaBusca').value=''; document.getElementById('filtroMaquinaMarca').value='todas'; document.getElementById('filtroMaquinaValor').value=''; filtrosMaquinas = { busca:'', marca:'todas', valorMax:''}; renderizarListaMaquinas(); };
        window.aplicarFiltrosClientes = function(){ filtrosClientes.busca = document.getElementById('filtroClienteBusca').value.toLowerCase(); filtrosClientes.tipo = document.getElementById('filtroClienteTipo').value; filtrosClientes.cidade = document.getElementById('filtroClienteCidade').value; renderizarListaClientes(); };
        window.limparFiltrosClientes = function(){ document.getElementById('filtroClienteBusca').value=''; document.getElementById('filtroClienteTipo').value='todos'; document.getElementById('filtroClienteCidade').value='todas'; filtrosClientes = { busca:'', tipo:'todos', cidade:'todas' }; renderizarListaClientes(); };
        window.aplicarFiltrosEventos = function(){ filtrosEventos.busca = document.getElementById('filtroEventoBusca').value.toLowerCase(); filtrosEventos.status = document.getElementById('filtroEventoStatus').value; filtrosEventos.periodo = document.getElementById('filtroEventoPeriodo').value; renderizarListaEventos(); };
        window.limparFiltrosEventos = function(){ document.getElementById('filtroEventoBusca').value=''; document.getElementById('filtroEventoStatus').value='todos'; document.getElementById('filtroEventoPeriodo').value='todos'; filtrosEventos = { busca:'', status:'todos', periodo:'todos' }; renderizarListaEventos(); };
        window.aplicarFiltrosProdutos = function(){ filtrosProdutos.busca = document.getElementById('filtroProdutoBusca').value.toLowerCase(); filtrosProdutos.estoque = document.getElementById('filtroProdutoEstoque').value; filtrosProdutos.margem = document.getElementById('filtroProdutoMargem').value; renderizarListaProdutos(); };
        window.limparFiltrosProdutos = function(){ document.getElementById('filtroProdutoBusca').value=''; document.getElementById('filtroProdutoEstoque').value='todos'; document.getElementById('filtroProdutoMargem').value='todos'; filtrosProdutos = { busca:'', estoque:'todos', margem:'todos' }; renderizarListaProdutos(); };
        window.aplicarFiltrosPagamentos = function(){ filtrosPagamentos.tipo = document.getElementById('filtroPagamentoTipo').value; filtrosPagamentos.status = document.getElementById('filtroPagamentoStatus').value; filtrosPagamentos.periodo = document.getElementById('filtroPagamentoPeriodo').value; renderizarHistoricoPagamentos(); };
        window.limparFiltrosPagamentos = function(){ document.getElementById('filtroPagamentoTipo').value='todos'; document.getElementById('filtroPagamentoStatus').value='todos'; document.getElementById('filtroPagamentoPeriodo').value='todos'; filtrosPagamentos = { tipo:'todos', status:'todos', periodo:'todos' }; renderizarHistoricoPagamentos(); };
        function renderizarListaUsuarios() { const c = document.getElementById('listaUsuariosContainer'); if (!c) return; c.innerHTML = usuarios.map(u => `<tr><td><div style="font-weight:600;">@${u.usuario}</div></td><td>${u.nome}</td><td>${u.email}</td><td><span class="badge ${u.nivel==='admin'?'badge-purple':u.nivel==='gerente'?'badge-info':'badge-success'}">${u.nivel}</span></td><td><span class="badge ${u.status==='ativo'?'badge-success':'badge-danger'}">${u.status}</span></td><td class="acoes-cell"><button class="btn-icon edit" onclick="editarUsuario(${u.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirUsuario(${u.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="6">Nenhum usuário cadastrado</td></tr>'; document.getElementById('statsUsuarios').innerText = `${usuarios.length} usuários`; }
        function renderizarListaMaquinas() { const c = document.getElementById('listaMaquinasContainer'); if (!c) return; const lista = maquinas.filter(m => (!filtrosMaquinas.busca || `${m.marca} ${m.modelo} ${m.sn}`.toLowerCase().includes(filtrosMaquinas.busca)) && (filtrosMaquinas.marca==='todas'||m.marca===filtrosMaquinas.marca) && (!filtrosMaquinas.valorMax || m.valor <= filtrosMaquinas.valorMax)); c.innerHTML = lista.map(m => `<tr><td><div class="maquina-img-large">${m.imagem?`<img src="${m.imagem}" alt="${m.marca} ${m.modelo}">`:'<i class="fas fa-coffee"></i>'}</div></td><td><div style="font-weight:600;">${m.marca} ${m.modelo}</div><div class="stats-mini"><span><i class="fas fa-barcode"></i> ${m.sn}</span></div></td><td><span class="badge badge-info">${m.sn}</span></td><td><strong>R$ ${m.valor.toFixed(2)}</strong></td><td><span class="badge ${m.valor < 200 ? 'badge-success' : m.valor < 400 ? 'badge-info' : 'badge-purple'}">${m.valor < 200 ? 'Econômica' : m.valor < 400 ? 'Padrão' : 'Premium'}</span></td><td class="acoes-cell"><button class="btn-icon view" onclick="mostrarDetalhes('maquina', ${m.id})"><i class="fas fa-eye"></i></button><button class="btn-icon edit" onclick="editarMaquina(${m.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirMaquina(${m.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhuma máquina encontrada</td></tr>'; document.getElementById('totalMaquinasDashboard').innerText = maquinas.length; document.getElementById('statsMaquinas').innerText = `${lista.length} de ${maquinas.length} máquinas`; }
        function renderizarListaClientes() { const c = document.getElementById('listaClientesContainer'); if (!c) return; const lista = clientes.filter(cl => (!filtrosClientes.busca || `${cl.razaoSocial} ${cl.contato} ${cl.email}`.toLowerCase().includes(filtrosClientes.busca)) && (filtrosClientes.tipo==='todos'||cl.tipo===filtrosClientes.tipo) && (filtrosClientes.cidade==='todas'||cl.cidade===filtrosClientes.cidade)); c.innerHTML = lista.map(cl => { const vmaq = cl.maquinas.reduce((t,id)=>{ const m = maquinas.find(mm=>mm.id===id); return t + (m?m.valor:0); },0); return `<tr><td><div style="font-weight:600;">${cl.razaoSocial}</div><div class="stats-mini"><span><i class="fas fa-id-card"></i> ${cl.cnpj}</span><span><i class="fas fa-envelope"></i> ${cl.email}</span></div></td><td><span class="badge ${cl.tipo==='fixo'?'badge-success':'badge-info'}">${cl.tipo==='fixo'?'Fixo':'Evento'}</span></td><td><div><i class="fas fa-phone"></i> ${cl.contato}</div><small>${cl.nomeCompleto}</small></td><td><div><i class="fas fa-map-marker-alt"></i> ${cl.cidade}/${cl.uf}</div></td><td><div>${cl.maquinas.length} máquinas</div><small>R$ ${vmaq.toFixed(2)}</small></td><td>${cl.tipo==='fixo'?`<strong>R$ ${cl.valorLocacao.toFixed(2)}</strong>`:'-'}</td><td class="acoes-cell"><button class="btn-icon view" onclick="mostrarDetalhes('cliente', ${cl.id})"><i class="fas fa-eye"></i></button><button class="btn-icon edit" onclick="editarCliente(${cl.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirCliente(${cl.id})"><i class="fas fa-trash"></i></button></td></tr>`; }).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;">Nenhum cliente encontrado</td></tr>'; document.getElementById('totalClientesDashboard').innerText = clientes.length; document.getElementById('statsClientes').innerText = `${lista.length} de ${clientes.length} clientes`; }
        function renderizarListaEventos() { const c = document.getElementById('listaEventosContainer'); if (!c) return; const lista = eventos.filter(e => (!filtrosEventos.busca || e.nomeEvento.toLowerCase().includes(filtrosEventos.busca) || (clientes.find(cl=>cl.id===e.clienteId)?.razaoSocial||'').toLowerCase().includes(filtrosEventos.busca)) && (filtrosEventos.status==='todos'||e.status===filtrosEventos.status)); c.innerHTML = lista.map(e => { const cl = clientes.find(c=>c.id===e.clienteId) || {razaoSocial:'N/A'}; let total=0; e.maquinas.forEach(id=>{ const m=maquinas.find(mm=>mm.id===id); if(m) total+=m.valor; }); (e.insumos||[]).forEach(i=>{ const p=produtos.find(pp=>pp.id===i.id); if(p) total += p.valorVenda * i.quantidade; }); return `<tr><td><div style="font-weight:600;">${e.nomeEvento}</div><div class="stats-mini"><span><i class="fas fa-calendar"></i> ${new Date(e.dataInicio).toLocaleDateString()}</span></div></td><td>${cl.razaoSocial}</td><td><div>${new Date(e.dataInicio).toLocaleDateString()}</div><small>até ${new Date(e.dataFim).toLocaleDateString()}</small></td><td><div><i class="fas fa-map-marker-alt"></i> ${e.cidade}/${e.uf}</div></td><td>${e.maquinas.length} máquinas</td><td><strong>R$ ${total.toFixed(2)}</strong></td><td><span class="badge ${e.status==='concluido'?'badge-success':e.status==='andamento'?'badge-info':'badge-warning'}">${e.status}</span></td><td class="acoes-cell"><button class="btn-icon view" onclick="mostrarDetalhes('evento', ${e.id})"><i class="fas fa-eye"></i></button><button class="btn-icon edit" onclick="editarEvento(${e.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirEvento(${e.id})"><i class="fas fa-trash"></i></button></td></tr>`; }).join('') || '<tr><td colspan="8" style="text-align:center;padding:2rem;">Nenhum evento encontrado</td></tr>'; document.getElementById('totalEventosDashboard').innerText = eventos.length; document.getElementById('statsEventos').innerText = `${lista.length} de ${eventos.length} eventos`; }
        function renderizarListaProdutos() { const c = document.getElementById('listaProdutosContainer'); if (!c) return; const lista = produtos.filter(p => (!filtrosProdutos.busca || p.nome.toLowerCase().includes(filtrosProdutos.busca)) && (filtrosProdutos.estoque==='todos' || (filtrosProdutos.estoque==='baixo'&&p.quantidade<20) || (filtrosProdutos.estoque==='normal'&&p.quantidade>=20&&p.quantidade<50) || (filtrosProdutos.estoque==='alto'&&p.quantidade>=50)) && (filtrosProdutos.margem==='todos' || (filtrosProdutos.margem==='alta'&&p.margem>50) || (filtrosProdutos.margem==='media'&&p.margem>=20&&p.margem<=50) || (filtrosProdutos.margem==='baixa'&&p.margem<20))); c.innerHTML = lista.map(p => { const lucro = p.valorVenda - p.valorCompra; const estoqueBaixo = p.quantidade < 20; return `<div class="produto-card-moderno"><div class="produto-header-moderno"><div class="produto-img-large">${p.imagem?`<img src="${p.imagem}" alt="${p.nome}">`:'<i class="fas fa-box"></i>'}</div><div class="produto-info-moderno"><h4>${p.nome}</h4><div class="produto-precos-moderno"><span class="preco-compra-moderno">Compra: R$ ${p.valorCompra.toFixed(2)}</span><span class="preco-venda-moderno">Venda: R$ ${p.valorVenda.toFixed(2)}</span></div><div class="produto-detalhes"><span class="produto-badge"><i class="fas fa-chart-line"></i> Lucro: R$ ${lucro.toFixed(2)}</span><span class="produto-badge"><i class="fas fa-percent"></i> ${p.margem.toFixed(1)}%</span></div></div></div><div><div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span><i class="fas fa-boxes"></i> Estoque: <strong>${p.quantidade} un</strong></span><span class="${estoqueBaixo?'badge-danger':'badge-success'} badge">${estoqueBaixo?'Baixo':'Normal'}</span></div><div class="estoque-indicator"><div class="estoque-bar" style="width:${Math.min(p.quantidade,100)}%;"></div></div></div><div class="acoes-cell" style="margin-top:1rem;justify-content:flex-end;"><button class="btn-icon view" onclick="mostrarDetalhes('produto', ${p.id})"><i class="fas fa-eye"></i></button><button class="btn-icon edit" onclick="editarProduto(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirProduto(${p.id})"><i class="fas fa-trash"></i></button></div></div>`; }).join('') || '<div style="text-align:center;padding:2rem;">Nenhum produto encontrado</div>'; document.getElementById('totalProdutosDashboard').innerText = produtos.length; document.getElementById('statsProdutos').innerText = `${lista.length} de ${produtos.length} produtos`; }
        function renderizarHistoricoPagamentos() { const c = document.getElementById('historicoPagamentos'); const u = document.getElementById('ultimosPagamentos'); const nomeRef = p => p.tipo==='cliente' ? (clientes.find(c=>c.id===p.clienteId)?.razaoSocial||'Cliente') : p.tipo==='evento' ? (eventos.find(e=>e.id===p.eventoId)?.nomeEvento||'Evento') : (produtos.find(pr=>pr.id===p.produtoId)?.nome||'Produto'); const lista = pagamentos.filter(p => (filtrosPagamentos.tipo==='todos'||p.tipo===filtrosPagamentos.tipo) && (filtrosPagamentos.status==='todos'||p.status===filtrosPagamentos.status)).sort((a,b)=>new Date(b.data)-new Date(a.data)); if (c) { c.innerHTML = lista.map(p => `<tr><td><div style="font-weight:600;">${nomeRef(p)}</div><div class="stats-mini"><span><i class="fas fa-tag"></i> ${p.descricao}</span></div></td><td><span class="badge badge-info">${p.tipo==='cliente'?'Mensalidade':p.tipo==='evento'?'Evento':'Venda'}</span></td><td>${p.descricao}</td><td><strong>R$ ${p.valor.toFixed(2)}</strong></td><td>${new Date(p.data).toLocaleDateString()}</td><td><span class="badge ${p.status==='pago'?'badge-success':p.status==='parcial'?'badge-warning':'badge-danger'}">${p.status}</span></td><td class="acoes-cell"><button class="btn-icon view" onclick="mostrarDetalhes('pagamento', ${p.id})"><i class="fas fa-eye"></i></button><button class="btn-icon edit" onclick="iniciarEdicaoPagamento(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="excluirPagamento(${p.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;">Nenhum pagamento encontrado</td></tr>'; document.getElementById('statsPagamentos').innerText = `${lista.length} de ${pagamentos.length} pagamentos`; } if (u) { u.innerHTML = pagamentos.slice(-3).reverse().map(p => `<tr><td><div style="font-weight:600;">${nomeRef(p)}</div><small>${p.descricao}</small></td><td>${p.tipo==='cliente'?'Mensalidade':p.tipo==='evento'?'Evento':'Venda'}</td><td>${p.descricao}</td><td>R$ ${p.valor.toFixed(2)}</td><td>${new Date(p.data).toLocaleDateString()}</td><td><span class="badge ${p.status==='pago'?'badge-success':p.status==='parcial'?'badge-warning':'badge-danger'}">${p.status}</span></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center">Nenhum pagamento</td></tr>'; } }
        function mostrarDetalhes(tipo, id) { let title='', content=''; const money = v => `R$ ${Number(v).toFixed(2)}`; if (tipo==='maquina') { const m=maquinas.find(x=>x.id===id); if(!m) return; title='Detalhes da Máquina'; content=`<div class="info-grid"><div class="info-item"><span class="info-label">Marca:</span><span class="info-value">${m.marca}</span></div><div class="info-item"><span class="info-label">Modelo:</span><span class="info-value">${m.modelo}</span></div><div class="info-item"><span class="info-label">Nº Série:</span><span class="info-value">${m.sn}</span></div><div class="info-item"><span class="info-label">Valor:</span><span class="info-value">${money(m.valor)}</span></div></div>`; } else if (tipo==='cliente') { const c=clientes.find(x=>x.id===id); if(!c) return; title='Detalhes do Cliente'; content=`<div class="info-grid"><div class="info-item"><span class="info-label">Razão Social:</span><span class="info-value">${c.razaoSocial}</span></div><div class="info-item"><span class="info-label">CNPJ/CPF:</span><span class="info-value">${c.cnpj}</span></div><div class="info-item"><span class="info-label">Responsável:</span><span class="info-value">${c.nomeCompleto}</span></div><div class="info-item"><span class="info-label">Contato:</span><span class="info-value">${c.contato}</span></div><div class="info-item"><span class="info-label">Email:</span><span class="info-value">${c.email}</span></div><div class="info-item"><span class="info-label">Endereço:</span><span class="info-value">${c.logradouro}, ${c.numero} - ${c.cidade}/${c.uf}</span></div></div>`; } else if (tipo==='evento') { const e=eventos.find(x=>x.id===id); if(!e) return; const cl=clientes.find(c=>c.id===e.clienteId); let total=0; e.maquinas.forEach(i=>{ const m=maquinas.find(mm=>mm.id===i); if(m) total += m.valor;}); (e.insumos||[]).forEach(i=>{ const p=produtos.find(pp=>pp.id===i.id); if(p) total += p.valorVenda * i.quantidade; }); title='Detalhes do Evento'; content=`<div class="info-grid"><div class="info-item"><span class="info-label">Evento:</span><span class="info-value">${e.nomeEvento}</span></div><div class="info-item"><span class="info-label">Cliente:</span><span class="info-value">${cl ? cl.razaoSocial : 'N/A'}</span></div><div class="info-item"><span class="info-label">Período:</span><span class="info-value">${new Date(e.dataInicio).toLocaleDateString()} a ${new Date(e.dataFim).toLocaleDateString()}</span></div><div class="info-item"><span class="info-label">Local:</span><span class="info-value">${e.logradouro}, ${e.numero} - ${e.cidade}/${e.uf}</span></div><div class="info-item"><span class="info-label">Status:</span><span class="info-value">${e.status}</span></div><div class="info-item"><span class="info-label">Valor Total:</span><span class="info-value">${money(total)}</span></div></div>`; } else if (tipo==='produto') { const p=produtos.find(x=>x.id===id); if(!p) return; title='Detalhes do Produto'; content=`<div class="info-grid"><div class="info-item"><span class="info-label">Nome:</span><span class="info-value">${p.nome}</span></div><div class="info-item"><span class="info-label">Valor Compra:</span><span class="info-value">${money(p.valorCompra)}</span></div><div class="info-item"><span class="info-label">Valor Venda:</span><span class="info-value">${money(p.valorVenda)}</span></div><div class="info-item"><span class="info-label">Lucro Unitário:</span><span class="info-value">${money(p.valorVenda-p.valorCompra)}</span></div><div class="info-item"><span class="info-label">Margem:</span><span class="info-value">${p.margem.toFixed(1)}%</span></div><div class="info-item"><span class="info-label">Estoque:</span><span class="info-value">${p.quantidade} un</span></div></div>`; } else if (tipo==='pagamento') { const p=pagamentos.find(x=>x.id===id); if(!p) return; title='Detalhes do Pagamento'; content=`<div class="info-grid"><div class="info-item"><span class="info-label">Referência:</span><span class="info-value">${p.descricao}</span></div><div class="info-item"><span class="info-label">Tipo:</span><span class="info-value">${p.tipo}</span></div><div class="info-item"><span class="info-label">Valor:</span><span class="info-value">${money(p.valor)}</span></div><div class="info-item"><span class="info-label">Data:</span><span class="info-value">${new Date(p.data).toLocaleDateString()}</span></div><div class="info-item"><span class="info-label">Status:</span><span class="info-value">${p.status}</span></div></div>`; } document.getElementById('modalTitle').innerText = title; document.getElementById('modalBody').innerHTML = content; document.getElementById('modalView').classList.add('active'); }
        window.editarUsuario = function(id){ const u=usuarios.find(x=>x.id===id); if(!u) return; document.getElementById('modalEditTitle').innerText='Editar Usuário'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Nome Completo</label><input type="text" id="editUsuarioNome" value="${u.nome}" class="form-control"></div><div class="form-group"><label>Usuário</label><input type="text" id="editUsuarioLogin" value="${u.usuario}" class="form-control"></div><div class="form-group"><label>Email</label><input type="email" id="editUsuarioEmail" value="${u.email}" class="form-control"></div><div class="form-group"><label>Nível</label><select id="editUsuarioNivel" class="form-control"><option value="admin" ${u.nivel==='admin'?'selected':''}>Administrador</option><option value="gerente" ${u.nivel==='gerente'?'selected':''}>Gerente</option><option value="operador" ${u.nivel==='operador'?'selected':''}>Operador</option></select></div><div class="form-group"><label>Status</label><select id="editUsuarioStatus" class="form-control"><option value="ativo" ${u.status==='ativo'?'selected':''}>Ativo</option><option value="inativo" ${u.status==='inativo'?'selected':''}>Inativo</option></select></div><div class="form-group"><label>Nova Senha</label><input type="password" id="editUsuarioSenha" class="form-control"></div>`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='usuario'; document.getElementById('modalEdit').classList.add('active'); };
        window.editarMaquina = function(id){ const m=maquinas.find(x=>x.id===id); if(!m) return; document.getElementById('modalEditTitle').innerText='Editar Máquina'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Marca</label><input type="text" id="editMarca" value="${m.marca}" class="form-control"></div><div class="form-group"><label>Modelo</label><input type="text" id="editModelo" value="${m.modelo}" class="form-control"></div><div class="form-group"><label>Nº Série</label><input type="text" id="editSn" value="${m.sn}" class="form-control"></div><div class="form-group"><label>Valor</label><input type="number" id="editValor" value="${m.valor}" class="form-control"></div><div class="form-group"><label>Imagem</label><input type="url" id="editImagem" value="${m.imagem}" class="form-control"></div>`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='maquina'; document.getElementById('modalEdit').classList.add('active'); };
        window.editarCliente = function(id){ const c=clientes.find(x=>x.id===id); if(!c) return; document.getElementById('modalEditTitle').innerText='Editar Cliente'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Razão Social</label><input type="text" id="editRazaoSocial" value="${c.razaoSocial}" class="form-control"></div><div class="form-group"><label>CNPJ</label><input type="text" id="editCnpj" value="${c.cnpj}" class="form-control"></div><div class="form-group"><label>Responsável</label><input type="text" id="editNomeCompleto" value="${c.nomeCompleto}" class="form-control"></div><div class="form-group"><label>Contato</label><input type="text" id="editContato" value="${c.contato}" class="form-control"></div><div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${c.email}" class="form-control"></div><div class="form-row"><div class="form-group"><label>Logradouro</label><input type="text" id="editLogradouro" value="${c.logradouro}" class="form-control"></div><div class="form-group"><label>Número</label><input type="text" id="editNumero" value="${c.numero}" class="form-control"></div></div><div class="form-row"><div class="form-group"><label>Cidade</label><input type="text" id="editCidade" value="${c.cidade}" class="form-control"></div><div class="form-group"><label>UF</label><input type="text" id="editUf" value="${c.uf}" class="form-control"></div></div>${c.tipo==='fixo'?`<div class="form-group"><label>Valor Locação</label><input type="number" id="editValorLocacao" value="${c.valorLocacao}" class="form-control"></div>`:''}`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='cliente'; document.getElementById('modalEdit').classList.add('active'); };
        window.editarEvento = function(id){ const e=eventos.find(x=>x.id===id); if(!e) return; document.getElementById('modalEditTitle').innerText='Editar Evento'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Nome do Evento</label><input type="text" id="editNomeEvento" value="${e.nomeEvento}" class="form-control"></div><div class="form-row"><div class="form-group"><label>Data Início</label><input type="date" id="editDataInicio" value="${e.dataInicio}" class="form-control"></div><div class="form-group"><label>Data Fim</label><input type="date" id="editDataFim" value="${e.dataFim}" class="form-control"></div></div><div class="form-group"><label>Status</label><select id="editStatus" class="form-control"><option value="proximo" ${e.status==='proximo'?'selected':''}>Próximo</option><option value="andamento" ${e.status==='andamento'?'selected':''}>Em andamento</option><option value="concluido" ${e.status==='concluido'?'selected':''}>Concluído</option></select></div>`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='evento'; document.getElementById('modalEdit').classList.add('active'); };
        window.editarProduto = function(id){ const p=produtos.find(x=>x.id===id); if(!p) return; document.getElementById('modalEditTitle').innerText='Editar Produto'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Nome</label><input type="text" id="editNomeProduto" value="${p.nome}" class="form-control"></div><div class="form-group"><label>Valor Compra</label><input type="number" id="editValorCompra" step="0.01" value="${p.valorCompra}" class="form-control" onchange="calcularMargemEdit()"></div><div class="form-group"><label>Valor Venda</label><input type="number" id="editValorVenda" step="0.01" value="${p.valorVenda}" class="form-control" onchange="calcularMargemEdit()"></div><div class="form-group"><label>Margem</label><input type="number" id="editMargem" readonly class="form-control"></div><div class="form-group"><label>Quantidade</label><input type="number" id="editQuantidade" value="${p.quantidade}" class="form-control"></div>`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='produto'; document.getElementById('modalEdit').classList.add('active'); calcularMargemEdit(); };
        function iniciarEdicaoPagamento(id){ const p=pagamentos.find(x=>x.id===id); if(!p) return; document.getElementById('modalEditTitle').innerText='Editar Pagamento'; document.getElementById('modalEditBody').innerHTML=`<div class="form-group"><label>Status</label><select id="editStatus" class="form-control"><option value="pago" ${p.status==='pago'?'selected':''}>Pago</option><option value="parcial" ${p.status==='parcial'?'selected':''}>Parcial</option><option value="pendente" ${p.status==='pendente'?'selected':''}>Pendente</option></select></div>${p.tipo==='cliente'?`<div class="form-group"><label>Valor</label><input type="number" id="editValor" step="0.01" value="${p.valor}" class="form-control"></div>`:''}`; document.getElementById('modalEdit').dataset.id=id; document.getElementById('modalEdit').dataset.tipo='pagamento'; document.getElementById('modalEdit').classList.add('active'); }
        window.salvarEdicao = function(){ const id=parseInt(document.getElementById('modalEdit').dataset.id); const tipo=document.getElementById('modalEdit').dataset.tipo; if(tipo==='maquina'){const m=maquinas.find(x=>x.id===id); m.marca=editMarca.value; m.modelo=editModelo.value; m.sn=editSn.value; m.valor=parseFloat(editValor.value); m.imagem=editImagem.value; aplicarFiltrosMaquinas();} else if(tipo==='cliente'){const c=clientes.find(x=>x.id===id); c.razaoSocial=editRazaoSocial.value; c.cnpj=editCnpj.value; c.nomeCompleto=editNomeCompleto.value; c.contato=editContato.value; c.email=editEmail.value; c.logradouro=editLogradouro.value; c.numero=editNumero.value; c.cidade=editCidade.value; c.uf=editUf.value; if(c.tipo==='fixo' && document.getElementById('editValorLocacao')) c.valorLocacao=parseFloat(editValorLocacao.value); aplicarFiltrosClientes();} else if(tipo==='evento'){const e=eventos.find(x=>x.id===id); e.nomeEvento=editNomeEvento.value; e.dataInicio=editDataInicio.value; e.dataFim=editDataFim.value; e.status=editStatus.value; aplicarFiltrosEventos();} else if(tipo==='produto'){const p=produtos.find(x=>x.id===id); p.nome=editNomeProduto.value; p.valorCompra=parseFloat(editValorCompra.value); p.valorVenda=parseFloat(editValorVenda.value); p.margem=((p.valorVenda-p.valorCompra)/p.valorCompra*100); p.quantidade=parseInt(editQuantidade.value); aplicarFiltrosProdutos();} else if(tipo==='pagamento'){const p=pagamentos.find(x=>x.id===id); p.status=editStatus.value; if(document.getElementById('editValor')) p.valor=parseFloat(editValor.value); aplicarFiltrosPagamentos();} else if(tipo==='usuario'){const u=usuarios.find(x=>x.id===id); u.nome=editUsuarioNome.value; u.usuario=editUsuarioLogin.value; u.email=editUsuarioEmail.value; u.nivel=editUsuarioNivel.value; u.status=editUsuarioStatus.value; if(editUsuarioSenha.value){ if(!validarSenhaForte(editUsuarioSenha.value)){ alert('A senha não atende aos requisitos de segurança!'); return; } u.senha=editUsuarioSenha.value; } renderizarListaUsuarios(); } fecharModalEdit(); atualizarSelects(); };
        window.excluirMaquina = id => { if(confirm('Tem certeza que deseja excluir esta máquina?')) { maquinas = maquinas.filter(m=>m.id!==id); aplicarFiltrosMaquinas(); atualizarSelects(); } };
        window.excluirCliente = id => { if(confirm('Tem certeza que deseja excluir este cliente?')) { clientes = clientes.filter(c=>c.id!==id); aplicarFiltrosClientes(); atualizarSelects(); } };
        window.excluirEvento = id => { if(confirm('Tem certeza que deseja excluir este evento?')) { eventos = eventos.filter(e=>e.id!==id); aplicarFiltrosEventos(); atualizarSelects(); } };
        window.excluirProduto = id => { if(confirm('Tem certeza que deseja excluir este produto?')) { produtos = produtos.filter(p=>p.id!==id); aplicarFiltrosProdutos(); atualizarSelects(); } };
        window.excluirPagamento = id => { if(confirm('Tem certeza que deseja excluir este pagamento?')) { pagamentos = pagamentos.filter(p=>p.id!==id); aplicarFiltrosPagamentos(); } };
        window.excluirUsuario = id => { if(id===1){ alert('Não é possível excluir o usuário administrador principal!'); return; } if(confirm('Tem certeza que deseja excluir este usuário?')) { usuarios = usuarios.filter(u=>u.id!==id); renderizarListaUsuarios(); } };
        window.salvarConfiguracoes = function(){ configuracoes.tempoSessao = parseInt(document.getElementById('tempoSessao').value); configuracoes.maxTentativas = parseInt(document.getElementById('maxTentativas').value); configuracoes.exigirSenhaForte = document.getElementById('exigirSenhaForte').checked; alert('Configurações salvas com sucesso!'); };
        window.mudarTipoPagamento = function(){ const tipo = document.getElementById('tipoPagamento').value; pagamentoCliente.style.display = tipo==='cliente' ? 'block' : 'none'; pagamentoEvento.style.display = tipo==='evento' ? 'block' : 'none'; pagamentoVenda.style.display = tipo==='venda' ? 'block' : 'none'; };
        window.atualizarValorEvento = function(){ const eventoId = parseInt(document.getElementById('eventoPagamento').value); const evento = eventos.find(e=>e.id===eventoId); if(!evento) return; let total=0; evento.maquinas.forEach(id=>{ const m=maquinas.find(mm=>mm.id===id); if(m) total += m.valor; }); (evento.insumos||[]).forEach(i=>{ const p=produtos.find(pp=>pp.id===i.id); if(p) total += p.valorVenda * i.quantidade; }); document.getElementById('valorTotalEvento').value = total.toFixed(2); };
        window.atualizarPrecoVenda = function(){ const produto = produtos.find(p=>p.id===parseInt(document.getElementById('produtoVenda').value)); if(produto){ document.getElementById('precoVenda').value = produto.valorVenda; calcularTotalVenda(); } };
        window.calcularTotalVenda = function(){ const preco = parseFloat(document.getElementById('precoVenda').value)||0; const qtd = parseInt(document.getElementById('quantidadeVenda').value)||0; document.getElementById('totalVenda').value = (preco*qtd).toFixed(2); };
        window.registrarPagamentoCliente = function(){ const clienteId=parseInt(document.getElementById('clientePagamento').value), mes=document.getElementById('mesReferencia').value, data=document.getElementById('dataPagamentoCliente').value; if(!clienteId || !mes || !data) return alert('Preencha todos os campos'); const cliente=clientes.find(c=>c.id===clienteId); pagamentos.push({ id: nextPagamentoId++, tipo:'cliente', clienteId, descricao:`Mensalidade - ${mes}`, valor:cliente.valorLocacao, data, status:'pago' }); alert('Pagamento registrado com sucesso!'); aplicarFiltrosPagamentos(); };
        window.registrarPagamentoEvento = function(){ const eventoId=parseInt(document.getElementById('eventoPagamento').value), valorPago=parseFloat(document.getElementById('valorReceberEvento').value), data=document.getElementById('dataPagamentoEvento').value; if(!eventoId || !valorPago || !data) return alert('Preencha todos os campos'); const evento=eventos.find(e=>e.id===eventoId), valorTotal=parseFloat(document.getElementById('valorTotalEvento').value), status=valorPago >= valorTotal ? 'pago':'parcial'; pagamentos.push({ id: nextPagamentoId++, tipo:'evento', eventoId, descricao:`${evento.nomeEvento} - ${status==='pago'?'Total':'Parcial'}`, valor:valorPago, data, status }); alert('Pagamento registrado com sucesso!'); aplicarFiltrosPagamentos(); };
        window.registrarVendaAvulsa = function(){ const produtoId=parseInt(document.getElementById('produtoVenda').value), quantidade=parseInt(document.getElementById('quantidadeVenda').value), data=document.getElementById('dataVenda').value; const produto=produtos.find(p=>p.id===produtoId); if(!produto || produto.quantidade < quantidade) return alert('Quantidade insuficiente em estoque!'); if(!produtoId||!quantidade||!data) return alert('Preencha todos os campos'); pagamentos.push({ id: nextPagamentoId++, tipo:'venda', produtoId, descricao:`${produto.nome} - ${quantidade} un`, valor: produto.valorVenda*quantidade, data, status:'pago' }); produto.quantidade -= quantidade; alert('Venda registrada com sucesso!'); aplicarFiltrosProdutos(); aplicarFiltrosPagamentos(); };
        document.getElementById('formMaquina')?.addEventListener('submit', e => { e.preventDefault(); maquinas.push({ id: nextMaquinaId++, marca: marca.value, modelo: modelo.value, sn: sn.value, valor: parseFloat(valor.value), imagem: imagemUrl.value }); e.target.reset(); aplicarFiltrosMaquinas(); atualizarSelects(); });
        document.getElementById('formProduto')?.addEventListener('submit', e => { e.preventDefault(); const compra=parseFloat(valorCompra.value), venda=parseFloat(valorVenda.value); produtos.push({ id: nextProdutoId++, nome: nomeProduto.value, imagem: imagemProduto.value, valorCompra: compra, valorVenda: venda, margem: ((venda-compra)/compra*100), quantidade: parseInt(quantidadeProduto.value) }); e.target.reset(); aplicarFiltrosProdutos(); atualizarSelects(); });
        document.getElementById('formCliente')?.addEventListener('submit', e => { e.preventDefault(); const tipo=document.querySelector('.tipo-option.active').dataset.tipo; const maquinasSelecionadas = tipo==='fixo' ? [...document.querySelectorAll('input[name="clienteMaquinas"]:checked')].map(cb=>parseInt(cb.value)) : []; const novo = { id: nextClienteId++, tipo, razaoSocial: razaoSocial.value, cnpj: cnpj.value, nomeCompleto: nomeCompleto.value, cpf: cpf.value, contato: contato.value, email: email.value, logradouro: logradouro.value, numero: numero.value, complemento: complemento.value, bairro: bairro.value, cidade: cidade.value, uf: uf.value, cep: cep.value, maquinas: maquinasSelecionadas }; if(tipo==='fixo') novo.valorLocacao = parseFloat(valorLocacao.value); clientes.push(novo); e.target.reset(); aplicarFiltrosClientes(); atualizarSelects(); });
        document.getElementById('formEvento')?.addEventListener('submit', e => { e.preventDefault(); const maquinasSelecionadas=[...document.querySelectorAll('input[name="eventoMaquinas"]:checked')].map(cb=>parseInt(cb.value)); const insumosSelecionados=[]; document.querySelectorAll('.insumo-qtd').forEach(input => { const qtd=parseInt(input.value)||0; if(qtd>0){ insumosSelecionados.push({ id: parseInt(input.dataset.id), quantidade:qtd }); const produto=produtos.find(p=>p.id===parseInt(input.dataset.id)); if(produto) produto.quantidade -= qtd; } }); eventos.push({ id: nextEventoId++, clienteId: parseInt(clienteOrganizador.value), nomeEvento: nomeEvento.value, dataInicio: dataInicio.value, dataFim: dataFim.value, logradouro: eventoLogradouro.value, numero: eventoNumero.value, bairro:'', cidade: eventoCidade.value, uf: eventoUf.value, cep:'', maquinas: maquinasSelecionadas, insumos: insumosSelecionados, status:'proximo', observacoes: observacoes.value }); e.target.reset(); aplicarFiltrosEventos(); aplicarFiltrosProdutos(); atualizarSelects(); });
        document.getElementById('formUsuario')?.addEventListener('submit', e => { e.preventDefault(); if(usuarioSenha.value !== usuarioConfirmarSenha.value) return alert('As senhas não coincidem!'); if(!validarSenhaForte(usuarioSenha.value)) return alert('A senha deve atender às regras de segurança!'); if(usuarios.some(u => u.usuario === usuarioLogin.value)) return alert('Este nome de usuário já existe!'); usuarios.push({ id: nextUsuarioId++, nome: usuarioNome.value, usuario: usuarioLogin.value, senha: usuarioSenha.value, email: usuarioEmail.value, nivel: usuarioNivel.value, status:'ativo' }); e.target.reset(); renderizarListaUsuarios(); alert('Usuário criado com sucesso!'); });
        const navItems = document.querySelectorAll('.nav-item'); const pages = document.querySelectorAll('.page');
        function setActivePage(pageId){ pages.forEach(p=>p.classList.remove('active-page')); document.getElementById(pageId)?.classList.add('active-page'); navItems.forEach(item => { item.classList.toggle('active', item.dataset.page === pageId); }); if(pageId==='pagamentos') atualizarSelects(); }
        navItems.forEach(item => item.addEventListener('click', e => { e.preventDefault(); setActivePage(item.dataset.page); }));
        // bootstrap via API no final do arquivo

function aplicarLogoEstatica() {
    const loginImg = document.getElementById('loginLogoPreview');
    const loginIcon = document.getElementById('loginLogoIcon');
    const navImg = document.getElementById('navLogoPreview');
    const navFallback = document.getElementById('navLogoFallback');
    const path = 'img/logo-klecoffee.png';
    if (loginImg) { loginImg.src = path; loginImg.onload = () => { loginImg.style.display = 'block'; if (loginIcon) loginIcon.style.display = 'none'; }; loginImg.onerror = () => { loginImg.style.display = 'none'; if (loginIcon) loginIcon.style.display = 'block'; }; }
    if (navImg) { navImg.src = path; navImg.onload = () => { navImg.style.display = 'block'; if (navFallback) navFallback.style.display = 'none'; }; navImg.onerror = () => { navImg.style.display = 'none'; if (navFallback) navFallback.style.display = 'flex'; }; }
}

document.addEventListener('DOMContentLoaded', aplicarLogoEstatica);

function getMonthlyRevenueSeries() {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) });
    }
    const totals = Object.fromEntries(months.map(m => [m.key, 0]));
    pagamentos.forEach((p) => {
        const date = parseDateSafe(p.data);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (totals[key] !== undefined) totals[key] += Number(p.valor || 0);
    });
    return { labels: months.map(m => m.label), values: months.map(m => Number(totals[m.key].toFixed(2))) };
}
function computeDashboardMetrics() {
    const receitaTotal = pagamentos.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const ticketMedio = pagamentos.length ? receitaTotal / pagamentos.length : 0;
    const estoqueBaixo = produtos.filter(p => Number(p.quantidade || 0) < 20).length;
    const pendencias = pagamentos.filter(p => ['pendente', 'parcial'].includes(String(p.status || '').toLowerCase())).length;
    return { receitaTotal, ticketMedio, estoqueBaixo, pendencias };
}
function renderDashboardIndicators() {
    const m = computeDashboardMetrics();
    const mapping = {
        receitaTotalDashboard: formatMoneyBR(m.receitaTotal),
        ticketMedioDashboard: formatMoneyBR(m.ticketMedio),
        estoqueBaixoDashboard: String(m.estoqueBaixo),
        pendenciasDashboard: String(m.pendencias),
        totalMaquinasDashboard: String(maquinas.length),
        totalClientesDashboard: String(clientes.length),
        totalEventosDashboard: String(eventos.length),
        totalProdutosDashboard: String(produtos.length)
    };
    Object.entries(mapping).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}
function destroyChart(id) {
    if (dashboardCharts[id]) {
        dashboardCharts[id].destroy();
        delete dashboardCharts[id];
    }
}
function createChart(id, config) {
    const ctx = document.getElementById(id)?.getContext('2d');
    if (!ctx) return;
    destroyChart(id);
    dashboardCharts[id] = new Chart(ctx, config);
}
initCharts = function initChartsEnhanced() {
    renderDashboardIndicators();
    const monthSeries = getMonthlyRevenueSeries();
    createChart('graficoLinha', {
        type: 'line',
        data: {
            labels: monthSeries.labels,
            datasets: [{
                label: 'Receita',
                data: monthSeries.values,
                borderColor: '#E0400D',
                backgroundColor: 'rgba(224,64,13,0.12)',
                pointBackgroundColor: '#E0400D',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: .35,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.18)' } },
                x: { grid: { display: false } }
            }
        }
    });

    const receitas = {
        cliente: pagamentos.filter(p => p.tipo === 'cliente').reduce((acc, p) => acc + Number(p.valor || 0), 0),
        evento: pagamentos.filter(p => p.tipo === 'evento').reduce((acc, p) => acc + Number(p.valor || 0), 0),
        venda: pagamentos.filter(p => p.tipo === 'venda').reduce((acc, p) => acc + Number(p.valor || 0), 0)
    };
    createChart('graficoPizza', {
        type: 'doughnut',
        data: {
            labels: ['Mensalidades', 'Eventos', 'Vendas'],
            datasets: [{ data: [receitas.cliente, receitas.evento, receitas.venda], backgroundColor: ['#E0400D', '#F57C4A', '#FAA67B'], borderWidth: 0, hoverOffset: 10 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
    });

    const statusEvents = ['proximo', 'andamento', 'concluido'];
    createChart('graficoStatusEventos', {
        type: 'bar',
        data: {
            labels: ['Próximos', 'Em andamento', 'Concluídos'],
            datasets: [{
                label: 'Eventos',
                data: statusEvents.map(status => eventos.filter(e => e.status === status).length),
                backgroundColor: ['rgba(224,64,13,.88)', 'rgba(245,124,74,.75)', 'rgba(250,166,123,.72)'],
                borderRadius: 12,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
        }
    });

    const topProdutos = [...produtos].sort((a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0)).slice(0, 6);
    createChart('graficoEstoque', {
        type: 'bar',
        data: {
            labels: topProdutos.map(p => p.nome),
            datasets: [{ label: 'Quantidade', data: topProdutos.map(p => Number(p.quantidade || 0)), backgroundColor: topProdutos.map(p => Number(p.quantidade || 0) < 20 ? 'rgba(220,53,69,.72)' : 'rgba(224,64,13,.75)'), borderRadius: 10, borderSkipped: false }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }
        }
    });
};

mostrarDetalhes = function mostrarDetalhesAprimorado(tipo, id) {
    let title = '';
    let content = '';
    const money = (v) => formatMoneyBR(v);
    if (tipo === 'cliente') {
        const c = clientes.find(x => x.id === id);
        if (!c) return;
        const maquinasCliente = (c.maquinas || []).map((maqId) => {
            const m = maquinas.find(mm => mm.id === maqId);
            return m ? `<li>${m.marca} ${m.modelo} · Série ${m.sn} · ${money(m.valor)}</li>` : '';
        }).filter(Boolean).join('');
        title = 'Cadastro completo do cliente';
        content = `
            <div class="info-grid">
                <div class="info-item"><div class="info-label">Tipo</div><div class="info-value">${c.tipo === 'fixo' ? 'Cliente fixo' : 'Evento'}</div></div>
                <div class="info-item"><div class="info-label">Razão social / Nome</div><div class="info-value">${c.razaoSocial || '-'}</div></div>
                <div class="info-item"><div class="info-label">CNPJ / CPF</div><div class="info-value">${c.cnpj || '-'}</div></div>
                <div class="info-item"><div class="info-label">Responsável</div><div class="info-value">${c.nomeCompleto || '-'}</div></div>
                <div class="info-item"><div class="info-label">CPF do responsável</div><div class="info-value">${c.cpf || '-'}</div></div>
                <div class="info-item"><div class="info-label">Contato</div><div class="info-value">${c.contato || '-'}</div></div>
                <div class="info-item"><div class="info-label">Email</div><div class="info-value">${c.email || '-'}</div></div>
                <div class="info-item"><div class="info-label">Logradouro</div><div class="info-value">${c.logradouro || '-'}</div></div>
                <div class="info-item"><div class="info-label">Número</div><div class="info-value">${c.numero || '-'}</div></div>
                <div class="info-item"><div class="info-label">Complemento</div><div class="info-value">${c.complemento || '-'}</div></div>
                <div class="info-item"><div class="info-label">Bairro</div><div class="info-value">${c.bairro || '-'}</div></div>
                <div class="info-item"><div class="info-label">Cidade</div><div class="info-value">${c.cidade || '-'}</div></div>
                <div class="info-item"><div class="info-label">UF</div><div class="info-value">${c.uf || '-'}</div></div>
                <div class="info-item"><div class="info-label">CEP</div><div class="info-value">${c.cep || '-'}</div></div>
                <div class="info-item"><div class="info-label">Valor da locação</div><div class="info-value">${c.tipo === 'fixo' ? money(c.valorLocacao || 0) : '-'}</div></div>
            </div>
            <div class="cadastro-card" style="padding:1rem 1.1rem; margin-top:1rem; box-shadow:none;">
                <h3 style="font-size:1rem; margin-bottom:.75rem;"><i class="fas fa-coffee"></i> Máquinas vinculadas</h3>
                ${maquinasCliente ? `<ul style="padding-left:1rem; display:grid; gap:.55rem;">${maquinasCliente}</ul>` : '<div class="info-value">Nenhuma máquina vinculada.</div>'}
            </div>`;
    } else if (tipo === 'maquina') {
        const m = maquinas.find(x => x.id === id); if (!m) return;
        title = 'Detalhes da Máquina';
        content = `<div class="info-grid"><div class="info-item"><div class="info-label">Marca</div><div class="info-value">${m.marca}</div></div><div class="info-item"><div class="info-label">Modelo</div><div class="info-value">${m.modelo}</div></div><div class="info-item"><div class="info-label">Nº Série</div><div class="info-value">${m.sn}</div></div><div class="info-item"><div class="info-label">Valor</div><div class="info-value">${money(m.valor)}</div></div></div>`;
    } else if (tipo === 'evento') {
        const e = eventos.find(x => x.id === id); if (!e) return;
        const cl = clientes.find(c => c.id === e.clienteId);
        const total = (e.maquinas || []).reduce((acc, maqId) => acc + Number(maquinas.find(m => m.id === maqId)?.valor || 0), 0) + (e.insumos || []).reduce((acc, item) => acc + (Number(produtos.find(p => p.id === item.id)?.valorVenda || 0) * Number(item.quantidade || 0)), 0);
        const insumosList = (e.insumos || []).map((item) => {
            const p = produtos.find(prod => prod.id === item.id);
            return p ? `<li>${p.nome} · ${item.quantidade} un.</li>` : '';
        }).filter(Boolean).join('');
        title = 'Detalhes do Evento';
        content = `<div class="info-grid"><div class="info-item"><div class="info-label">Evento</div><div class="info-value">${e.nomeEvento}</div></div><div class="info-item"><div class="info-label">Cliente</div><div class="info-value">${cl ? cl.razaoSocial : 'N/A'}</div></div><div class="info-item"><div class="info-label">Período</div><div class="info-value">${parseDateSafe(e.dataInicio)?.toLocaleDateString('pt-BR')} a ${parseDateSafe(e.dataFim)?.toLocaleDateString('pt-BR')}</div></div><div class="info-item"><div class="info-label">Local</div><div class="info-value">${e.logradouro}, ${e.numero} · ${e.cidade}/${e.uf}</div></div><div class="info-item"><div class="info-label">Status</div><div class="info-value">${e.status}</div></div><div class="info-item"><div class="info-label">Total estimado</div><div class="info-value">${money(total)}</div></div></div><div class="cadastro-card" style="padding:1rem 1.1rem; margin-top:1rem; box-shadow:none;"><h3 style="font-size:1rem; margin-bottom:.75rem;"><i class="fas fa-boxes"></i> Insumos</h3>${insumosList ? `<ul style="padding-left:1rem; display:grid; gap:.55rem;">${insumosList}</ul>` : '<div class="info-value">Nenhum insumo selecionado.</div>'}</div>`;
    } else if (tipo === 'produto') {
        const p = produtos.find(x => x.id === id); if (!p) return;
        const lucro = Number(p.valorVenda || 0) - Number(p.valorCompra || 0);
        title = 'Detalhes do Produto';
        content = `<div class="info-grid"><div class="info-item"><div class="info-label">Nome</div><div class="info-value">${p.nome}</div></div><div class="info-item"><div class="info-label">Valor de compra</div><div class="info-value">${money(p.valorCompra)}</div></div><div class="info-item"><div class="info-label">Valor de venda</div><div class="info-value">${money(p.valorVenda)}</div></div><div class="info-item"><div class="info-label">Lucro unitário</div><div class="info-value">${money(lucro)}</div></div><div class="info-item"><div class="info-label">Margem</div><div class="info-value">${Number(p.margem || 0).toFixed(1)}%</div></div><div class="info-item"><div class="info-label">Quantidade</div><div class="info-value">${p.quantidade} un.</div></div></div>`;
    } else if (tipo === 'pagamento') {
        const p = pagamentos.find(x => x.id === id); if (!p) return;
        let nome = 'Registro';
        if (p.tipo === 'cliente') nome = clientes.find(c => c.id === p.clienteId)?.razaoSocial || 'Cliente';
        if (p.tipo === 'evento') nome = eventos.find(e => e.id === p.eventoId)?.nomeEvento || 'Evento';
        if (p.tipo === 'venda') nome = produtos.find(pr => pr.id === p.produtoId)?.nome || 'Produto';
        title = 'Detalhes do Pagamento';
        content = `<div class="info-grid"><div class="info-item"><div class="info-label">Cliente / Evento</div><div class="info-value">${nome}</div></div><div class="info-item"><div class="info-label">Tipo</div><div class="info-value">${p.tipo === 'cliente' ? 'Mensalidade' : p.tipo === 'evento' ? 'Evento' : 'Venda'}</div></div><div class="info-item"><div class="info-label">Descrição</div><div class="info-value">${p.descricao}</div></div><div class="info-item"><div class="info-label">Valor</div><div class="info-value">${money(p.valor)}</div></div><div class="info-item"><div class="info-label">Data</div><div class="info-value">${parseDateSafe(p.data)?.toLocaleDateString('pt-BR')}</div></div><div class="info-item"><div class="info-label">Status</div><div class="info-value">${p.status}</div></div></div>`;
    }
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalView').classList.add('active');
};

const _renderizarListaMaquinasRef = renderizarListaMaquinas;
renderizarListaMaquinas = function() { _renderizarListaMaquinasRef(); renderDashboardIndicators(); initCharts(); };
const _renderizarListaClientesRef = renderizarListaClientes;
renderizarListaClientes = function() { _renderizarListaClientesRef(); renderDashboardIndicators(); };
const _renderizarListaEventosRef = renderizarListaEventos;
renderizarListaEventos = function() { _renderizarListaEventosRef(); renderDashboardIndicators(); initCharts(); };
const _renderizarListaProdutosRef = renderizarListaProdutos;
renderizarListaProdutos = function() { _renderizarListaProdutosRef(); renderDashboardIndicators(); initCharts(); };
const _renderizarHistoricoPagamentosRef = renderizarHistoricoPagamentos;
renderizarHistoricoPagamentos = function() { _renderizarHistoricoPagamentosRef(); renderDashboardIndicators(); initCharts(); };

const _mostrarMainAppRef = mostrarMainApp;
mostrarMainApp = function() { _mostrarMainAppRef(); initLogoUpload(); carregarLogoPersonalizada(); renderDashboardIndicators(); initCharts(); };

window.addEventListener('DOMContentLoaded', () => {
    initLogoUpload();
    carregarLogoPersonalizada();
    renderDashboardIndicators();
    initCharts();
});


/* =========================
   Integração MySQL / API
   ========================= */
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        payload = await response.json();
    } else {
        const text = await response.text();
        payload = text ? { message: text } : null;
    }
    if (!response.ok) {
        throw new Error(payload?.message || 'Erro na comunicação com o servidor.');
    }
    return payload;
}

async function carregarDadosSistema() {
    const [maquinasRes, clientesRes, eventosRes, produtosRes, pagamentosRes, usuariosRes, configuracoesRes] = await Promise.all([
        apiFetch('/maquinas'),
        apiFetch('/clientes'),
        apiFetch('/eventos'),
        apiFetch('/produtos'),
        apiFetch('/pagamentos'),
        apiFetch('/usuarios'),
        apiFetch('/configuracoes')
    ]);
    maquinas = maquinasRes;
    clientes = clientesRes;
    eventos = eventosRes;
    produtos = produtosRes;
    pagamentos = pagamentosRes;
    usuarios = usuariosRes;
    configuracoes = configuracoesRes;
}

function setLoginError(message) {
    const box = document.getElementById('loginError');
    if (!box) return;
    const span = box.querySelector('span');
    if (span) span.textContent = message;
    box.classList.add('active');
}

async function refreshAllAndRender() {
    await carregarDadosSistema();
    atualizarSelects();
    renderizarListaMaquinas();
    renderizarListaClientes();
    renderizarListaEventos();
    renderizarListaProdutos();
    renderizarHistoricoPagamentos();
    renderizarListaUsuarios();
    renderDashboardIndicators();
    initCharts();
}

window.fazerLogin = async function fazerLoginApi() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    try {
        const usuario = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ usuario: username, senha: password })
        });
        usuarioLogado = usuario;
        if (rememberMe) {
            localStorage.setItem('klecoffee_user', JSON.stringify({ usuario: usuario.usuario, senha: usuario.senha }));
        } else {
            localStorage.removeItem('klecoffee_user');
        }
        await mostrarMainApp();
    } catch (error) {
        setLoginError(error.message || 'Usuário ou senha incorretos!');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
};

window.verificarLoginSalvo = async function verificarLoginSalvoApi() {
    const savedUser = localStorage.getItem('klecoffee_user');
    if (!savedUser) return;
    try {
        const user = JSON.parse(savedUser);
        const usuario = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ usuario: user.usuario, senha: user.senha })
        });
        usuarioLogado = usuario;
        await mostrarMainApp();
    } catch (_error) {
        localStorage.removeItem('klecoffee_user');
    }
};

const __mostrarMainAppOriginal = mostrarMainApp;
mostrarMainApp = async function mostrarMainAppApi() {
    await carregarDadosSistema();
    __mostrarMainAppOriginal();
};

window.salvarConfiguracoes = async function salvarConfiguracoesApi() {
    try {
        const payload = {
            tempoSessao: parseInt(document.getElementById('tempoSessao').value, 10),
            maxTentativas: parseInt(document.getElementById('maxTentativas').value, 10),
            exigirSenhaForte: document.getElementById('exigirSenhaForte').checked
        };
        await apiFetch('/configuracoes', { method: 'PUT', body: JSON.stringify(payload) });
        configuracoes = payload;
        alert('Configurações salvas com sucesso!');
    } catch (error) {
        alert(error.message);
    }
};

window.excluirMaquina = async function excluirMaquinaApi(id) {
    if (!confirm('Tem certeza que deseja excluir esta máquina?')) return;
    try {
        await apiFetch(`/maquinas/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};
window.excluirCliente = async function excluirClienteApi(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
        await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};
window.excluirEvento = async function excluirEventoApi(id) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
        await apiFetch(`/eventos/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};
window.excluirProduto = async function excluirProdutoApi(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
        await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};
window.excluirPagamento = async function excluirPagamentoApi(id) {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;
    try {
        await apiFetch(`/pagamentos/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};
window.excluirUsuario = async function excluirUsuarioApi(id) {
    if (id === 1) return alert('Não é possível excluir o usuário administrador principal!');
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
        await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};

window.registrarPagamentoCliente = async function registrarPagamentoClienteApi() {
    const clienteId = parseInt(document.getElementById('clientePagamento').value, 10);
    const mes = document.getElementById('mesReferencia').value;
    const data = document.getElementById('dataPagamentoCliente').value;
    if (!clienteId || !mes || !data) return alert('Preencha todos os campos');
    const cliente = clientes.find(c => c.id === clienteId);
    try {
        await apiFetch('/pagamentos', {
            method: 'POST',
            body: JSON.stringify({ tipo: 'cliente', clienteId, descricao: `Mensalidade - ${mes}`, valor: cliente?.valorLocacao || 0, data, status: 'pago' })
        });
        document.getElementById('clientePagamento').value = '';
        document.getElementById('mesReferencia').value = '';
        document.getElementById('dataPagamentoCliente').value = '';
        await refreshAllAndRender();
        alert('Pagamento registrado com sucesso!');
    } catch (error) { alert(error.message); }
};
window.registrarPagamentoEvento = async function registrarPagamentoEventoApi() {
    const eventoId = parseInt(document.getElementById('eventoPagamento').value, 10);
    const valorPago = parseFloat(document.getElementById('valorReceberEvento').value);
    const data = document.getElementById('dataPagamentoEvento').value;
    if (!eventoId || !valorPago || !data) return alert('Preencha todos os campos');
    const evento = eventos.find(e => e.id === eventoId);
    const valorTotal = parseFloat(document.getElementById('valorTotalEvento').value) || 0;
    const status = valorPago >= valorTotal ? 'pago' : 'parcial';
    try {
        await apiFetch('/pagamentos', {
            method: 'POST',
            body: JSON.stringify({ tipo: 'evento', eventoId, descricao: `${evento?.nomeEvento || 'Evento'} - ${status === 'pago' ? 'Total' : 'Parcial'}`, valor: valorPago, data, status })
        });
        document.getElementById('eventoPagamento').value = '';
        document.getElementById('valorReceberEvento').value = '';
        document.getElementById('dataPagamentoEvento').value = '';
        document.getElementById('valorTotalEvento').value = '';
        await refreshAllAndRender();
        alert('Pagamento registrado com sucesso!');
    } catch (error) { alert(error.message); }
};
window.registrarVendaAvulsa = async function registrarVendaAvulsaApi() {
    const produtoId = parseInt(document.getElementById('produtoVenda').value, 10);
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value, 10);
    const data = document.getElementById('dataVenda').value;
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.quantidade < quantidade) return alert('Quantidade insuficiente em estoque!');
    if (!produtoId || !quantidade || !data) return alert('Preencha todos os campos');
    try {
        await apiFetch('/pagamentos', {
            method: 'POST',
            body: JSON.stringify({ tipo: 'venda', produtoId, descricao: `${produto.nome} - ${quantidade} un`, valor: produto.valorVenda * quantidade, data, status: 'pago' })
        });
        await apiFetch(`/produtos/${produto.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...produto, quantidade: produto.quantidade - quantidade })
        });
        document.getElementById('produtoVenda').value = '';
        document.getElementById('quantidadeVenda').value = '1';
        document.getElementById('precoVenda').value = '';
        document.getElementById('totalVenda').value = '';
        document.getElementById('dataVenda').value = '';
        await refreshAllAndRender();
        alert('Venda registrada com sucesso!');
    } catch (error) { alert(error.message); }
};

window.salvarEdicao = async function salvarEdicaoApi() {
    const id = parseInt(document.getElementById('modalEdit').dataset.id, 10);
    const tipo = document.getElementById('modalEdit').dataset.tipo;
    try {
        if (tipo === 'maquina') {
            await apiFetch(`/maquinas/${id}`, { method: 'PUT', body: JSON.stringify({
                marca: document.getElementById('editMarca').value,
                modelo: document.getElementById('editModelo').value,
                sn: document.getElementById('editSn').value,
                valor: parseFloat(document.getElementById('editValor').value),
                imagem: document.getElementById('editImagem').value
            }) });
        } else if (tipo === 'cliente') {
            const clienteAtual = clientes.find(c => c.id === id);
            await apiFetch(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify({
                tipo: clienteAtual?.tipo || 'fixo',
                razaoSocial: document.getElementById('editRazaoSocial').value,
                cnpj: document.getElementById('editCnpj').value,
                nomeCompleto: document.getElementById('editNomeCompleto').value,
                cpf: document.getElementById('editCpf').value,
                contato: document.getElementById('editContato').value,
                email: document.getElementById('editEmail').value,
                logradouro: document.getElementById('editLogradouro').value,
                numero: document.getElementById('editNumero').value,
                complemento: clienteAtual?.complemento || '',
                bairro: clienteAtual?.bairro || '',
                cidade: document.getElementById('editCidade').value,
                uf: document.getElementById('editUf').value,
                cep: clienteAtual?.cep || '',
                maquinas: clienteAtual?.maquinas || [],
                valorLocacao: clienteAtual?.tipo === 'fixo' ? parseFloat(document.getElementById('editValorLocacao').value || 0) : null
            }) });
        } else if (tipo === 'evento') {
            const eventoAtual = eventos.find(e => e.id === id);
            await apiFetch(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify({
                ...eventoAtual,
                nomeEvento: document.getElementById('editNomeEvento').value,
                dataInicio: document.getElementById('editDataInicio').value,
                dataFim: document.getElementById('editDataFim').value,
                status: document.getElementById('editStatus').value
            }) });
        } else if (tipo === 'produto') {
            const compra = parseFloat(document.getElementById('editValorCompra').value);
            const venda = parseFloat(document.getElementById('editValorVenda').value);
            await apiFetch(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify({
                nome: document.getElementById('editNomeProduto').value,
                imagem: produtos.find(p => p.id === id)?.imagem || '',
                valorCompra: compra,
                valorVenda: venda,
                margem: ((venda - compra) / compra * 100),
                quantidade: parseInt(document.getElementById('editQuantidade').value, 10)
            }) });
        } else if (tipo === 'pagamento') {
            const pagamentoAtual = pagamentos.find(p => p.id === id);
            await apiFetch(`/pagamentos/${id}`, { method: 'PUT', body: JSON.stringify({
                ...pagamentoAtual,
                status: document.getElementById('editStatus').value,
                valor: document.getElementById('editValor') ? parseFloat(document.getElementById('editValor').value) : pagamentoAtual.valor
            }) });
        } else if (tipo === 'usuario') {
            const usuarioAtual = usuarios.find(u => u.id === id);
            const novaSenha = document.getElementById('editUsuarioSenha').value;
            const senhaFinal = novaSenha || usuarioAtual?.senha;
            if (novaSenha && !validarSenhaForte(novaSenha)) return alert('A senha não atende aos requisitos de segurança!');
            await apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify({
                nome: document.getElementById('editUsuarioNome').value,
                usuario: document.getElementById('editUsuarioLogin').value,
                senha: senhaFinal,
                email: document.getElementById('editUsuarioEmail').value,
                nivel: document.getElementById('editUsuarioNivel').value,
                status: document.getElementById('editUsuarioStatus').value
            }) });
        }
        fecharModalEdit();
        await refreshAllAndRender();
    } catch (error) { alert(error.message); }
};

function replaceNodeToClearListeners(id) {
    const original = document.getElementById(id);
    if (!original) return null;
    const clone = original.cloneNode(true);
    original.parentNode.replaceChild(clone, original);
    return clone;
}

function bindApiForms() {
    const formMaquina = replaceNodeToClearListeners('formMaquina');
    formMaquina?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/maquinas', { method: 'POST', body: JSON.stringify({
                marca: document.getElementById('marca').value,
                modelo: document.getElementById('modelo').value,
                sn: document.getElementById('sn').value,
                valor: parseFloat(document.getElementById('valor').value),
                imagem: document.getElementById('imagemUrl').value
            }) });
            e.target.reset();
            await refreshAllAndRender();
        } catch (error) { alert(error.message); }
    });

    const formProduto = replaceNodeToClearListeners('formProduto');
    formProduto?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const compra = parseFloat(document.getElementById('valorCompra').value);
        const venda = parseFloat(document.getElementById('valorVenda').value);
        try {
            await apiFetch('/produtos', { method: 'POST', body: JSON.stringify({
                nome: document.getElementById('nomeProduto').value,
                imagem: document.getElementById('imagemProduto').value,
                valorCompra: compra,
                valorVenda: venda,
                margem: ((venda - compra) / compra * 100),
                quantidade: parseInt(document.getElementById('quantidadeProduto').value, 10)
            }) });
            e.target.reset();
            await refreshAllAndRender();
        } catch (error) { alert(error.message); }
    });

    const formCliente = replaceNodeToClearListeners('formCliente');
    formCliente?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = document.querySelector('.tipo-option.active').dataset.tipo;
        const maquinasSelecionadas = tipo === 'fixo'
            ? [...document.querySelectorAll('input[name="clienteMaquinas"]:checked')].map(cb => parseInt(cb.value, 10))
            : [];
        try {
            await apiFetch('/clientes', { method: 'POST', body: JSON.stringify({
                tipo,
                razaoSocial: document.getElementById('razaoSocial').value,
                cnpj: document.getElementById('cnpj').value,
                nomeCompleto: document.getElementById('nomeCompleto').value,
                cpf: document.getElementById('cpf').value,
                contato: document.getElementById('contato').value,
                email: document.getElementById('email').value,
                logradouro: document.getElementById('logradouro').value,
                numero: document.getElementById('numero').value,
                complemento: document.getElementById('complemento').value,
                bairro: document.getElementById('bairro').value,
                cidade: document.getElementById('cidade').value,
                uf: document.getElementById('uf').value,
                cep: document.getElementById('cep').value,
                maquinas: maquinasSelecionadas,
                valorLocacao: tipo === 'fixo' ? parseFloat(document.getElementById('valorLocacao').value || 0) : null
            }) });
            e.target.reset();
            await refreshAllAndRender();
        } catch (error) { alert(error.message); }
    });

    const formEvento = replaceNodeToClearListeners('formEvento');
    formEvento?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const maquinasSelecionadas = [...document.querySelectorAll('input[name="eventoMaquinas"]:checked')].map(cb => parseInt(cb.value, 10));
        const insumosSelecionados = [...document.querySelectorAll('.insumo-qtd')]
            .map(input => ({ id: parseInt(input.dataset.id, 10), quantidade: parseInt(input.value, 10) || 0 }))
            .filter(item => item.quantidade > 0);
        try {
            await apiFetch('/eventos', { method: 'POST', body: JSON.stringify({
                clienteId: parseInt(document.getElementById('clienteOrganizador').value, 10),
                nomeEvento: document.getElementById('nomeEvento').value,
                dataInicio: document.getElementById('dataInicio').value,
                dataFim: document.getElementById('dataFim').value,
                logradouro: document.getElementById('eventoLogradouro').value,
                numero: document.getElementById('eventoNumero').value,
                bairro: '',
                cidade: document.getElementById('eventoCidade').value,
                uf: document.getElementById('eventoUf').value,
                cep: '',
                maquinas: maquinasSelecionadas,
                insumos: insumosSelecionados,
                status: 'proximo',
                observacoes: document.getElementById('observacoes').value
            }) });
            for (const item of insumosSelecionados) {
                const produto = produtos.find(p => p.id === item.id);
                if (produto) {
                    await apiFetch(`/produtos/${produto.id}`, { method: 'PUT', body: JSON.stringify({ ...produto, quantidade: produto.quantidade - item.quantidade }) });
                }
            }
            e.target.reset();
            await refreshAllAndRender();
        } catch (error) { alert(error.message); }
    });

    const formUsuario = replaceNodeToClearListeners('formUsuario');
    formUsuario?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const senha = document.getElementById('usuarioSenha').value;
        if (senha !== document.getElementById('usuarioConfirmarSenha').value) return alert('As senhas não coincidem!');
        if (!validarSenhaForte(senha)) return alert('A senha deve atender às regras de segurança!');
        if (usuarios.some(u => u.usuario === document.getElementById('usuarioLogin').value)) return alert('Este nome de usuário já existe!');
        try {
            await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify({
                nome: document.getElementById('usuarioNome').value,
                usuario: document.getElementById('usuarioLogin').value,
                senha,
                email: document.getElementById('usuarioEmail').value,
                nivel: document.getElementById('usuarioNivel').value,
                status: 'ativo'
            }) });
            e.target.reset();
            await refreshAllAndRender();
            alert('Usuário criado com sucesso!');
        } catch (error) { alert(error.message); }
    });
}

async function bootstrapApiApp() {
    try {
        await carregarDadosSistema();
        bindApiForms();
        await verificarLoginSalvo();
    } catch (error) {
        console.error(error);
        setLoginError(`Falha ao conectar com a API/MySQL: ${error.message}`);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    bootstrapApiApp();
});
