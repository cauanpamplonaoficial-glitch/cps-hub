# CPS Hub V2 — publicação e segurança

## Publicação
O GitHub Actions compila Next.js como site estático e publica `out` no GitHub Pages. A execução verde comprova build/deploy, não todos os fluxos de negócio.

## Isolamento
- O projeto Supabase V2 é de teste e está separado do projeto antigo inativo.
- Nunca incluir service-role keys no frontend.
- A chave publishable pode estar no cliente; RLS e funções SECURITY INVOKER limitam o acesso.
- Dados de consórcio ficam fora da interface ativa.
- Não reaplicar movimentações históricas V1 ao saldo atual.

## Correções recentes
- Navegação de retorno Apple Royal corrigida para caminho relativo.
- Dropdown de garantia passa a listar vendas.
- Reservas/vendas Apple Royal usam RPCs transacionais, registradas em `supabase/migrations/202610130007_apple_royal_atomic_workflows.sql`.

## Antes de uso comercial
1. Testar ambas as rotas no navegador com sessão autenticada.
2. Testar cadastros, vendas, compras, estoque e RLS com dados fictícios.
3. Testar reservas e vendas Apple Royal, incluindo tentativas concorrentes e erros.
4. Completar recebimentos, conciliação, edição, relatórios e trilha de auditoria.
5. Versionar `package-lock.json` e executar auditoria de dependências.
6. Habilitar leaked-password protection no Supabase Auth e revisar os advisors.
7. Validar backup e procedimento de restauração.
