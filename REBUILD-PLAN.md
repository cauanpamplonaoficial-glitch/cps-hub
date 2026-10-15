# CPS Hub — plano de reconstrução

## Objetivo

Reunir as operações ativas da CPS Store e Apple Royal em um CRM único, confiável e fácil de usar. Consórcios Ademicon foi retirado da interface a pedido do usuário em 2026-10-15; dados, tabelas e migrações existentes devem permanecer preservados. As referências são os protótipos Base44 `CPS Hub V2` e `CPS Control Center`, além do repositório Next.js/Supabase `cps-hub`.

## Evidências já verificadas

- O app Base44 `CPS Hub V2` tem somente o modelo `User`; ele é principalmente uma referência visual/estrutural, não uma fonte de domínio completa.
- O app Base44 `CPS Control Center` reúne mais de 30 modelos, cobrindo loja, inventário, vendas, CRM, consórcios, atendimento, tarefas, metas, serviços e relatórios. Alguns modelos têm regras de leitura amplas; permissões não serão presumidas como seguras sem auditoria.
- Existem cópias do Control Center com esquemas diferentes. Nenhuma cópia deve ser escolhida como fonte oficial de dados sem reconciliação.
- O repositório atual está em Next.js/React/TypeScript e Supabase, na branch local isolada `feature/cps-hub-rebuild-20261015`. A PR #1 foi integrada em `main` (merge `da87106`); a árvore do commit local validado corresponde à árvore atual de `main`.
- O CPS Hub V2 está publicado no GitHub Pages e conectado somente ao Supabase de teste autorizado. Consórcios permanece fora da interface por decisão do usuário; seu schema e histórico ficam preservados.
- Não há automação E2E. A auditoria atual confirmou TypeScript, lint, 11 testes e build estático, mas encontrou bloqueios de segurança e migração descritos no registro mais recente ao final deste documento.

## Produto alvo

Um workspace único com troca de negócio sempre visível:

1. **Visão geral:** dashboard por negócio, período configurável, cards selecionáveis/reordenáveis, alertas acionáveis e atalhos que abrem operações reais.
2. **CRM compartilhado:** clientes e contatos sem duplicação, histórico de compras/atendimentos, tarefas, follow-ups, origem, responsável e consentimento quando aplicável.
3. **CPS STORE:** catálogo, estoque e movimentações, compras/fornecedores, vendas por canal, despesas, recebíveis, serviços/trocas e relatórios de margem.
4. **Apple Royal:** aparelhos individuais com identificadores protegidos, reservas, vendas expressas ou vinculadas, recebimentos, repasses, entrega e pós-venda.
5. **Operação comum:** busca, atividades, calendário/tarefas, exportações, configurações e trilha de auditoria.

Airzap não será incluído automaticamente: é uma operação CLT separada, com informações profissionais próprias.

## Regras de arquitetura e dados

- Módulos separados por domínio; componentes compartilhados para navegação, formulários, tabelas, filtros, estados vazios e feedback.
- Modelo comum de workspace/usuário e regras de acesso explícitas; dados financeiros e de clientes protegidos por RLS testada com duas contas.
- Vendas, compras, recebimentos e estoque com operações transacionais e histórico imutável. Cancelar significa registrar reversões, nunca apagar a movimentação original.
- Valores em centavos (inteiros) na lógica financeira; moeda e datas formatadas no limite da interface; definições de receita/lucro únicas e documentadas.
- Nenhuma integração, dado demonstrativo ou indicador será apresentado como real sem fonte efetiva.
- Importação de dados só após escolher a fonte canônica, exportar backup, mapear colunas, deduplicar com chaves estáveis e reconciliar contagens/totais. O processo deve poder ser repetido sem duplicar registros.
- Não aplicar mudanças no projeto Supabase antigo (`ybvwhejfwxtlsmvtnoua`). O projeto de teste autorizado é `abxmblwgsuiayfhkwzvu`.

## Etapas de entrega

### 0. Diagnóstico e decisões — em andamento

Inventariar telas, dados e regras dos três sistemas; escolher os módulos da primeira versão e a fonte de dados a migrar. Nenhuma linha de produção ou histórico será alterada nesta etapa.

### 1. Fundação de produto

Layout acessível e responsivo, navegação entre negócios, autenticação, workspace, permissões, design tokens, componentes comuns, erros/loading/vazios e logging seguro.

### 2. CPS STORE e CRM

Clientes, produtos, estoque, compras, fornecedores, vendas, cancelamentos, despesas/recebíveis, busca e dashboard reconciliado.

### 3. Apple Royal

Fluxos operacionais e financeiros separados, compartilhando clientes e relatórios sem misturar livros financeiros.

### 4. Migração e validação

Backup somente leitura; importação primeiro no Supabase de teste; reconciliação de totais, estoque e histórico; verificação de RLS, cenários concorrentes e restauração.

### 5. Liberação

Testes automatizados de regras críticas e E2E dos caminhos principais; TypeScript, lint, build, auditoria de dependências e smoke test em desktop/celular; PR revisável; deploy só depois de validação explícita.

## Critérios mínimos para considerar utilizável

