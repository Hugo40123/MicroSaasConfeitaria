# Decisoes tecnicas

## Linguagem e framework

O projeto usa TypeScript com Next.js para manter frontend, backend e APIs na mesma base. Isso facilita integracoes futuras com WhatsApp, pagamentos, PDF, webhooks e automacoes.

## Banco de dados

O banco recomendado e PostgreSQL. A modelagem inicial esta em `prisma/schema.prisma` e segue o principio multi-tenant: os dados principais pertencem a uma loja por `storeId`.

## Prisma

O projeto usa Prisma 7. Nessa versao, a URL do banco fica em `prisma.config.ts`, e nao diretamente no `schema.prisma`.

No runtime, o Prisma Client usa `@prisma/adapter-pg`. Enquanto `DATABASE_URL` estiver com o placeholder local de exemplo, a API mantem fallback para dados mockados. Quando `DATABASE_URL` apontar para um PostgreSQL real, os pedidos do portal passam a ser gravados no banco.

## Estrutura de rotas

- `src/app/app`: painel interno da loja.
- `src/app/login`: entrada do usuario.
- `src/app/cadastro`: cadastro inicial de loja e admin.
- `src/app/loja/[slug]`: portal publico do cliente.
- `src/app/pedido/[codigo]`: acompanhamento publico de pedido.
- `src/app/api`: endpoints REST.

## Autenticacao

A base de autenticacao usa senha com hash via `crypto.scrypt`, cookie HTTP-only e tabela `Session`. Sem banco real, as rotas de login/cadastro usam modo mock para manter o fluxo testavel.

## Estado atual

A interface esta funcional com fallback mock/Prisma para pedidos e produtos. Tambem existe base de cadastro/login. O proximo passo e proteger o painel e fazer os dados internos dependerem da loja logada.
