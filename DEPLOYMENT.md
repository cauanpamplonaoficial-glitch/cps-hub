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
