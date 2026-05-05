# Banco de dados

Este projeto usa PostgreSQL com Prisma 7. A URL de conexao fica em `.env` e e lida pelo arquivo `prisma.config.ts`.

## Opcao local com Docker

1. Suba o PostgreSQL:

```bash
docker compose up -d postgres
```

2. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

3. Gere o Prisma Client:

```bash
npm run prisma:generate
```

4. Aplique as migrations:

```bash
npm run prisma:migrate
```

5. Popule dados iniciais:

```bash
npm run db:seed
```

6. Rode a aplicacao:

```bash
npm run dev
```

## Banco remoto

Para Supabase, Neon, Railway ou outro PostgreSQL gerenciado, substitua `DATABASE_URL` no `.env` pela connection string do provedor.

Em ambiente de producao ou deploy automatizado, use:

```bash
npm run prisma:deploy
```

## Regras importantes

- Nunca versionar `.env`.
- Versionar sempre `prisma/schema.prisma` e `prisma/migrations`.
- Criar uma nova migration para toda alteracao estrutural no banco.
- Rodar `npm run typecheck` e `npm run build` antes de enviar alteracoes importantes.
