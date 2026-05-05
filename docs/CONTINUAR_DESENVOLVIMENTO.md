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

3. Suba um PostgreSQL local ou configure um PostgreSQL remoto. Para local:

```bash
docker compose up -d postgres
```

4. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` se estiver usando banco remoto.
5. Gere o Prisma Client:

```bash
npm run prisma:generate
```

6. Rode as migrations e o seed:

```bash
npm run prisma:migrate
npm run db:seed
```

7. Rode em desenvolvimento:

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
- `/app/pedidos`: pedidos e atualizacao de status
- `/app/agenda`: agenda de producao
- `/app/produtos`: produtos, edicao, status e visibilidade online
- `/app/clientes`: clientes
- `/app/financeiro`: financeiro
- `/app/relatorios`: relatorios
- `/app/configuracoes`: configuracoes
- `/login`: entrada do usuario da loja
- `/cadastro`: cadastro inicial da loja
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

A autenticacao tambem usa fallback:

- Sem PostgreSQL real, login/cadastro simulam a entrada para manter a interface testavel.
- Com PostgreSQL real, cadastro cria loja, usuario admin e sessao no banco.
- O painel `/app` exige cookie de sessao; sem sessao valida, redireciona para `/login`.
- Produtos, pedidos, configuracoes basicas e link do portal usam `storeId`/`storeSlug` do usuario logado quando ha banco real.
- A API `GET /api/orders` exige sessao para listar pedidos da loja logada.
- O CRUD de produtos usa Server Actions, valida preco/categoria/prazos e grava sempre filtrando por `storeId`.
- Sem PostgreSQL real, a tela de produtos continua mostrando dados de exemplo, mas desabilita gravacao para evitar falsa persistencia.
- A gestao de status de pedidos usa Server Actions e sempre confirma `storeId` antes de alterar um pedido.
- Sem PostgreSQL real, a tela de pedidos continua mostrando dados de exemplo, mas desabilita alteracao de status.
- A pagina publica `/pedido/[codigo]` mostra uma timeline baseada no status real do pedido.
- Permissoes:
  - `ADMIN`: acesso completo a produtos, financeiro, relatorios e configuracoes.
  - `ATTENDANT`: acesso operacional a resumo, pedidos, agenda, clientes e portal.
- Sem PostgreSQL real, use `admin@demo.local` ou `atendente@demo.local` com qualquer senha para testar os papeis.
- Com seed em PostgreSQL real, use `admin@docemaria.local` / `admin123` e `atendente@docemaria.local` / `atendente123`.
- Upload de produtos:
  - imagens JPG, PNG e WebP ate 2 MB;
  - arquivos locais em `public/uploads/products`;
  - URL salva em `Product.imageUrl` e exibida no painel e no portal.

## Proximas etapas tecnicas

1. Conectar o PostgreSQL local/remoto seguindo `docs/BANCO_DE_DADOS.md`.
2. Rodar migrations e seed.
3. Salvar configuracoes reais da loja.
4. Criar pedido interno pelo painel.
5. Listar clientes reais do banco.
6. Criar agenda real de producao.
7. Criar financeiro real.
8. Criar integracao com WhatsApp e geracao de recibo.

## Backup remoto

O Git local protege o historico dentro desta pasta. Para proteger contra perda da maquina, pasta ou conta, mantenha o repositorio sincronizado com o GitHub:

```bash
git status
git push
```
