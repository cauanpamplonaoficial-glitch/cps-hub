"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes,
  CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardList, CreditCard,
  Download, FileBarChart, Filter, Gauge, LayoutDashboard, LifeBuoy, Menu, MoreHorizontal,
  Package, Plus, Search, Settings, ShoppingBag, ShoppingCart, Store, TrendingUp,
  Users, Wallet, X, Truck, UserRound, Receipt, Link2, type LucideIcon
} from "lucide-react";

type Sale = { id: string; date: string; channel: string; product: string; customer: string; revenue: number; cost: number; fees: number; status: "Confirmada" | "Pendente" | "Cancelada" };
const demoSales: Sale[] = [
  {id:"DEMO-1042",date:"2026-10-12",channel:"WhatsApp",product:"Fone KZ EDX Pro X",customer:"Cliente balcão",revenue:30,cost:18,fees:0,status:"Confirmada"},
  {id:"DEMO-1041",date:"2026-10-11",channel:"Mercado Livre",product:"Mouse Attack Shark X11",customer:"Lucas M.",revenue:199.9,cost:132,fees:31.98,status:"Confirmada"},
  {id:"DEMO-1040",date:"2026-10-10",channel:"Marketplace",product:"Teclado Ajazz NK61",customer:"Mariana R.",revenue:179.9,cost:116,fees:0,status:"Confirmada"},
  {id:"DEMO-1039",date:"2026-10-09",channel:"Shopee",product:"Controle EasySMX X15",customer:"Pedro A.",revenue:239.9,cost:174,fees:35.98,status:"Confirmada"},
  {id:"DEMO-1038",date:"2026-10-08",channel:"Instagram",product:"Fone KZ EDX Pro",customer:"Ana C.",revenue:89.9,cost:54,fees:0,status:"Confirmada"},
  {id:"DEMO-1037",date:"2026-10-07",channel:"WhatsApp",product:"Mouse Attack Shark R1",customer:"Cliente balcão",revenue:149.9,cost:97,fees:0,status:"Confirmada"},
  {id:"DEMO-1036",date:"2026-10-05",channel:"Mercado Livre",product:"SSD XrayDisk 480GB",customer:"Bruno P.",revenue:199.9,cost:142,fees:29.98,status:"Confirmada"},
  {id:"DEMO-1035",date:"2026-10-04",channel:"Marketplace",product:"Controle Gamesir T4 Lite",customer:"Gabriel S.",revenue:159.9,cost:105,fees:0,status:"Confirmada"},
  {id:"DEMO-1034",date:"2026-10-02",channel:"WhatsApp",product:"Teclado Fun60 Pro",customer:"Cliente balcão",revenue:189.9,cost:126,fees:0,status:"Confirmada"},
  {id:"DEMO-1033",date:"2026-09-29",channel:"Shopee",product:"Smartwatch W10 Pro",customer:"Fernanda L.",revenue:134.9,cost:76,fees:20.23,status:"Confirmada"},
  {id:"DEMO-1032",date:"2026-09-26",channel:"Instagram",product:"Mouse K-Snake X11",customer:"Rafael N.",revenue:179.9,cost:119,fees:0,status:"Confirmada"},
  {id:"DEMO-1031",date:"2026-09-20",channel:"Mercado Livre",product:"Teclado Ajazz AK680",customer:"Caio T.",revenue:169.9,cost:111,fees:27.18,status:"Pendente"},
];
const money = (n:number) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateBR = (s:string) => new Date(s+"T12:00:00").toLocaleDateString("pt-BR");
const navGroups: {title:string; items:{label:string;icon:LucideIcon}[]}[] = [
 {title:"VISÃO GERAL",items:[{label:"Dashboard",icon:LayoutDashboard},{label:"Relatórios",icon:FileBarChart}]},
 {title:"OPERAÇÃO",items:[{label:"Vendas",icon:ShoppingBag},{label:"Estoque",icon:Boxes},{label:"Compras",icon:ShoppingCart},{label:"Clientes",icon:Users},{label:"Fornecedores",icon:Truck}]},
 {title:"GESTÃO",items:[{label:"Financeiro",icon:Wallet},{label:"Canais de venda",icon:Store},{label:"Metas",icon:TrendingUp}]},
 {title:"SISTEMA",items:[{label:"Integrações",icon:Link2},{label:"Configurações",icon:Settings}]}
];

