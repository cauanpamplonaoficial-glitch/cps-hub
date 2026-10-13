# CPS Hub V2 — aplicação independente

Aplicação em Next.js com TypeScript, React, CSS próprio e Supabase para autenticação/dados. O ambiente V2 utiliza um projeto de teste isolado do sistema antigo.

## Rodar localmente
Requisitos: Node.js 22 ou superior.
```bash
npm install
npm run dev
```
Abra http://localhost:3000.

## Módulos atuais
- CPS Store: produtos, clientes, fornecedores, vendas, compras, movimentações, despesas e arquivo histórico V1.
- Apple Royal: catálogo de aparelhos, reservas, vendas, repasses, entregas, garantia/pós-venda, relatórios resumidos e documentos.
- Autenticação Supabase e dados isolados por proprietário via RLS.
- Navegação separada entre CPS Store e Apple Royal.

## Publicação
GitHub Actions compila a exportação estática Next.js e publica a pasta `out` no GitHub Pages. Build verde não substitui testes funcionais no navegador.

## Dados e segurança
- O banco V2 é separado do projeto antigo inativo.
- O arquivo V1 preserva dados históricos; não reaplicar movimentações antigas ao saldo.
- Não incluir service-role keys no frontend.
- A chave publishable é pública por desenho; RLS é obrigatória.
- Vendas/compras da CPS Store usam RPCs transacionais. Reservas/vendas Apple Royal usam RPCs transacionais após a migration 202610130007.

## Limitações conhecidas
- Testes automatizados de ponta a ponta ainda não estão configurados.
- Apple Royal ainda precisa de edição controlada, fluxo completo de recebimentos/conciliação e relatórios detalhados.
- `package-lock.json` ainda não está versionado.
- A proteção de senha vazada do Supabase Auth precisa ser habilitada.

Consulte [AUDIT-2026-10-13.md](./AUDIT-2026-10-13.md) e [DEPLOYMENT.md](./DEPLOYMENT.md) para status e validações pendentes.
