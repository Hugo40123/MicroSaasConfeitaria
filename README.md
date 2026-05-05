# MicroSaasConfeitaria

MVP inicial de um sistema SaaS para pequenas confeitarias, com painel da loja e portal publico para clientes fazerem pedidos.

## Stack recomendada

- Next.js + React + TypeScript
- PostgreSQL
- Prisma
- Supabase para Auth, Postgres e Storage em uma proxima etapa

## Rotas principais

- `/app`: painel da loja
- `/app/pedidos`: gestao de pedidos e atualizacao de status
- `/app/agenda`: agenda de producao
- `/app/produtos`: cadastro, edicao, ativacao e visibilidade online de produtos
- `/app/clientes`: cadastro de clientes
- `/app/financeiro`: caixa simples
- `/app/relatorios`: relatorios
- `/app/configuracoes`: dados da loja e venda online
- `/login`: entrada do usuario da loja
- `/cadastro`: cadastro inicial da loja
- `/loja/doce-maria`: portal publico do cliente
- `/pedido/BM-1042`: acompanhamento do pedido
- `/api/orders`: endpoint REST de pedidos com fallback mock/Prisma

## Como rodar

```bash
npm install
npm run dev
```

Depois abra:

```txt
http://localhost:3000
```

## Banco de dados

O schema inicial esta em `prisma/schema.prisma`, e a conexao fica em `prisma.config.ts`, seguindo o padrao do Prisma 7.

Para desenvolvimento local, o projeto inclui um `docker-compose.yml` com PostgreSQL. Suba o banco e rode a preparacao:

```bash
docker compose up -d postgres
cp .env.example .env
```

Depois rode:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

Para detalhes de banco local, banco remoto e deploy de migrations, consulte `docs/BANCO_DE_DADOS.md`.

## Proxima etapa

Configurar upload de imagens de produtos.

## Resumo leigo das funcoes atuais

- A loja consegue ver um painel com resumo de pedidos.
- O cliente consegue acessar um cardapio publico e enviar pedido.
- O pedido entra como aguardando confirmacao.
- O sistema ja esta preparado para gravar pedidos e produtos no PostgreSQL.
- Agora tambem existe base de cadastro/login para a loja, com sessao segura quando houver banco real.
- O painel interno ja exige login e permite sair da conta.
- Produtos, pedidos e link do portal agora usam a loja do usuario logado quando ha banco real.
- O painel de produtos ja permite criar, editar, ativar/desativar e controlar visibilidade no portal quando houver PostgreSQL real.
- O painel de pedidos ja permite confirmar, avancar, cancelar e corrigir status quando houver PostgreSQL real.
- A pagina publica de acompanhamento reflete o status real do pedido.
- Usuarios `ADMIN` acessam produtos, financeiro, relatorios e configuracoes.
- Usuarios `ATTENDANT` acessam operacao diaria: resumo, pedidos, agenda, clientes e portal.

## Acessos de desenvolvimento

Sem PostgreSQL real, o fallback aceita qualquer senha. Use:

- Admin mock: `admin@demo.local`
- Atendente mock: `atendente@demo.local`

Com PostgreSQL real e `npm run db:seed`, use:

- Admin: `admin@docemaria.local` / `admin123`
- Atendente: `atendente@docemaria.local` / `atendente123`

## Versionamento

Este projeto deve ser mantido em Git. Arquivos sensiveis e gerados, como `.env`, `.next`, `node_modules` e logs, ficam fora do versionamento.

Para continuar o desenvolvimento em outra conta ou maquina, consulte `docs/CONTINUAR_DESENVOLVIMENTO.md`.
