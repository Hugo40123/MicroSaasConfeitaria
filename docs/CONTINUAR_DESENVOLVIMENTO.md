# Como continuar o desenvolvimento

Este documento permite retomar o projeto em outra maquina, outra conta do Codex ou outro editor sem depender do historico desta conversa.

## Stack

- Node.js 22.19.0
- Next.js 16
- React
- TypeScript
- Prisma 7
- PostgreSQL

## Primeira execucao

1. Instale a versao de Node indicada em `.node-version` ou `.nvmrc`.
2. Instale as dependencias:

```bash
npm install
```

3. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` quando houver banco real.
4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Quando houver PostgreSQL real, rode as migrations e o seed:

```bash
npm run prisma:migrate
npm run db:seed
```

6. Rode em desenvolvimento:

```bash
npm run dev
```

## Validacao

Antes de salvar mudancas importantes, rode:

```bash
npm run typecheck
npm run build
```

## Rotas importantes

- `/app`: painel da loja
- `/app/pedidos`: pedidos
- `/app/agenda`: agenda de producao
- `/app/produtos`: produtos
- `/app/clientes`: clientes
- `/app/financeiro`: financeiro
- `/app/relatorios`: relatorios
- `/app/configuracoes`: configuracoes
- `/loja/doce-maria`: portal publico do cliente
- `/pedido/BM-1042`: acompanhamento do pedido
- `/api/orders`: API de pedidos

## Regras de desenvolvimento

- Nao versionar `.env`, `.next`, `node_modules`, logs ou arquivos de cache.
- Manter dados sensiveis apenas em `.env`.
- Todo dado operacional deve ser filtrado por `storeId`.
- Preferir componentes pequenos e reutilizaveis em `src/components`.
- Preferir regras e dados compartilhados em `src/lib`.
- Antes de uma mudanca grande, criar um commit pequeno com o estado estavel atual.

## Estado atual da persistencia

A API de pedidos usa fallback automatico:

- Se `DATABASE_URL` estiver com o placeholder do `.env.example`, usa dados mockados.
- Se `DATABASE_URL` apontar para um PostgreSQL real, usa Prisma e grava pedidos no banco.

## Proximas etapas tecnicas

1. Conectar um PostgreSQL real.
2. Rodar migrations e seed.
3. Criar autenticacao de usuarios e lojas.
4. Trocar telas internas para leitura do banco.
5. Adicionar permissoes de Admin e Atendente.
6. Configurar upload de imagens de produtos.
7. Criar integracao com WhatsApp e geracao de recibo.

## Backup remoto

O Git local protege o historico dentro desta pasta. Para proteger contra perda da maquina, pasta ou conta, mantenha o repositorio sincronizado com o GitHub:

```bash
git status
git push
```
