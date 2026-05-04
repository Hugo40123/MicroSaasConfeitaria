# Decisões técnicas

## Linguagem e framework

O projeto usa TypeScript com Next.js para manter frontend, backend e APIs na mesma base. Isso facilita integrações futuras com WhatsApp, pagamentos, PDF, webhooks e automações.

## Banco de dados

O banco recomendado é PostgreSQL. A modelagem inicial está em `prisma/schema.prisma` e já segue o princípio multi-tenant: os dados principais pertencem a uma loja por `storeId`.

## Prisma

O projeto usa Prisma 7. Nessa versão, a URL do banco fica em `prisma.config.ts`, e não diretamente no `schema.prisma`.

## Estrutura de rotas

- `src/app/app`: painel interno da loja.
- `src/app/loja/[slug]`: portal público do cliente.
- `src/app/pedido/[codigo]`: acompanhamento público de pedido.
- `src/app/api`: endpoints REST.

## Estado atual

A interface está funcional com dados mockados. O próximo passo é substituir esses dados por leitura e escrita no banco usando Prisma.
