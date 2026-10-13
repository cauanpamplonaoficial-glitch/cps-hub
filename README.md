# CPS Hub V2 — aplicação independente

Aplicação em Next.js com TypeScript, React e CSS próprio. O desenvolvimento visual está separado do sistema de produção e usa exclusivamente dados fictícios.

## Rodar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## O que existe nesta versão visual

- Dashboard com faturamento, lucro estimado, ticket médio e margem.
- Gráfico de faturamento e lucro por dia.
- Faturamento agrupado por canal.
- Filtros por período, canal, datas personalizadas, status e busca.
- Tabela de vendas e exportação CSV.
- Navegação visual entre Dashboard, Relatórios, Vendas, Estoque, Compras, Clientes, Fornecedores, Financeiro, Canais, Metas, Integrações e Configurações.
- Layout responsivo para desktop e celular.
- Dados demonstrativos identificados na interface.

## Publicação

O workflow do GitHub Actions faz build estático do Next.js e publica a pasta `out` no GitHub Pages após cada push na branch `main`. A publicação só funcionará quando GitHub Pages estiver habilitado para o repositório usando GitHub Actions.

## Segurança e dados

- Nenhuma conexão com o banco de produção nesta etapa.
- Nenhuma chave ou segredo do Supabase incluído no frontend.
- Nenhum registro real alterado.
- A conexão com Supabase, autenticação, permissões e migração de dados serão implementadas apenas após validação do modelo e das regras financeiras.

## Próximas etapas

1. Verificar o build e a publicação.
2. Revisar a consistência dos indicadores e filtros.
3. Ajustar campos e fluxos de cada módulo conforme as regras reais da CPS.
4. Preparar um ambiente de teste Supabase, separado da produção.
5. Importar uma cópia validada dos dados e conciliar os totais antes de qualquer migração.
