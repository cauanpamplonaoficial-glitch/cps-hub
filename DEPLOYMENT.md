# CPS Hub V2 — publicação e segurança

## Publicação
O GitHub Actions executa TypeScript, Biome lint e build. Publica `out` no GitHub Pages somente após push em `main`; pull requests usam o workflow de verificação e não fazem deploy. Ambos instalam a versão travada em `pnpm-lock.yaml` com `pnpm install --frozen-lockfile`.

## Isolamento
- O projeto Supabase usado durante o desenvolvimento desta branch é o projeto de teste `abxmblwgsuiayfhkwzvu`.
- Não alterar o projeto antigo `ybvwhejfwxtlsmvtnoua`.
- Nunca incluir service-role keys no frontend.
- A chave publishable pode estar no cliente; RLS e funções SECURITY INVOKER limitam o acesso.
- A interface de Consórcios foi retirada; não remover tabelas, funções ou dados históricos do banco sem uma estratégia de arquivamento aprovada.
- Não reaplicar movimentações históricas V1 ao saldo atual.

## Funcionalidades já presentes na branch
- Navegação de retorno Apple Royal corrigida para caminho relativo.
- CPS Store registra vendas/compras e cancelamentos com reversão do estoque e preservação do histórico.
- Apple Royal aceita venda sem aparelho vinculado, registra recebimentos e concilia repasses sem efetuar transferências.
- Os dados históricos de Consórcios e as migrações já aplicadas permanecem no Supabase, sem telas de operação nesta versão.
- Os nomes acima descrevem funcionalidades no código; não substituem validação funcional no navegador e com duas contas.

## Antes de uso comercial
1. Revisar visualmente cada módulo autenticado em desktop e celular.
2. Testar cadastros, vendas, compras, estoque, recebimentos, repasses e follow-ups com dados fictícios e concorrência.
3. Testar isolamento RLS entre duas contas independentes.
4. Fechar a reconciliação Base44/V2 antes de importar qualquer registro divergente.
5. Habilitar leaked-password protection no Supabase Auth e revisar os advisors.
6. Validar backup, restauração e exportação dos dados.
7. Confirmar checks da PR desta branch antes de integrar ou publicar.

## Bloqueios confirmados na auditoria de 2026-10-15
- A migração `20261015173445_harden_ledger_table_privileges` foi aplicada somente no Supabase de teste. Removeu todos os grants de escrita de `anon`, bloqueou exclusões dos registros operacionais e tornou itens/movimentos/recebimentos/atividades append-only. Validação confirmou zero grants de escrita anônimos, zero grants de update/delete nos registros append-only e zero fixtures persistidas.
- Ainda existem `UPDATE` diretos em cabeçalhos de venda/compra e registros financeiros Apple Royal, necessários atualmente às RPCs invoker. Um cliente autenticado ainda poderia alterar alguns valores próprios fora dos fluxos. Restringir esses updates sem quebrar as RPCs continua obrigatório antes de uso comercial.
- O banco de teste agora registra 29 versões; o repositório contém 22 arquivos. As alterações iniciais estão consolidadas com versões diferentes. Não reaplicar migrações nem executar `db push` antes de reconciliar a sequência.
- O banco de teste tem uma conta; o isolamento entre duas contas reais ainda não foi testado. Backup e restauração também continuam pendentes.
- O Security Advisor ainda sinaliza a proteção contra senhas vazadas desativada.
- O CLI oficial 2.79.0 não concluiu a instalação temporária (falha no postinstall). Para manter a alteração rastreável, a migração foi aplicada pelo MCP no projeto de teste e o arquivo local foi espelhado usando a versão retornada pelo banco; ainda requer reconciliação da sequência total antes de `db push`.

