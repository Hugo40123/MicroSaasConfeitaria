# MicroSaasConfeitaria

MVP inicial de um sistema SaaS para pequenas confeitarias, com painel da loja e portal publico para clientes fazerem pedidos.

## Stack recomendada

- Next.js + React + TypeScript
- PostgreSQL
- Prisma
- Supabase para Auth, Postgres e Storage em uma proxima etapa

## Rotas principais

- `/app`: painel da loja
- `/app/pedidos`: gestao de pedidos
- `/app/agenda`: agenda de producao
- `/app/produtos`: cadastro de produtos
- `/app/clientes`: cadastro de clientes
- `/app/financeiro`: caixa simples
- `/app/relatorios`: relatorios
- `/app/configuracoes`: dados da loja e venda online
- `/loja/doce-maria`: portal publico do cliente
- `/pedido/BM-1042`: acompanhamento do pedido
- `/api/orders`: endpoint REST inicial com dados mockados

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

Quando houver um PostgreSQL configurado, copie `.env.example` para `.env`, ajuste `DATABASE_URL` e rode:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Proxima etapa

Conectar autenticacao, persistencia real com Prisma e criacao de pedidos do portal gravando no banco da loja correta por `storeId`.

## Versionamento

Este projeto deve ser mantido em Git. Arquivos sensiveis e gerados, como `.env`, `.next`, `node_modules` e logs, ficam fora do versionamento.

Para continuar o desenvolvimento em outra conta ou maquina, consulte `docs/CONTINUAR_DESENVOLVIMENTO.md`.
