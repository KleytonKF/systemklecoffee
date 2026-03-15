const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/maquinas', require('./routes/maquinas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/eventos', require('./routes/eventos'));
app.use('/api/estoque', require('./routes/estoque'));
app.use('/api/pagamentos', require('./routes/pagamentos'));

// Rota principal - redireciona para o dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Acesse: http://localhost:${PORT}`);
});