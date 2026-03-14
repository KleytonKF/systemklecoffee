
# KleCoffee System · MySQL + EasyPanel

Este projeto mantém o sistema em **HTML + CSS + JS** no frontend e adiciona um **backend Node/Express** para gravar tudo no **MySQL**.

## Estrutura

- `public/` → frontend
- `src/` → backend Express + API
- `database.sql` → criação das tabelas e dados iniciais
- `.env.example` → variáveis de ambiente

## Instalação local

```bash
npm install
cp .env.example .env
# edite o .env
npm run db:init
npm run dev
```

## Variáveis de ambiente

Defina no Easypanel:

- `PORT=3000`
- `SESSION_SECRET=uma-chave-forte`
- `MYSQL_URL=mysql://Kletrotsk:Bosite32*@sistema_klecoffee_klecoffeesystem_db:3306/klecoffeesystem_db`

## Deploy no Easypanel

Crie um serviço **App**, conecte ao repositório GitHub, e configure:

- Build Command: `npm install`
- Start Command: `npm start`
- Porta interna: `3000`
- Domínio: `https://sistema.klecoffee.site/`

No Easypanel, use a aba **Environment** para definir as variáveis e faça um novo deploy. Easypanel recomenda configurar apps web em **Domain & Proxy** e definir variáveis em **Environment**. citeturn372032search0turn372032search3turn372032search16

## Banco

Rode uma vez:

```bash
npm run db:init
```

Isso cria as tabelas e popula usuários/configurações padrão.

## Login inicial

- Usuário: `kleber`
- Senha: `123456`

## Logo

Coloque a logo em:

- `public/img/logo-klecoffee.png`

Se o arquivo existir, ele aparece automaticamente no menu.
