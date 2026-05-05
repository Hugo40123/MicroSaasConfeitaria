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
- `src/app/loja/[slug]`: portal publico do cliente.
- `src/app/pedido/[codigo]`: acompanhamento publico de pedido.
- `src/app/api`: endpoints REST.

## Estado atual

A interface esta funcional com dados mockados e a API de pedidos ja tem fallback para Prisma/PostgreSQL. O proximo passo e conectar as telas internas ao banco real e adicionar autenticacao.