- Alternar entre CPS STORE e Apple Royal sem perder o acesso ao Dashboard.
- Criar/editar cadastros com validação, busca, loading, erro recuperável e feedback de sucesso.
- Registrar e cancelar venda/compra mantendo saldo de estoque e trilha financeira coerentes.
- Conciliar recebimentos e repasses somente com valores efetivamente informados.
- Registrar recebimentos, repasses e status de venda com valores reais, sem inventar contato, proposta ou resultado.
- Confirmar que uma segunda conta não consegue consultar nem alterar os dados da primeira.
- Exportar dados próprios e restaurar um backup de teste.
- Usar as telas essenciais em desktop e celular com teclado e leitor de tela em operações básicas.

## Decisão de origem e reconciliação inicial — 2026-10-15

O usuário escolheu **C: reconciliar Base44 `CPS Control Center` e Supabase da V2**. Isso autoriza comparação em leitura; não autoriza importação ou escrita nos sistemas.

Contagens consultadas diretamente, sem retornar nomes, telefones ou outros dados pessoais:

| Entidade | Base44 | Supabase V2 | IDs Base44 encontrados por `legacy_id` na V2 |
|---|---:|---:|---:|
| Produtos | 29 | 33 | 27 |
| Clientes | 81 | 80 | 80 |
| Fornecedores | 3 | 3 | 3 |
| Vendas | 117 | 116 | 116 |
| Compras | 67 | 63 | 63 |
| Movimentações de estoque | 226 | 222 | 222 |

Totais agregados adicionais (valores exibidos em R$; não substituem conciliação por registro):

- Vendas Base44: R$ 13.325,83 em todos os status e R$ 13.005,83 excluindo as duas vendas `devolvida` (R$ 320,00). A V2 tem 116 vendas todas `confirmed`, total líquido R$ 13.285,83. A reconciliação por IDs explica exatamente a diferença de R$ 280,00: as duas devolvidas foram importadas como confirmadas (+R$ 320,00) e uma venda Base44 `confirmed` de R$ 40,00 ficou sem par (-R$ 40,00). Isso orienta uma correção de status/registro, mas não autoriza alteração automática.
- Compras Base44: R$ 6.715,32; Supabase V2: R$ 6.341,41. As 63 compras com ID correspondente totalizam exatamente R$ 6.341,41; as quatro sem par somam R$ 373,91: três `em_transito` (R$ 228,91; 6 unidades) e uma `recebido` (R$ 145,00; 1 unidade). As quatro aparecem com `stock_applied=true`, embora as três em trânsito não tenham movimentação ligada no arquivo Base44. A compra recebida ausente tem uma movimentação Base44 de +1.
- Estoque Base44: 64 unidades em produtos vs. saldo líquido de 55 nas movimentações. V2: 56 em produtos vs. saldo líquido de 47 nas movimentações. As 27 correspondências de produtos somam 63 unidades no Base44 contra 56 na V2; dois produtos Base44 não têm par e somam 1 unidade; os seis produtos exclusivos da V2 somam 0. Há três movimentações de compra e uma de venda sem par na V2 (+9 e -1, líquido +8), exatamente a diferença agregada dos estoques atuais. Duas movimentações de compra (+7 e +1) apontam para compras recebidas que já existem na V2; a terceira compra (+1) aponta para a compra recebida de R$ 145,00 que falta; a venda (-1) aponta para a venda confirmada de R$ 40,00 que falta. Três compras em trânsito (R$ 228,91; 6 unidades) estão marcadas `stock_applied=true`, mas não têm movimento no Base44. A igualdade agregada não autoriza ajuste automático: é necessário confirmar por produto as três movimentações de compra, os registros transacionais ausentes e a inconsistência dessas flags.

Também existem 24 parcelas, 3 serviços, 3 leads de consórcio e 1 pedido de loja no Base44; `expenses`, `receivables` e `commissions` consultados não retornaram registros. A V2 tem 848 linhas em `v1_archive`; módulos Apple Royal estão criados e vazios. Todas as tabelas públicas listadas no Supabase de teste reportam RLS ativada e há 50 políticas públicas; isso não prova que as políticas estejam corretas, o que ainda exige revisão de regras e teste com duas contas.

