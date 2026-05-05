# Deploy

Este guia descreve como publicar o MVP com PostgreSQL remoto.

## Variaveis de ambiente

Configure no provedor de deploy:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

Use uma `DATABASE_URL` real. O placeholder `postgresql://user:password@localhost:5432`
ativa o modo mock e nao deve ser usado em producao.

## Banco

1. Crie um PostgreSQL remoto.
2. Configure `DATABASE_URL`.
3. Rode migrations:

```bash
npm run prisma:deploy
```

4. Rode seed apenas em ambiente de teste/homologacao:

```bash
npm run db:seed
```

Em producao real, prefira criar a primeira loja pela tela `/cadastro`.

## Build

Antes de publicar:

```bash
npm run typecheck
npm run build
```

## Uploads

O upload atual salva arquivos em `public/uploads/products`. Isso funciona para
desenvolvimento e servidores com disco persistente. Em plataformas serverless,
migre esse ponto para Supabase Storage, S3 ou outro storage persistente antes de
usar em producao.

## Checklist

- `DATABASE_URL` aponta para PostgreSQL remoto.
- `NEXT_PUBLIC_APP_URL` aponta para o dominio final.
- Migrations foram aplicadas com `npm run prisma:deploy`.
- A primeira loja admin foi criada em `/cadastro`.
- Testar login, produtos, pedido no portal, status, clientes, agenda e financeiro.