export default function Home() {
 const [active,setActive] = useState("Dashboard");
 const [period,setPeriod] = useState("30");
 const [channel,setChannel] = useState("Todos os canais");
 const [search,setSearch] = useState("");
 const [menuOpen,setMenuOpen] = useState(false);
 const [showFilters,setShowFilters] = useState(false);
 const [toast,setToast] = useState("");
 const [startDate,setStartDate] = useState("");
 const [endDate,setEndDate] = useState("");
 const [status,setStatus] = useState("Todos");
 const [showDemoNotice,setShowDemoNotice] = useState(true);
 const sales = useMemo(() => demoSales.filter(s => {
   const autoMin = new Date("2026-10-13T12:00:00"); autoMin.setDate(autoMin.getDate()-Number(period));
   const min = startDate || autoMin.toISOString().slice(0,10);
   const max = endDate || "2026-10-13";
   return s.date >= min && s.date <= max &&
     (channel==="Todos os canais" || s.channel===channel) &&
     (status==="Todos" || s.status===status) &&
     (search==="" || [s.id,s.product,s.customer,s.channel].some(v=>v.toLowerCase().includes(search.toLowerCase())));
 }),[period,channel,search,startDate,endDate,status]);
 const confirmed = sales.filter(s=>s.status==="Confirmada");
 const revenue = confirmed.reduce((a,s)=>a+s.revenue,0);
 const costs = confirmed.reduce((a,s)=>a+s.cost,0);
 const fees = confirmed.reduce((a,s)=>a+s.fees,0);
 const profit = revenue-costs-fees;
 const avg = confirmed.length ? revenue/confirmed.length : 0;
 const channels = Object.entries(confirmed.reduce((acc,s)=>({...acc,[s.channel]:(acc[s.channel]||0)+s.revenue}),{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]);
 const notify = (msg:string) => { setToast(msg); window.setTimeout(()=>setToast(""),2600); };
 const exportCSV = () => {
   const rows = [["Data","Pedido","Canal","Produto","Cliente","Faturamento","Custo","Taxas","Lucro estimado","Status"],...sales.map(s=>[s.date,s.id,s.channel,s.product,s.customer,s.revenue,s.cost,s.fees,s.revenue-s.cost-s.fees,s.status])];
   const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\r\n");
   const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"})); a.download="cps-hub-v2-demonstracao.csv"; a.click(); URL.revokeObjectURL(a.href);
   notify("CSV demonstrativo exportado.");
 };
 const navTo = (label:string) => {setActive(label);setMenuOpen(false);};
 const isDashboard = active==="Dashboard";
 const pageSubtitle:Record<string,string> = {
   Dashboard:"Acompanhe os números da operação em um só lugar.",
   Relatórios:"Indicadores consolidados para apoiar suas decisões.",
   Vendas:"Acompanhe pedidos, clientes, canais e status.",
   Estoque:"Visão de produtos, disponibilidade e valor de estoque.",
   Compras:"Controle de reposição e entrada de mercadorias.",
   Clientes:"Central de relacionamento e histórico de compras.",
   Fornecedores:"Organize parceiros e condições de fornecimento.",
   Financeiro:"Receitas, custos, taxas e resultado operacional.",
   "Canais de venda":"Acompanhe a participação de cada canal.",
   Metas:"Acompanhe objetivos e evolução do negócio.",
   Integrações:"Prepare as conexões com os canais de venda.",
   Configurações:"Preferências gerais do CPS Hub."
 };
 return <div className="shell">
  {menuOpen && <button aria-label="Fechar menu" className="mobile-scrim" onClick={()=>setMenuOpen(false)} />}
  <aside className={"sidebar "+(menuOpen?"sidebar-open":"")}>
   <div className="brand"><div className="brand-mark">C</div><div><div className="brand-name">CPS <span>HUB</span></div><div className="brand-version">V2 · CONTROL CENTER</div></div><button className="icon-btn mobile-close" onClick={()=>setMenuOpen(false)} aria-label="Fechar menu"><X size={18}/></button></div>
   <div className="workspace"><div className="workspace-avatar">C</div><div className="workspace-copy"><strong>CPS STORE</strong><span>Workspace principal</span></div><ChevronDown size={15}/></div>
   <nav>{navGroups.map(group=><div className="nav-group" key={group.title}><div className="nav-heading">{group.title}</div>{group.items.map(item=><button key={item.label} className={"nav-item "+(active===item.label?"nav-active":"")} onClick={()=>navTo(item.label)}><item.icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.label==="Integrações"&&<i className="nav-dot"/>}</button>)}</div>)}</nav>
   <div className="sidebar-bottom"><div className="support-card"><div className="support-icon"><LifeBuoy size={17}/></div><div><strong>Precisa de ajuda?</strong><span>Central de suporte</span></div><ArrowUpRight size={14}/></div><div className="profile"><div className="profile-avatar">CP</div><div className="profile-copy"><strong>Administrador</strong><span>Ambiente de demonstração</span></div><MoreHorizontal size={18}/></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-btn" onClick={()=>setMenuOpen(true)} aria-label="Abrir menu"><Menu size={20}/></button><span>CPS STORE</span><span className="crumb-sep">/</span><strong>{active}</strong></div><div className="top-actions"><div className="global-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pedido, produto..." aria-label="Buscar"/></div><button className="icon-btn notification-btn" onClick={()=>notify("Nenhuma notificação nova.")} aria-label="Notificações"><Bell size={18}/><i/></button><div className="top-avatar">CP</div></div></header>
   <div className="page-wrap">
    <div className="page-head"><div><div className="eyebrow"><span className="live-dot"/> PAINEL DE CONTROLE <span className="eyebrow-slash">/</span> CPS STORE</div><h1>{active==="Dashboard"?"Visão geral":active}</h1><p>{pageSubtitle[active]}</p></div><div className="head-actions"><span className="demo-pill"><span/> MODO DEMONSTRAÇÃO</span><button className="button button-outline" onClick={exportCSV}><Download size={15}/> Exportar</button><button className="button button-yellow" onClick={()=>notify(active==="Vendas"?"Cadastro de venda estará disponível na próxima etapa.":"Ação disponível na próxima etapa.")}><Plus size={16}/> {active==="Vendas"?"Nova venda":"Novo registro"}</button></div></div>
    {showDemoNotice&&<div className="demo-notice"><div className="notice-symbol"><Activity size={17}/></div><div><strong>Protótipo visual — dados fictícios</strong><p>Os registros desta tela são demonstrativos. Nenhum dado foi importado ou alterado no sistema de produção.</p></div><button className="icon-btn notice-close" onClick={()=>setShowDemoNotice(false)} aria-label="Fechar aviso"><X size={16}/></button></div>}
    {isDashboard ? <>
      <div className="filterbar"><div className="filter-title"><Filter size={15}/><span>Filtros</span></div><label><span>Período</span><select value={period} onChange={e=>{setPeriod(e.target.value);setStartDate("");setEndDate("");}}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label><label><span>Canal de venda</span><select value={channel} onChange={e=>setChannel(e.target.value)}><option>Todos os canais</option><option>WhatsApp</option><option>Marketplace</option><option>Mercado Livre</option><option>Shopee</option><option>Instagram</option></select></label><button className="filter-toggle" onClick={()=>setShowFilters(v=>!v)}><CalendarDays size={15}/>{showFilters?"Ocultar datas":"Personalizar datas"}</button>{(channel!=="Todos os canais"||startDate||endDate||status!=="Todos")&&<button className="clear-filters" onClick={()=>{setChannel("Todos os canais");setStartDate("");setEndDate("");setStatus("Todos");}}>Limpar</button>}</div>
      {showFilters&&<div className="advanced-filters"><label>Data inicial<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label>Data final<input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Confirmada</option><option>Pendente</option><option>Cancelada</option></select></label><button className="button button-yellow" onClick={()=>notify("Filtros aplicados.")}>Aplicar filtros</button></div>}
      <div className="kpi-grid">
       <Kpi title="Faturamento bruto" value={money(revenue)} change="Vendas confirmadas" icon={CircleDollarSign} iconTone="yellow" trend="up"/>
       <Kpi title="Lucro estimado" value={money(profit)} change="Após custos e taxas registrados" icon={TrendingUp} iconTone="green" trend="up"/>
       <Kpi title="Vendas confirmadas" value={String(confirmed.length)} change={"Ticket médio: "+money(avg)} icon={ShoppingBag} iconTone="purple" trend="neutral"/>
       <Kpi title="Margem estimada" value={(revenue?profit/revenue*100:0).toLocaleString("pt-BR",{maximumFractionDigits:1})+"%"} change="Lucro ÷ faturamento" icon={Gauge} iconTone="blue" trend="neutral"/>
      </div>
      <div className="content-grid">
       <section className="panel chart-panel"><div className="panel-head"><div><h2>Desempenho financeiro</h2><p>Faturamento e lucro por dia no período filtrado</p></div><button className="icon-btn" onClick={()=>notify("Gráfico calculado a partir das vendas demonstrativas filtradas.")} aria-label="Informações do gráfico"><MoreHorizontal size={19}/></button></div><div className="chart-legend"><span><i className="legend-yellow"/>Faturamento</span><span><i className="legend-green"/>Lucro estimado</span></div><FinanceChart sales={confirmed}/><div className="chart-footer"><span><i/> Atualizado com dados de demonstração</span><strong>{confirmed.length} registros no filtro</strong></div></section>
       <section className="panel channel-panel"><div className="panel-head"><div><h2>Vendas por canal</h2><p>Distribuição do faturamento</p></div><button className="text-action" onClick={()=>navTo("Canais de venda")}>Ver canais <ArrowUpRight size={14}/></button></div><div className="channel-list">{channels.length?channels.map(([name,value],i)=><div className="channel-item" key={name}><div className="channel-top"><span><i className={"channel-dot dot-"+i}/>{name}</span><strong>{money(value)}</strong></div><div className="progress-track"><div className={"progress-fill fill-"+i} style={{width:(value/(channels[0]?.[1]||1)*100)+"%"}}/></div><div className="channel-foot"><span>{revenue?(value/revenue*100).toLocaleString("pt-BR",{maximumFractionDigits:1}):0}% do faturamento</span></div></div>):<p className="empty-state">Sem vendas para os filtros selecionados.</p>}</div></section>
      </div>
      <section className="panel sales-panel"><div className="panel-head sales-panel-head"><div><h2>Vendas recentes</h2><p>Últimos pedidos registrados na demonstração</p></div><button className="text-action" onClick={()=>navTo("Vendas")}>Ver todas <ArrowUpRight size={14}/></button></div><div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Produto</th><th>Canal</th><th>Data</th><th>Valor</th><th>Lucro estimado</th><th>Status</th></tr></thead><tbody>{sales.slice(0,6).map(s=><tr key={s.id}><td><strong className="order-id">{s.id}</strong></td><td><div className="product-cell"><span className="product-thumb"><Package size={16}/></span><span>{s.product}</span></div></td><td><span className="channel-label">{s.channel}</span></td><td>{dateBR(s.date)}</td><td className="money-cell">{money(s.revenue)}</td><td className="profit-cell">{money(s.revenue-s.cost-s.fees)}</td><td><Status status={s.status}/></td></tr>)}</tbody></table>{sales.length===0&&<p className="empty-state">Nenhum registro encontrado. Tente mudar os filtros.</p>}</div><div className="table-bottom"><span>Exibindo {Math.min(sales.length,6)} de {sales.length} registros</span><button className="button button-outline button-small" onClick={exportCSV}><Download size={14}/> Exportar CSV</button></div></section>
      <div className="bottom-grid"><section className="panel quick-panel"><div className="panel-head"><div><h2>Acesso rápido</h2><p>Atalhos para tarefas frequentes</p></div></div><div className="quick-links"><QuickLink icon={ShoppingBag} label="Registrar venda" desc="Adicionar novo pedido" onClick={()=>navTo("Vendas")}/><QuickLink icon={Package} label="Consultar estoque" desc="Ver produtos disponíveis" onClick={()=>navTo("Estoque")}/><QuickLink icon={Receipt} label="Ver financeiro" desc="Receitas e despesas" onClick={()=>navTo("Financeiro")}/><QuickLink icon={Users} label="Gerenciar clientes" desc="Cadastro e relacionamento" onClick={()=>navTo("Clientes")}/></div></section><section className="panel summary-panel"><div className="panel-head"><div><h2>Resumo financeiro</h2><p>Composição do resultado operacional</p></div></div><div className="summary-row"><span><i className="summary-dot dot-revenue"/>Faturamento confirmado</span><strong>{money(revenue)}</strong></div><div className="summary-row"><span><i className="summary-dot dot-cost"/>Custo de mercadoria</span><strong className="summary-negative">− {money(costs)}</strong></div><div className="summary-row"><span><i className="summary-dot dot-fees"/>Taxas registradas</span><strong className="summary-negative">− {money(fees)}</strong></div><div className="summary-total"><span>Lucro estimado</span><strong>{money(profit)}</strong></div><p className="summary-note">Estimativa operacional; despesas fixas, impostos e custos não registrados não estão incluídos.</p></section></div>
    </> : <ModuleView active={active} sales={sales} notify={notify} go={navTo} exportCSV={exportCSV}/>}
    <footer className="footer"><span>© 2026 CPS STORE · CPS Hub V2</span><span><i className="footer-dot"/> Ambiente isolado de demonstração</span><span>Versão visual 0.2.0</span></footer>
   </div>
  </main>
  {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
 </div>;
}

function Kpi({title,value,change,icon:Icon,iconTone,trend}:{title:string;value:string;change:string;icon:LucideIcon;iconTone:string;trend:string}) {
 return <section className="kpi-card"><div className="kpi-title"><span>{title}</span><span className={"kpi-icon "+iconTone}><Icon size={19}/></span></div><div className="kpi-value">{value}</div><div className="kpi-change">{trend==="up"?<ArrowUpRight size={14} className="change-icon"/>:<Activity size={13} className="change-muted"}/><span>{change}</span></div></section>;
}
function Status({status}:{status:Sale["status"]}) { return <span className={"status status-"+status.toLowerCase()}><i/>{status}</span>; }
function FinanceChart({sales}:{sales:Sale[]}) {
 const days = useMemo(()=>{const grouped:Record<string,{revenue:number;profit:number}>={};sales.forEach(s=>{grouped[s.date]??={revenue:0,profit:0};grouped[s.date].revenue+=s.revenue;grouped[s.date].profit+=s.revenue-s.cost-s.fees;});return Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0])).slice(-9);},[sales]);
 const max=Math.max(1,...days.map(([,v])=>v.revenue));
 if(!days.length)return <div className="chart-empty">Nenhum dado disponível para desenhar o gráfico.</div>;
 return <div className="bar-chart"><div className="chart-y-labels"><span>{money(max).replace(",00","")}</span><span>{money(max*.66).replace(",00","")}</span><span>{money(max*.33).replace(",00","")}</span><span>R$ 0</span></div><div className="chart-plot"><div className="chart-gridline g1"/><div className="chart-gridline g2"/><div className="chart-gridline g3"/><div className="chart-gridline g4"/><div className="bar-columns">{days.map(([date,v])=><div className="bar-group" key={date} title={dateBR(date)+" · faturamento "+money(v.revenue)}><div className="bars"><span className="bar-revenue" style={{height:(v.revenue/max*100)+"%"}}/><span className="bar-profit" style={{height:(Math.max(0,v.profit)/max*100)+"%"}}/></div><span className="bar-date">{date.slice(8,10)+"/"+date.slice(5,7)}</span></div>)}</div></div></div>;
}
function QuickLink({icon:Icon,label,desc,onClick}:{icon:LucideIcon;label:string;desc:string;onClick:()=>void}) {return <button className="quick-link" onClick={onClick}><span className="quick-icon"><Icon size={17}/></span><span className="quick-copy"><strong>{label}</strong><small>{desc}</small></span><ArrowUpRight size={15} className="quick-arrow"/></button>;}
function ModuleView({active,sales,notify,go,exportCSV}:{active:string;sales:Sale[];notify:(s:string)=>void;go:(s:string)=>void;exportCSV:()=>void}) {
 const modules:Record<string,{icon:LucideIcon;title:string;desc:string;stats:{label:string;value:string}[]}> = {
  "Relatórios":{icon:FileBarChart,title:"Relatórios gerenciais",desc:"Consolide os principais indicadores da operação.",stats:[{label:"Faturamento filtrado",value:money(sales.filter(s=>s.status==="Confirmada").reduce((a,s)=>a+s.revenue,0))},{label:"Pedidos no período",value:String(sales.length)},{label:"Canais ativos na amostra",value:String(new Set(sales.map(s=>s.channel)).size)}]},
  "Vendas":{icon:ShoppingBag,title:"Central de vendas",desc:"Pedidos demonstrativos para validar busca, status e navegação.",stats:[{label:"Pedidos exibidos",value:String(sales.length)},{label:"Confirmados",value:String(sales.filter(s=>s.status==="Confirmada").length)},{label:"Pendentes",value:String(sales.filter(s=>s.status==="Pendente").length)}]},
  "Estoque":{icon:Boxes,title:"Controle de estoque",desc:"Estrutura visual para produtos, saldos, custo e alerta de reposição.",stats:[{label:"Produtos demonstrativos",value:"27"},{label:"Itens em atenção",value:"4"},{label:"Valor estimado do estoque",value:"R$ 4.280,00"}]},
  "Compras":{icon:ShoppingCart,title:"Compras e reposição",desc:"Acompanhe entradas e pedidos a fornecedores.",stats:[{label:"Pedidos de compra",value:"8"},{label:"Aguardando recebimento",value:"2"},{label:"Compras no mês",value:"R$ 2.460,00"}]},
  "Clientes":{icon:Users,title:"Base de clientes",desc:"Cadastro e histórico de relacionamento demonstrativos.",stats:[{label:"Clientes cadastrados",value:"80"},{label:"Clientes recorrentes",value:"23"},{label:"Novos no período",value:"7"}]},
  "Fornecedores":{icon:Truck,title:"Fornecedores",desc:"Organize parceiros, contatos e condições de compra.",stats:[{label:"Fornecedores",value:"3"},{label:"Ativos",value:"3"},{label:"Pendências",value:"1"}]},
  "Financeiro":{icon:Wallet,title:"Gestão financeira",desc:"Visão operacional de receitas, custos e taxas da demonstração.",stats:[{label:"Receita confirmada",value:money(sales.filter(s=>s.status==="Confirmada").reduce((a,s)=>a+s.revenue,0))},{label:"Custos de mercadoria",value:money(sales.filter(s=>s.status==="Confirmada").reduce((a,s)=>a+s.cost,0))},{label:"Taxas registradas",value:money(sales.filter(s=>s.status==="Confirmada").reduce((a,s)=>a+s.fees,0))}]},
  "Canais de venda":{icon:Store,title:"Canais de venda",desc:"Mapa de canais presentes no protótipo; integrações reais serão etapa posterior.",stats:[{label:"Canais planejados",value:"5"},{label:"Canais com vendas na amostra",value:String(new Set(sales.map(s=>s.channel)).size)},{label:"Integrações conectadas",value:"0"}]},
  "Metas":{icon:TrendingUp,title:"Metas e objetivos",desc:"Acompanhe metas de faturamento, lucro e crescimento de estoque.",stats:[{label:"Meta mensal de faturamento",value:"R$ 8.000,00"},{label:"Realizado demonstrativo",value:money(sales.filter(s=>s.status==="Confirmada").reduce((a,s)=>a+s.revenue,0))},{label:"Progresso estimado",value:"32%"}]},
  "Integrações":{icon:Link2,title:"Integrações",desc:"Conexões planejadas. Nenhuma plataforma está conectada nesta versão visual.",stats:[{label:"Planejadas",value:"5"},{label:"Ativas",value:"0"},{label:"Ambiente",value:"Demonstração"}]},
  "Configurações":{icon:Settings,title:"Configurações do workspace",desc:"Preferências visuais e estrutura inicial do ambiente.",stats:[{label:"Workspace",value:"CPS STORE"},{label:"Versão",value:"0.2.0"},{label:"Banco conectado",value:"Não"}]},
 };
 const m=modules[active]||modules["Relatórios"];const Icon=m.icon;
 return <div className="module-view"><div className="module-banner"><div className="module-banner-icon"><Icon size={24}/></div><div><span className="eyebrow">MÓDULO · PROTÓTIPO VISUAL</span><h2>{m.title}</h2><p>{m.desc}</p></div><button className="button button-yellow" onClick={()=>notify("Este módulo está na fase visual. Cadastro e gravação serão implementados após a validação.")}><Plus size={15}/> Novo registro</button></div><div className="module-stats">{m.stats.map(s=><div className="kpi-card" key={s.label}><div className="kpi-title"><span>{s.label}</span></div><div className="kpi-value module-stat-value">{s.value}</div><div className="kpi-change"><Activity size={13}/><span>Valor demonstrativo</span></div></div>)}</div>
 {active==="Vendas"?<section className="panel sales-panel"><div className="panel-head"><div><h2>Pedidos da demonstração</h2><p>Dados fictícios — sem gravação no banco</p></div><button className="button button-outline" onClick={exportCSV}><Download size={14}/> Exportar CSV</button></div><div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Produto</th><th>Canal</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td><strong className="order-id">{s.id}</strong></td><td>{s.product}</td><td>{s.channel}</td><td>{dateBR(s.date)}</td><td className="money-cell">{money(s.revenue)}</td><td><Status status={s.status}/></td></tr>)}</tbody></table></div></section>:<section className="panel module-roadmap"><div className="panel-head"><div><h2>Próximas entregas deste módulo</h2><p>Construção gradual antes de conectar os dados reais</p></div><span className="status status-pendente"><i/>Em planejamento</span></div><div className="roadmap-list"><div><span className="roadmap-number">01</span><div><strong>Definir campos e regras de negócio</strong><p>Validar quais informações devem ser obrigatórias e como os indicadores serão calculados.</p></div></div><div><span className="roadmap-number">02</span><div><strong>Implementar interações e validações</strong><p>Formulários, filtros, estados vazios, confirmação de ações e tratamento de erros.</p></div></div><div><span className="roadmap-number">03</span><div><strong>Conectar após aprovação</strong><p>Somente em ambiente de teste, com permissões e regras de acesso revisadas.</p></div></div></div></section>}
 <div className="module-shortcuts"><button className="button button-outline" onClick={()=>go("Dashboard")}><LayoutDashboard size={15}/> Voltar ao dashboard</button><button className="button button-outline" onClick={()=>go("Relatórios")}><BarChart3 size={15}/> Abrir relatórios</button></div></div>;
}
