# Sistema KleCoffee

Sistema simples e bonito para a KleCoffee com:

- Dashboard
- Cadastro de máquinas de café
- Listagem das máquinas cadastradas
- Integração com MySQL via Easypanel

## 1) Instalação

```bash
npm install
```

## 2) Configuração do banco

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`.

Exemplo:

```env
PORT=3000
DB_HOST=sistema_klecoffee_klecoffeesystem_db
DB_PORT=3306
DB_USER=Kletrotsk
DB_PASSWORD=Bosite32*
DB_NAME=klecoffeesystem_db
```

## 3) Rodar o sistema

```bash
npm start
```

## 4) Estrutura criada automaticamente

Ao iniciar, o sistema cria a tabela abaixo caso ela não exista:

```sql
CREATE TABLE maquinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  marca VARCHAR(120) NOT NULL,
  status_maquina ENUM('Disponível', 'Em uso', 'Manutenção') NOT NULL DEFAULT 'Disponível',
  localizacao VARCHAR(150) DEFAULT NULL,
  patrimonio VARCHAR(80) DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5) Observação

No Easypanel, normalmente o `DB_HOST` interno é o nome interno do serviço do banco.
