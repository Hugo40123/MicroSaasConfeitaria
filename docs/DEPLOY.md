# Deploy

Este guia descreve como publicar o MVP com PostgreSQL remoto.

## Variaveis de ambiente

Configure no provedor de deploy:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
UPLOAD_STORAGE_DRIVER="supabase"
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
SUPABASE_STORAGE_BUCKET="product-images"
```

Use uma `DATABASE_URL` real. O placeholder `postgresql://user:password@localhost:5432`
ativa o modo mock e nao deve ser usado em producao.

Observacao: o projeto usa Prisma 7. Por isso, `prisma/schema.prisma` mantem
apenas `provider = "postgresql"` e `prisma.config.ts` usa `DIRECT_URL` para CLI
e migrations. O runtime da aplicacao usa `DATABASE_URL` via adapter PostgreSQL.

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

5. Verifique a conexao e as tabelas principais:

```bash
npm run db:verify
```

## Build

Antes de publicar:

```bash
npm run homologation:check
npm run typecheck
npm run build
```

Depois de publicar, rode o smoke test apontando para a URL final:

```bash
SMOKE_BASE_URL=https://seu-dominio.com npm run smoke
```

Se estiver usando os usuarios criados pelo seed:

```bash
SMOKE_BASE_URL=https://seu-dominio.com SMOKE_ADMIN_EMAIL=admin@docemaria.local SMOKE_ADMIN_PASSWORD=admin123 SMOKE_ATTENDANT_EMAIL=atendente@docemaria.local SMOKE_ATTENDANT_PASSWORD=atendente123 npm run smoke
```

O endpoint `/api/health` retorna:

- `200` quando banco e storage estao prontos.
- `503` quando o app sobe, mas ainda falta banco real ou storage persistente.

## Uploads

O upload usa `UPLOAD_STORAGE_DRIVER`.

- `local`: salva em `public/uploads/products`; bom para desenvolvimento.
- `supabase`: envia para Supabase Storage; recomendado para deploy serverless.

Para Supabase Storage:

1. Crie um bucket publico, por exemplo `product-images`.
2. Configure `SUPABASE_URL`.
3. Configure `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor/provedor de deploy.
4. Configure `SUPABASE_STORAGE_BUCKET`.

## Checklist

- `DATABASE_URL` aponta para PostgreSQL remoto.
- `DIRECT_URL` aponta para conexao direta usada em migrations.
- `NEXT_PUBLIC_APP_URL` aponta para o dominio final.
- `UPLOAD_STORAGE_DRIVER` aponta para `supabase` em deploy serverless.
- Migrations foram aplicadas com `npm run prisma:deploy`.
- Banco foi verificado com `npm run db:verify`.
- A primeira loja admin foi criada em `/cadastro`.
- Testar login, produtos, pedido no portal, status, clientes, agenda e financeiro.
