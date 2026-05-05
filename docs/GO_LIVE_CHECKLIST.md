# Checklist de primeira versão

Use este checklist antes de colocar uma loja real para vender.

## Dados reais da loja

- Atualize nome da loja, slug público, WhatsApp e endereço em `Configurações`.
- Cadastre produtos reais em `Produtos`, com preço, categoria, prazo e imagem.
- Deixe online apenas os produtos que podem aparecer no portal do cliente.
- Remova ou desative produtos de teste antes de divulgar o link público.

## Segurança mínima

- Troque a senha do admin padrão antes de operar com cliente real.
- Crie atendentes individuais em vez de compartilhar a conta admin.
- Não coloque `DATABASE_URL`, `DIRECT_URL` ou chaves Supabase em arquivos versionados.
- Configure variáveis sensíveis apenas no Supabase, Vercel ou `.env` local ignorado pelo Git.

Para rotacionar senhas por script:

```env
ROTATE_ADMIN_EMAIL="admin@docemaria.local"
ROTATE_ADMIN_PASSWORD="senha-forte-do-admin"
ROTATE_ATTENDANT_EMAIL="atendente@docemaria.local"
ROTATE_ATTENDANT_PASSWORD="senha-forte-do-atendente"
```

Depois rode:

```bash
npm run db:rotate-passwords
```

## Seed em novo ambiente

Antes de rodar `npm run db:seed`, defina:

```env
SEED_ADMIN_PASSWORD="troque-por-uma-senha-forte"
SEED_ATTENDANT_PASSWORD="troque-por-outra-senha-forte"
```

As demais variáveis `SEED_*` permitem subir uma loja inicial com dados reais sem editar código.

## Homologação

- Teste login, criação de produto, upload de imagem e publicação no portal.
- Crie um pedido real pelo celular e acompanhe em `Pedidos`.
- Altere o status do pedido e confira a página `/pedido/[codigo]`.
- Confira se o pedido aparece em agenda, financeiro e relatórios.
- Rode `npm run smoke` depois de cada deploy importante.
