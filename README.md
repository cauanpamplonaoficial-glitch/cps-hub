Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
# CPS Hub V2 — CRM das operações CPS

Aplicação Next.js com TypeScript, React, CSS próprio e Supabase. CPS Store e Apple Royal compartilham a autenticação e navegação, mantendo seus fluxos financeiros separados.

## Rodar localmente

Requisitos: Node.js 22.6 ou superior e pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Para validar antes de enviar alterações, rode `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm build`.

Configure as variáveis de ambiente usando `.env.example` como referência. Use somente o Supabase de teste autorizado. Nunca coloque service-role keys no navegador.

## Módulos

- **Visão geral e CPS Store:** produtos, clientes, fornecedores, vendas, compras, estoque, despesas, movimentações, importações históricas e métricas financeiras.
- **Apple Royal:** aparelhos, reservas, vendas vinculadas ou expressas, recebimentos, repasses, entregas, pós-venda, documentos e conciliação.
- O módulo de Consórcios foi retirado da interface a pedido do usuário. Leads, atividades e migrações já existentes permanecem preservados no Supabase; nenhum dado foi apagado.
- Navegação responsiva entre CPS Store e Apple Royal; dados por proprietário protegidos com RLS.

## Integridade e segurança

- O Supabase de teste autorizado é `abxmblwgsuiayfhkwzvu`. O projeto antigo `ybvwhejfwxtlsmvtnoua` não deve ser alterado.
- Vendas, compras, estoque e fluxos financeiros Apple Royal usam operações transacionais quando disponíveis; cancelamentos preservam registros originais e registram reversões.
- O arquivo V1 preserva dados históricos; não reaplicar movimentações antigas ao saldo atual.
- A chave publishable é destinada ao cliente; RLS e funções `SECURITY INVOKER` devem permanecer restritas.
- Dependências são fixadas em `pnpm-lock.yaml`; CI instala com `--frozen-lockfile`.

## Validação e limites atuais

- Em 2026-10-15, 11 testes automatizados, Biome lint, `tsc --noEmit`, build estático das rotas `/` e `/apple-royal` e `git diff --check` passaram.
- A prévia local responde em `http://127.0.0.1:4175/` enquanto o servidor e o Codex permanecerem abertos. A revisão autenticada conferiu dashboard e troca de módulos em 1.350 px e 304 px; as duas rotas não estouraram a largura móvel. O formulário de venda expressa foi conferido em 304 px e fechado sem gravar dados.
- A comparação mais recente consultou somente IDs técnicos do Base44: os 870 IDs atuais correspondem ao arquivo V1 do Supabase, sem faltantes ou extras. A verificação anterior também confirmou payloads idênticos para os 22 registros arquivados com autorização e nenhuma alteração nas tabelas operacionais.
- Ainda faltam teste de isolamento com uma segunda conta real e validação de backup/restauração. A revisão visual autenticada dos dois módulos foi concluída nesta sessão.
- O Security Advisor do Supabase de teste alerta que a proteção contra senhas vazadas está desativada; essa configuração exige revisão no painel.
- A migração `20261015173445_harden_ledger_table_privileges` removeu grants de escrita anônima e bloqueou alterações/exclusões diretas dos livros append-only no Supabase de teste. Os cabeçalhos financeiros ainda aceitam `UPDATE` autenticado fora das RPCs; isso precisa ser restringido e validado antes de uso comercial.
- O histórico de migrações ainda precisa ser reconciliado: o Supabase registra 29 versões, enquanto a pasta local tem 22 arquivos com versões divergentes/consolidadas. Não rode `supabase db push` até alinhar e verificar esse histórico.
- O GitHub Pages publica a interface estática no ambiente Supabase de testes autorizado; o workflow não aplica migrações no banco. Não use dados reais até configurar e validar um projeto de produção autorizado.

Consulte [REBUILD-PLAN.md](./REBUILD-PLAN.md), [AUDIT-2026-10-13.md](./AUDIT-2026-10-13.md) e [DEPLOYMENT.md](./DEPLOYMENT.md) para detalhes.