O Security Advisor do Supabase de teste reporta **proteção contra senhas vazadas desativada** ([orientação oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). A configuração não foi alterada. O Performance Advisor também reporta 12 índices ainda não utilizados; com base pequena/recém-iniciada isso não justifica removê-los sem medir uso e avaliar consultas previstas.

**Conclusão:** os registros da V2 correspondem majoritariamente ao conjunto do Base44, mas há diferenças explicadas por chaves e status que exigem uma decisão de migração e validação por item: 2 produtos Base44 e 1 cliente sem par; a V2 tem 6 produtos extras sem estoque. Todos os 116 IDs de venda V2 correspondem a vendas Base44, mas 1 venda Base44 confirmada de R$ 40,00 está ausente; duas vendas devolvidas de R$ 320,00 estão ativas como `confirmed` na V2. Todos os 63 IDs de compras V2 e 222 movimentações V2 correspondem a registros Base44; faltam 4 compras e 4 movimentações no V2. O saldo agregado de estoque difere em +8 unidades do lado Base44 e a diferença coincide com as movimentações ausentes, mas há flags de aplicação inconsistentes e um produto sem par. Não importar, corrigir, cancelar ou deduplicar automaticamente.

### Registro histórico de status — 2026-10-15

As notas abaixo registram etapas anteriores e não representam o estado atual do GitHub, do navegador ou da interface. Consulte a seção **Auditoria de continuação — 2026-10-15** ao final para o estado revalidado.

### Entrega parcial do CRM de Consórcios

- Criadas as tabelas `consorcio_leads` e `consorcio_activities` com RLS, vínculo opcional ao cadastro compartilhado de clientes e atividade somente de acréscimo.
- Criadas RPCs invoker para criar lead + histórico, mover etapa + histórico e registrar contato + atualizar follow-up atomicamente.
- Aplicadas no Supabase de teste cinco migrações versionadas em 2026-10-15; nenhuma linha legada foi importada.
- Verificação de privilégios confirmou: sem SELECT anônimo, leads sem DELETE, atividades sem UPDATE/DELETE; funções executáveis apenas por `authenticated`.
- Teste transacional com usuário autenticado criou lead, mudou etapa e registrou atividade dentro de uma transação revertida; consulta posterior confirmou zero linhas de teste persistidas.
- Criada tela responsiva `app/consorcios/page.tsx` com cadastro de lead, ligação a cliente existente, funil, follow-ups e histórico. A rota `/consorcios` foi compilada e exportada pelo build; a inspeção visual ainda não foi concluída.
- Indicadores do dashboard CPS Store agora fazem somas de moeda em centavos inteiros; teste de execução com valores decimais confirmou vendas, descontos, taxas, frete, custo, estoque e compras.
- O teste de isolamento entre duas contas continua pendente; só há uma conta disponível na V2 de teste.
- A auditoria ao formulário de atividades identificou risco de apagar o próximo follow-up ao selecionar um lead na janela geral; a tela agora preenche ação/data atuais do lead ao selecioná-lo. `git diff --check` passou após a correção.
- A PR #1 foi consultada ao vivo: continua aberta em rascunho e aponta para `feature/cps-hub-reliability-20261014` no SHA `48d6bee`; o check `verify` desse SHA está aprovado. A branch local isolada desta reconstrução ainda tem mudanças não publicadas e, portanto, não está coberta por esse check.
- As cinco versões de migração do CRM foram confirmadas no histórico remoto do Supabase de teste; as duas tabelas continuam vazias, com RLS ativada. Consulta de privilégios confirmou sem leitura anônima, sem DELETE de leads e sem UPDATE/DELETE de atividades. O Security Advisor ainda alerta proteção contra senhas vazadas desativada.
- Dependências do projeto foram fixadas em `pnpm-lock.yaml`; os dois workflows agora instalam com `pnpm install --frozen-lockfile`. A instalação congelada offline passou nesta sessão. TypeScript e build de produção passaram; o navegador não pôde fazer revisão visual nesta sessão. Servidores de preview foram encerrados.
- O check verde da PR antiga continua não cobrindo esta branch; nenhum push foi feito para disparar um novo check.
- Smoke test no Supabase de teste exercitou, dentro de transação revertida, cancelamento de venda CPS Store (saldo e movimento compensatório), cancelamento de compra recebida (saldo e movimento de reversão), venda Apple Royal sem aparelho, recebimento, pagamento registrado de repasse e cancelamento preservando os livros financeiros. Consulta posterior confirmou zero registros de auditoria temporários persistidos.
- Reconciliado por SQL o mapeamento `legacy_id` de todas as entidades: clientes 80/81, fornecedores 3/3, produtos 27/29, vendas 116/117, compras 63/67 e movimentações 222/226; todos os registros de destino têm `legacy_id`. O primeiro resumo de clientes/fornecedores foi corrigido: 80 clientes e 3 fornecedores realmente têm IDs correspondentes.
- O lint usa Biome 2.5.15, versão exata travada no lockfile e mantida atualmente. Os workflows de PR e Pages executam TypeScript, lint e build. `pnpm run lint` não tem erros; restam 33 avisos (23 usos de `any` e 10 avisos de acessibilidade). Também foram adicionados tipos explícitos aos botões de ação, removidas variáveis sem uso, corrigidos atributos ARIA do listbox e simplificados inserts Apple Royal para não exigir leitura imediata do registro criado.
- Build falhou inicialmente porque `.next` já existia com ACL de somente leitura para o sandbox; removi apenas o diretório ignorado de artefatos `.next`, dentro do worktree, e `pnpm run build` então passou. A instalação congelada com lockfile passou após acesso ao registry; nenhum dado externo foi alterado.
- Revisão ao vivo das políticas do CRM Consórcios confirmou RLS nas duas tabelas, filtro por `owner_id = auth.uid()`, atividades somente de acréscimo e vínculo de atividade validado contra lead do mesmo dono. As três RPCs públicas do fluxo são `SECURITY INVOKER`, verificam usuário e só podem ser executadas por `authenticated`; funções de trigger não são executáveis por `anon` nem `authenticated`. Essa revisão estática não substitui o teste de isolamento com duas contas.
- O GitHub confirmou que a PR #1 continua aberta em rascunho e ainda aponta para `feature/cps-hub-reliability-20261014` (`48d6bee`); a branch `feature/cps-hub-rebuild-20261015` segue apenas local, sem publicação. O Security Advisor mantém o alerta de proteção contra senhas vazadas desativada.

### Verificação local mais recente — 2026-10-15

- Branch de trabalho confirmada: `feature/cps-hub-rebuild-20261015`. As alterações permanecem locais; não houve commit, push, merge ou publicação.
- Após ajustes em controles de tema, filtros e campos rotulados, `pnpm exec tsc --noEmit` passou e `pnpm run build` exportou `/`, `/apple-royal` e `/consorcios` com Next.js 15.5.27.
- `pnpm run lint` passou com 1 aviso restante: `Record<string, any>` no tipo compartilhado `R` de Apple Royal. Os avisos de acessibilidade foram corrigidos. Não troquei o mapa de dados por `unknown` sem tipagem de domínio, pois a tela acessa diversos campos dinâmicos e a alteração quebraria a verificação.
- `git diff --check` passou. `.next` foi removido somente dentro do worktree porque os artefatos anteriores estavam sem permissão de escrita; o build recriou a saída.
- Consulta somente leitura ao histórico do projeto Supabase de teste `abxmblwgsuiayfhkwzvu` confirmou as cinco migrações `20261015141853` a `20261015142133` aplicadas. Nenhuma migração foi reaplicada nesta etapa. A revisão estática confirma RLS, ownership por `auth.uid()`, atividades sem UPDATE/DELETE e RPCs `SECURITY INVOKER` limitadas a `authenticated`; o teste de isolamento com duas contas continua pendente.
- A revisão visual em desktop/mobile, o teste runtime autenticado entre duas contas e a validação visual no endereço servido seguem pendentes. Esta sessão não depende do navegador do computador da empresa e não fez alterações no GitHub.

### Tipagem do banco e validação incremental — 2026-10-15

- GereI `lib/database.types.ts` a partir do schema ao vivo do Supabase de teste autorizado `abxmblwgsuiayfhkwzvu` (somente leitura).
- O cliente padrão em `lib/supabase.ts` agora é `SupabaseClient<Database>`. `app/consorcios/page.tsx` usa esse cliente e o TypeScript validou tabelas, colunas e argumentos das RPCs; argumentos opcionais vazios são omitidos (`undefined`) para respeitar os defaults SQL.
- As telas CPS Store e Apple Royal ainda acessam nomes dinâmicos do arquivo legado V1. Elas usam o adaptador explicitamente chamado `legacySupabase`; o tipo de linhas do Apple Royal usa a interseção dos tipos reais de suas tabelas e metadados do histórico, sem `any`.
- `pnpm exec tsc --noEmit`, `pnpm run lint` (sem avisos) e `pnpm run build` passaram após a mudança. O build estático exportou `/`, `/apple-royal` e `/consorcios`. O `git diff --check` passou antes do ajuste de documentação; repetir na revisão final.
- Essa tipagem vem do projeto de teste e precisa ser regenerada se o schema mudar. A ponte legada é dívida técnica delimitada: converter as consultas V1 para tabelas/entidades tipadas exige modelar explicitamente a união do arquivo importado.

### Segurança e Advisor — leitura ao vivo do Supabase de teste, 2026-10-15

- Histórico remoto continua mostrando as cinco migrações do CRM aplicadas. Contagem atual: `consorcio_leads = 0` e `consorcio_activities = 0`; não há registros de teste persistidos.
- Consulta de privilégios confirmou RLS habilitada nas duas tabelas, `anon` sem SELECT, `authenticated` sem DELETE e as RPCs `create_consorcio_lead`, `move_consorcio_lead` e `record_consorcio_activity` com EXECUTE apenas para autenticados; as três são invoker, não definer.
- O Security Advisor ainda aponta somente a proteção contra senhas vazadas desativada; ativação depende da configuração Auth do projeto e não foi alterada. Remediação: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- O Performance Advisor aponta quatro FKs do CRM sem índice (`consorcio_activities.lead_id`, `created_by`; `consorcio_leads.customer_id`, `responsible_id`) e 13 índices não utilizados. Isso é informação de performance, não vulnerabilidade; não removi índices. A criação de migração para os quatro FKs ficou adiada porque o Supabase CLI não está instalado no ambiente e a skill requer criação pelo comando oficial `supabase migration new`.
- O isolamento real entre duas contas ainda não está comprovado: há uma conta autenticada de teste disponível. Não fabricar usuários nem marcar o teste como aprovado.

### Revisão financeira e estado remoto — 2026-10-15

- `getNetSaleAmount` agora é o cálculo compartilhado para o KPI e a lista de vendas recentes. Antes, a lista caía para `subtotal`, exibindo valor bruto em vendas com desconto. Smoke checks em runtime passaram para centavos (`19,99 - 0,01 = 19,98`), valores string (`100,00 - 20,25 = 79,75`) e piso zero quando o desconto excede o subtotal.
- Após o cliente Supabase tipado e os ajustes acima: `pnpm exec tsc --noEmit`, `pnpm run lint` (zero diagnósticos), `pnpm run build` (três rotas exportadas) e `git diff --check` passaram.
- GitHub consultado em modo leitura: PR #1 segue aberta e draft, da branch `feature/cps-hub-reliability-20261014` no SHA `48d6beec` para `main`. Ela não contém este trabalho local; não houve push.
- Os workflows locais validam PRs contra `main`, e Pages só publica em push para `main`. `configure-pages` permanece com `enablement: false` e permissão `pages: read` no build; o job de deploy tem `pages: write` e `id-token: write`, em linha com a documentação oficial do GitHub. O estado remoto não foi alterado.

### Testes automatizados de métricas — 2026-10-15

- Adicionado `tests/financial-metrics.test.mjs` usando `node:test`, sem nova dependência. Os cenários cobrem aritmética em centavos/piso de desconto, exclusão de canceladas e vendas fora do período, totais por canal e alertas de estoque/custo.
- `pnpm test` passou: 3 testes, 0 falhas. O script usa type stripping nativo disponível a partir do Node 22.6; `package.json` e README agora declaram esse requisito.
- CI de verificação de PR e workflow de Pages executam `pnpm test` junto de lint, TypeScript e build.
- Revalidação local: instalação congelada/offline passou; testes, lint sem avisos, `tsc --noEmit`, build estático das três rotas e `git diff --check` passaram. Build concluído após a alteração do cálculo financeiro; a instalação repetida não modificou dependências.

### Permissões dos fluxos transacionais — confirmação ao vivo, 2026-10-15

- Consulta somente leitura no projeto `abxmblwgsuiayfhkwzvu` verificou 12 RPCs de CPS Store, Apple Royal e Consórcios: todas `SECURITY INVOKER`, sem `EXECUTE` para `anon` e com `EXECUTE` para `authenticated`.
- A tentativa de obter o Supabase CLI por `pnpm dlx` foi interrompida após erro DNS `ENOTFOUND` no registry. Nenhum pacote foi instalado e nenhuma migração de índice foi criada/aplicada.

### Margem potencial de estoque e cobertura financeira — 2026-10-15

- Um teste novo mostrou que produtos sem custo cadastrado inflavam a margem potencial como se tivessem custo zero. `potentialInventoryMargin` agora só inclui produtos com custo positivo; o cartão informa “Parcial; exclui itens sem custo” quando existem itens incompletos. Isso evita apresentar receita potencial como margem.
- Ampliei a suíte para quatro cenários; agora cobre compras/despesas canceladas, custo e margem de estoque e vendas com custo incompleto. `pnpm test`: 4/4 passaram; lint, TypeScript, build estático das três rotas e `git diff --check` também passaram após a correção.

### Reconciliação por identificador revalidada — leitura somente, 2026-10-15

- Consultei novamente as entidades do app Base44 `CPS Control Center` e os `legacy_id` do Supabase de teste. A comparação por ID confirmou: produtos 27/29 (2 ausentes na V2, estoque total 1 unidade); clientes 80/81 (1 ausente); fornecedores 3/3; vendas 116/117 (1 ausente); compras 63/67 (4 ausentes); movimentações 222/226 (4 ausentes). Não foram consultados nomes, telefones ou outros dados pessoais para produzir a comparação.
- A venda ausente é confirmada, R$ 40,00 e quantidade 1; há uma movimentação de venda de -1 ligada a ela. Duas vendas devolvidas da fonte continuam sendo divergência de status/financeiro já descrita acima; não alterei registros.
- As quatro compras ausentes são: três `em_transito` de R$ 75,98, R$ 81,99 e R$ 70,94 (total R$ 228,91; 6 unidades), e uma `recebido` de R$ 145,00 (1 unidade). Todas aparecem com `stock_applied=true`. As quatro movimentações ausentes somam +9 unidades de compras e -1 de venda. Apenas a compra recebida de R$ 145,00 entre essas quatro compras tem movimentação correspondente (+1); outras duas movimentações de compra (+1 e +7) referenciam compras que já estão representadas na V2. A inconsistência entre status, flags e movimentos exige conciliação por registro/produto antes de qualquer importação.
- Essa consulta foi estritamente de leitura. Nenhum registro, estoque ou migração foi alterado. A reconciliação identifica as divergências, mas não decide se devem ser importadas, corrigidas ou mantidas no legado.

### Verificação local repetida — continuação da sessão, 2026-10-15

- Branch observada: `feature/cps-hub-rebuild-20261015`, com mudanças não commitadas no worktree. `pnpm test` (4/4), Biome lint (sem diagnósticos), `pnpm exec tsc --noEmit`, `pnpm run build` e `git diff --check` passaram. O build exportou `/`, `/apple-royal` e `/consorcios`.
- Continuam sem evidência suficiente o teste de isolamento runtime entre duas contas e a revisão visual desktop/mobile. O usuário está no computador da empresa e não consegue liberar controle do navegador; nenhum acesso foi solicitado nesta etapa. GitHub, PR, branch principal e publicação não foram modificados.

### Revisão de cancelamentos — 2026-10-15

- Revisei `cancel_sale`, `cancel_purchase` e `apple_royal_cancel_sale` nas migrações. A hipótese de que `cancel_sale` poderia receber status `returned` foi descartada: o constraint remoto `sales_status_check` permite somente `pending`, `confirmed`, `cancelled` e `refunded`; `cancel_sale` também recusa `cancelled` e `refunded`, exige itens e confere a baixa original antes de reverter o estoque. Não alterei a função nem a migração aplicada.
- No fluxo Apple Royal, a função de cancelamento já recusa vendas `cancelled`/`returned` e bloqueia cancelamento com repasse pago. As operações são registradas em audit log e preservam as linhas originais.
- A consulta `information_schema` ao Supabase de teste não encontrou tabela de recebíveis CPS Store; portanto, não há recebível persistido nesse schema para o RPC de cancelamento reconciliar. As tabelas de repasse específicas da Apple Royal permanecem tratadas pelo fluxo próprio.
- Esta revisão foi somente leitura. O teste transacional com rollback dos fluxos de cancelamento havia sido executado anteriormente nesta sessão de trabalho; nesta etapa confirmei a restrição de status diretamente no banco, sem criar registros ou alterar estoque.

### Retirada da interface de Consórcios — decisão do usuário, 2026-10-15

- O usuário informou que não trabalha mais com a Ademicon e pediu que o módulo de Consórcios fosse retirado. Removi a rota de operação, os links e seletores nos dois módulos ativos, os estilos exclusivos e a menção comercial na documentação.
- Mantive tabelas, RPCs, tipos gerados e cinco migrações que já foram aplicadas ao Supabase de teste. Não apaguei leads nem outras informações históricas.
- Validação após a remoção: lint, TypeScript, `pnpm test` (4/4), build estático e `git diff --check` passaram. O build exporta somente `/` e `/apple-royal`; `/consorcios` não é mais uma rota publicada.
- A prévia ainda depende de acesso do navegador ao servidor local; o ambiente de execução bloqueou requisições HTTP de loopback, então isso não será declarado como revisão visual concluída.

### Revalidação e alinhamento do escopo — 2026-10-15

- Repeti `pnpm test` (4/4), `pnpm run lint`, `pnpm exec tsc --noEmit`, `pnpm run build` e `git diff --check`; todos passaram. O build atual contém `/` e `/apple-royal`, sem `/consorcios`.
- Corrigi a descrição do rodapé para refletir somente CPS STORE e Apple Royal e atualizei os critérios ativos para não exigir operação de Consórcios.
- Permanecem tarefas de validação antes de uso operacional: teste real de isolamento com segunda conta, QA visual em desktop/celular, reconciliação das divergências Base44/V2 por registro e validação dos fluxos transacionais em ambiente autenticado. Nenhuma publicação foi feita.

### Histórico de compras dos clientes — 2026-10-15

- A consulta do módulo Clientes agora pagina todas as vendas vinculadas aos clientes exibidos, com ordenação estável por data de criação e ID, em páginas de até 1.000 registros. Antes havia um limite silencioso de 1.000 vendas.
- O resumo de compras foi centralizado em `lib/dashboard-metrics.ts`; canceladas/devolvidas são excluídas e os totais são somados em centavos inteiros.
- Adicionado teste para soma precisa de valores pequenos, descontos que zeram o líquido, vendas devolvidas e data da compra mais recente. A suíte passou a 8 testes após os casos financeiros Apple Royal.
- O dashboard Apple Royal agora pagina aparelhos, vendas, recebimentos, repasses e pós-venda em ordem determinística; as consultas anteriores paravam em 500 ou 1.000 linhas e poderiam subestimar indicadores sem avisar.
- `fetchAllPages` está coberto por testes de múltiplas páginas, encerramento em página curta e erro após uma página parcial. Validação mais recente: 8 testes, lint, TypeScript, build estático com `/` e `/apple-royal`, e `git diff --check` aprovados.
- Os totais da conciliação Apple Royal foram centralizados em `lib/apple-royal-metrics.ts` e calculados em centavos; um teste cobre soma de vendas, recebimentos, repasses, divergências, comprovantes e exclusão de vendas canceladas.

### Indicadores incompletos e paginação — 2026-10-15

- CPS STORE e Apple Royal passaram a buscar os conjuntos de dados financeiros por páginas ordenadas de forma determinística, em vez de parar silenciosamente em 500, 1.000 ou 2.000 linhas.
- Se a leitura falhar, a CPS STORE oculta o painel até nova tentativa; no histórico do cliente os totais aparecem como não conferidos. Apple Royal marca o resumo como incompleto, oculta valores agregados e pendências até atualização completa.
- Conferi a semântica oficial do `range(from,to)`: índices baseados em zero, limite final inclusivo e resultado respeitando a ordenação. As consultas incluem ordenação para evitar páginas instáveis. Fonte: https://supabase.com/docs/reference/javascript/range.
- Validação local após esta alteração: 8 testes, lint, TypeScript, build estático (`/`, `/apple-royal`) e `git diff --check` aprovados.

### Correção do privilégio TRUNCATE — 2026-10-15

- Consulta somente leitura ao Supabase de teste confirmou `TRUNCATE` efetivo para `anon` e `authenticated` em tabelas públicas; RLS não limita esse comando. A documentação oficial do Supabase separa grants de RLS e a do PostgreSQL confirma que TRUNCATE é um privilégio independente.
- A migração `20261015162601_revoke_browser_truncate_privileges` foi aplicada ao projeto autorizado `abxmblwgsuiayfhkwzvu`, removendo `TRUNCATE` de `PUBLIC`, `anon` e `authenticated` em todas as tabelas públicas existentes e do default de objetos futuros criados por `postgres`.
- Reconsulta confirmou 0/23 tabelas públicas truncáveis por `anon` e 0/23 por `authenticated`; `authenticated` ainda mantém SELECT/INSERT/UPDATE/DELETE em `sales`, então a operação CRUD normal necessária continua habilitada. Nenhum dado foi alterado.
- A instalação local não tem o executável Supabase CLI. O identificador de migração foi obtido do histórico remoto após o uso do MCP e usado para criar o arquivo SQL correspondente nesta branch. Os privilégios padrão para tabelas criadas por `supabase_admin` continuam concedendo TRUNCATE a `anon`/`authenticated`; a conexão atual como `postgres` não tem associação com esse role e não pode alterar esse default. Não declarar a auditoria de grants/defaults como totalmente concluída até resolver isso com uma conexão autorizada como `supabase_admin` ou ajustar a configuração administrativa do projeto.
- Advisors após a migração: Security continua reportando apenas proteção de senha vazada desativada; Performance aponta quatro FKs sem índice nas tabelas históricas de Consórcios e 13 índices sem uso observado. Não alterei Auth nem removi índices com base em amostra de uso curta.
- Revalidação local nesta continuação: `pnpm test` (8/8), lint, `tsc --noEmit`, `pnpm run build` (somente `/` e `/apple-royal`) e `git diff --check` passaram. A prévia Next.js foi iniciada na porta 4175, mas o navegador integrado retorna timeout para `localhost`; a revisão visual não foi concluída. O link foi encaminhado para a interface Codex para tentativa local.
- Simulei a camada SQL `authenticated` com o proprietário que já tem dados e com um UUID sintético sem dados, usando configuração local da sessão e somente consultas SELECT. O proprietário viu 116 vendas, 33 produtos, 80 clientes, 63 compras e 222 movimentações; o outro subject viu zero nas oito tabelas CPS STORE/Apple Royal consultadas. Isso comprova o predicado de isolamento para esse dataset e subject sintético, mas não substitui login real em uma segunda conta.
- Tentei revogar o default de `supabase_admin` via migration; a alteração foi recusada por `permission denied to change default privileges`. Nenhuma migration adicional foi registrada. A conexão `postgres` não pode alterar ACLs padrão de outro proprietário; manter essa pendência documentada em vez de contornar com elevação de privilégios.

### Inventário Base44/V2 atualizado — 2026-10-15

- Reconsultei em modo somente leitura as 38 entidades da fonte escolhida `CPS Control Center`; 23 contêm registros, somando 870. Comparei IDs técnicos com as 848 linhas do `v1_archive`, sem ler nomes, telefones, documentos ou textos livres.
- 17 das 23 entidades com dados têm contagem e IDs totalmente correspondentes ao arquivo. As seis diferenças, todas apenas registros Base44 ainda não arquivados, são: 2 `Product`, 1 `Customer`, 4 `Purchase`, 1 `Sale`, 4 `InventoryMovement` e 10 `AuditLog`. Não há ID arquivado que esteja ausente da fonte atual.
- As 10 auditorias ausentes são 4 ações de criação e 3 edições de compra, mais 3 criações de movimentação de estoque; as cinco datas mais recentes retornadas estão em 2026-10-14. Isso é compatível com atividade posterior ao snapshot arquivado, mas não autoriza importação automática.
- O histórico do módulo Consórcios segue integral no arquivo: 34 `ConsorcioCarta` e 3 `ConsorcioLead`, todos com `claimed_by` preenchido. Mantê-los arquivados não reativa o módulo na interface.
- A divergência total fonte/arquivo é de 22 registros (870 vs. 848), consistente com as diferenças por entidade acima. A reconciliação continua em leitura; qualquer importação ou ajuste financeiro/estoque exige autorização e conferência registro a registro.

### Reconciliação autorizada do arquivo V1 — 2026-10-15

- Após autorização explícita do usuário, arquivei os 22 registros ausentes em `v1_archive` no Supabase de teste `abxmblwgsuiayfhkwzvu`, usando os payloads originais Base44 e deduplicação pela restrição única `(entity_name, legacy_id)`.
- A verificação posterior encontrou 22/22 IDs, payloads idênticos e proprietário consistente; o arquivo passou de 848 para 870 linhas, sem linhas sem `claimed_by`.
- Antes e depois da gravação, vendas permaneceram em 116, compras em 63, produtos em 33 e movimentações em 222; o saldo individual dos 33 produtos também permaneceu igual. Nenhuma tabela operacional foi modificada.
- Validação local atual: `pnpm test` (8/8), `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (rotas `/` e `/apple-royal`) e `git diff --check` passaram. A revisão visual em navegador segue pendente porque o servidor local na porta 4175 não é alcançável pelo navegador integrado neste ambiente.
- A branch segue isolada, com alterações locais não commitadas e não publicadas. A remoção de Consórcios refere-se somente à interface; schema e histórico continuam preservados.
- Auditoria transacional no Supabase de teste, com fixtures temporárias dentro de subtransação revertida: cancelamento de venda CPS STORE preservou o movimento original e criou compensação; cancelamento de compra recebida reverteu a entrada; estoque insuficiente rejeitou a operação sem alteração parcial; venda expressa Apple Royal sem aparelho criou o recebimento inicial; recebimentos somaram até o preço, excedente foi recusado, repasse pendente passou a pago e o cancelamento preservou os livros e sinalizou conciliação financeira. A verificação confirmou que as fixtures foram revertidas e não permaneceram no banco.
- As funções verificadas no banco são `SECURITY INVOKER`; essa execução validou a lógica transacional com o `auth.uid()` simulado do dono, mas não equivale a testar a interface autenticada nem o isolamento com uma segunda conta real.
- A inspeção do schema financeiro confirmou uma limitação para corrigir antes do uso como CRM completo: CPS STORE registra o frete desembolsado (`shipping_cost`), mas não possui um campo separado para o frete cobrado do cliente. O cálculo não infere nem inventa esse valor; adicionar e validar esse campo com migration rastreável segue pendente.
- O formulário de vendas da CPS STORE passou a aceitar vários produtos na mesma venda, com preço unitário por linha, subtotal em centavos, remoção de itens e validação da quantidade combinada contra o estoque consultado. A RPC `create_sale` ainda revalida e grava itens, venda e movimentos de estoque atomicamente.
- A busca de produtos, clientes e fornecedores usada pelos formulários agora pagina todos os registros, com ordenação estável e mensagem de carga parcial em caso de erro; deixou de parar silenciosamente em 500 resultados. Os testes cobrem subtotal fracionário, bloqueio da quantidade além do estoque e rejeição de preço unitário vazio (que não pode virar venda grátis). Validação atual: 11 testes, lint, TypeScript, build estático (`/`, `/apple-royal`) e `git diff --check` aprovados.
- O preview local foi reiniciado na porta 4175 após o build. O navegador integrado ainda não consegue acessar o loopback, então a revisão visual permanece pendente.

### Auditoria de continuação — 2026-10-15

- Estado GitHub confirmado pela API: PR #1 integrada e fechada; `main` está em `da87106`. A árvore de arquivos é idêntica à do commit local `ba7e478` (`49afd31`), e o workflow de validação/publicação de `main` terminou com sucesso. O checkout segue isolado na branch local `feature/cps-hub-rebuild-20261015`, sem alterações de código anteriores a esta auditoria.
- Validação executada novamente: `pnpm test` 11/11; `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm build` (rotas estáticas `/` e `/apple-royal`); `git diff --check`. Tudo passou.
- Preview atual acessível no navegador integrado em `http://127.0.0.1:4175/`. A revisão ao vivo confirmou o dashboard CPS Store com dados da conta de teste, alternância de negócios, e Apple Royal com estado vazio coerente. Nenhum registro foi criado ou alterado nesta inspeção. Consórcios não aparece na navegação, conforme decisão do usuário.
- Supabase de teste: 23/23 tabelas públicas com RLS habilitada; políticas verificadas usam ownership por `auth.uid()` (com política de arquivo V1 específica); 12 RPCs de venda, compra e Apple Royal consultadas são `SECURITY INVOKER`. Há somente uma conta, então não foi possível provar isolamento com uma segunda conta real.
- **Hardening aplicado no Supabase de teste:** a migração `20261015173445_harden_ledger_table_privileges` removeu grants de escrita de `anon`, removeu exclusões em produtos/despesas/vendas/compras e tabelas Apple Royal, e tornou itens, movimentos de estoque, recebimentos e atividades append-only. A consulta posterior encontrou zero grants de escrita para `anon`, zero grants UPDATE/DELETE nos livros append-only e zero fixtures de teste persistidas. Testes SQL em transação revertida passaram para criação/cancelamento CPS, venda Apple sem aparelho, recebimento, repasse, cancelamento e rejeição de alterações/exclusões diretas.
- **Risco residual:** cabeçalhos CPS de venda/compra e campos de vendas/recebimentos/repasses Apple ainda permitem `UPDATE` pelo papel autenticado. As RPCs invoker precisam dessas permissões hoje, então ainda é possível alterar valores próprios fora do fluxo transacional. Restringir esses updates sem quebrar as operações segue obrigatório antes de uso comercial.
- A migração foi aplicada apenas ao banco de teste `abxmblwgsuiayfhkwzvu`; nenhum dado de negócio foi alterado. O Supabase CLI 2.79.0 foi baixado, mas o postinstall falhou. O arquivo local foi espelhado pelo número de versão retornado pelo banco: `supabase/migrations/20261015173445_harden_ledger_table_privileges.sql`.
- Histórico atual: 29 versões no Supabase e 22 arquivos locais. Parte das mudanças antigas está consolidada sob versões diferentes; não executar `db push` nem reaplicar scripts antes de reconstruir o mapa e comparar o schema.
- O Security Advisor continua sinalizando leaked-password protection desativada. O Performance Advisor mostra quatro FKs sem índice nas tabelas históricas de Consórcios. O isolamento entre duas contas reais e backup/restauração continuam pendentes.
- Histórico confirmado: 28 versões registradas pelo Supabase versus 21 arquivos locais. As primeiras alterações foram divididas/consolidadas com identificadores diferentes; a lista de nomes sozinha não prova equivalência de conteúdo. Nenhuma migração foi aplicada neste turno. Não rodar `db push` ou reaplicar scripts até reconstruir o mapa histórico e comparar o schema.
- Advisor de segurança segue com `auth_leaked_password_protection` em WARN. O Advisor de performance aponta quatro FKs sem índice em tabelas históricas de Consórcios; não foram removidos dados nem adicionados índices. A interface continua removida.
- Sem alteração no Supabase antigo ou na produção; o site público permanece ligado ao projeto de teste. Backup/restauração real, teste RLS com segunda conta e hardening de grants continuam bloqueios para uso comercial.

