# KleCoffee System

Sistema simples em HTML, CSS, JS + Node.js + MySQL para rodar no EasyPanel.

## Funções
- Login e senha
- Dashboard com alertas de manutenção e estoque baixo
- Cadastro de máquinas com foto
- Cadastro de clientes fixos ou evento
- Cadastro de eventos
- Cadastro de produtos com foto
- Registro de pagamentos
- Venda de produtos baixando estoque automaticamente

## Login inicial
- Email: admin@klecoffee.com
- Senha: admin123

## Como subir no EasyPanel
1. Crie um app Node.js apontando para este repositório.
2. Build command: `npm install`
3. Start command: `npm start`
4. Porta: `3000`
5. Crie um banco MySQL no EasyPanel.
6. Importe o arquivo `schema.sql`.
7. Configure as variáveis de ambiente usando `.env.example` como base.

## Observações
- As fotos ficam salvas na pasta `/uploads`.
- Em produção, monte volume persistente para `uploads`.
- Este projeto é uma base inicial. Você pode evoluir com edição/exclusão, permissões, relatórios e exportação PDF.
