# KleCoffee com MySQL para EasyPanel

Este pacote mantém a interface do sistema e troca o armazenamento local por MySQL via Node.js + Express.

## Estrutura
- `backend/public/` → frontend (HTML, CSS, JS e pasta `img`)
- `backend/server.js` → servidor + API + arquivos estáticos
- `backend/db.js` → conexão MySQL
- `backend/schema.sql` → estrutura do banco + dados iniciais
- `backend/.env` → variáveis com a conexão fornecida

## Como subir no EasyPanel
1. Suba a pasta `backend` como app Node.js.
2. Comando de start: `npm start`
3. Porta: `3000`
4. As variáveis já estão no arquivo `.env`, mas você também pode cadastrar no painel.
5. Importe o arquivo `schema.sql` no banco `klecoffeesystem_db`.

## Observações
- O front agora salva e lê do MySQL pela API.
- A estética foi preservada na medida do possível.
- O acesso continua em `usuario/senha` da tabela `usuarios`.
- A logo continua em `backend/public/img/logo-klecoffee.png`.
