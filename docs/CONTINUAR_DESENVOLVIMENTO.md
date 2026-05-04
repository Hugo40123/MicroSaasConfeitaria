# Como continuar o desenvolvimento

Este documento existe para permitir que o projeto seja retomado por outra pessoa, outra máquina ou outra conta do Codex sem depender do histórico desta conversa.

## Stack

- Node.js 22.19.0
- Next.js 16
- React
- TypeScript
- Prisma 7
- PostgreSQL

## Primeira execução

1. Instale a versão de Node indicada em `.node-version` ou `.nvmrc`.
2. Instale as dependências:

```bash
npm install
```

3. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` quando houver banco real.
4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Rode em desenvolvimento:

```bash
npm run dev
```

## Validação

Antes de salvar mudanças importantes, rode:

```bash
npm run typecheck
npm run build
```

## Rotas importantes

- `/app`: painel da loja
- `/app/pedidos`: pedidos
- `/app/agenda`: agenda de produção
- `/app/produtos`: produtos
- `/app/clientes`: clientes
- `/app/financeiro`: financeiro
- `/app/relatorios`: relatórios
- `/app/configuracoes`: configurações
- `/loja/doce-maria`: portal público do cliente
- `/pedido/BM-1042`: acompanhamento do pedido
- `/api/orders`: API inicial de pedidos

## Regras de desenvolvimento

- Não versionar `.env`, `.next`, `node_modules`, logs ou arquivos de cache.
- Manter dados sensíveis apenas em `.env`.
- Todo dado operacional deve ser filtrado por `storeId`.
- Preferir componentes pequenos e reutilizáveis em `src/components`.
- Preferir regras e dados compartilhados em `src/lib`.
- Antes de uma mudança grande, criar um commit pequeno com o estado estável atual.

## Próximas etapas técnicas

1. Conectar banco PostgreSQL real.
2. Criar autenticação de usuários e lojas.
3. Trocar dados mockados por Prisma.
4. Persistir pedidos do portal do cliente.
5. Adicionar permissões de Admin e Atendente.
6. Configurar upload de imagens de produtos.
7. Criar integração com WhatsApp e geração de recibo.

## Backup remoto

O Git local protege o histórico dentro desta pasta. Para proteger contra perda da máquina, pasta ou conta, envie o repositório para um serviço remoto como GitHub, GitLab ou Bitbucket.

Fluxo recomendado depois de criar o repositório remoto:

```bash
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```
