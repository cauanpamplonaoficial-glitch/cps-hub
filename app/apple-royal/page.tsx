"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Smartphone, LayoutDashboard, Package, ShoppingBag, Wallet, Truck, ShieldCheck, BarChart3, Files, Plus, RefreshCw, Search, Crown, CircleDollarSign, Sun, Moon, Menu, X } from "lucide-react";

type Tab = "overview" | "devices" | "reservations" | "sales" | "finance" | "deliveries" | "warranty" | "reports" | "documents";
type R = Record<string, any> & { id: string };
const nav: {id:Tab;label:string;icon:any}[] = [
 {id:"overview",label:"Visão geral",icon:LayoutDashboard},{id:"devices",label:"Catálogo e aparelhos",icon:Smartphone},
 {id:"reservations",label:"Clientes e reservas",icon:Package},{id:"sales",label:"Vendas",icon:ShoppingBag},
 {id:"finance",label:"Financeiro",icon:Wallet},{id:"deliveries",label:"Entregas e pedidos",icon:Truck},
 {id:"warranty",label:"Garantia e pós-venda",icon:ShieldCheck},{id:"reports",label:"Relatórios",icon:BarChart3},{id:"documents",label:"Histórico e documentos",icon:Files}
];
const tables: Record<Exclude<Tab,"overview"|"reports">,string> = {devices:"apple_royal_devices",reservations:"apple_royal_reservations",sales:"apple_royal_sales",finance:"apple_royal_remittances",deliveries:"apple_royal_deliveries",warranty:"apple_royal_after_sales",documents:"apple_royal_documents"};
const money=(n:any)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const inputStyle:any={width:"100%",padding:"10px 11px",background:"#111318",border:"1px solid #30323a",borderRadius:8,color:"#f4f4f5"};
const button:any={display:"inline-flex",alignItems:"center",gap:8,padding:"10px 13px",border:0,borderRadius:8,background:"#f3c83d",color:"#15130c",fontWeight:700,cursor:"pointer"};
export default function AppleRoyalPage(){
 const [session,setSession]=useState<Session|null>(null); const [ready,setReady]=useState(false);
 const [tab,setTab]=useState<Tab>("overview"); const [rows,setRows]=useState<R[]>([]); const [devices,setDevices]=useState<R[]>([]);
 const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [show,setShow]=useState(false); const [search,setSearch]=useState(""); const [saleRows,setSaleRows]=useState<R[]>([]); const [reservationRows,setReservationRows]=useState<R[]>([]);
 const [f,setF]=useState<Record<string,string>>({}); const [theme,setTheme]=useState<"dark"|"light">("dark"); const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
 useEffect(()=>{const saved=window.localStorage.getItem("cps-hub-theme");if(saved==="light"||saved==="dark")setTheme(saved);supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setReady(true)});return()=>data.subscription.unsubscribe()},[]);
  useEffect(()=>{window.localStorage.setItem("cps-hub-theme",theme)},[theme]);
 const load=useCallback(async()=>{if(!session)return;setBusy(true);setNotice("");if(tab==="overview"||tab==="reports"){const [d,s,r,a]=await Promise.all([supabase.from("apple_royal_devices").select("*"),supabase.from("apple_royal_sales").select("*").order("sold_at",{ascending:false}),supabase.from("apple_royal_remittances").select("*"),supabase.from("apple_royal_after_sales").select("*")]);setDevices((d.data||[]) as R[]);setSaleRows((s.data||[]) as R[]);setRows([{id:"metrics",deviceCount:d.data?.length||0,available:(d.data||[]).filter((x:any)=>x.status==="available").length,sales:s.data||[],remittances:r.data||[],afterSales:a.data||[]} as R]);if(d.error||s.error||r.error||a.error)setNotice((d.error||s.error||r.error||a.error)?.message||"");}else{const table=tables[tab as keyof typeof tables];const {data,error}=await supabase.from(table).select("*").order("created_at",{ascending:false}).limit(500);setRows((data||[]) as R[]);const {data:ds}=await supabase.from("apple_royal_devices").select("id,model,storage,color,status,partner_price,advertised_price").order("created_at",{ascending:false}).limit(500);setDevices((ds||[]) as R[]);const {data:ss}=await supabase.from("apple_royal_sales").select("id,model_snapshot,customer_name,sale_price,status").order("sold_at",{ascending:false}).limit(500);setSaleRows((ss||[]) as R[]);if(tab==="sales"){const result=await supabase.from("apple_royal_reservations").select("id,customer_name,customer_phone,desired_model,device_id,agreed_price,status").eq("status","reserved").order("created_at",{ascending:false}).limit(500);setReservationRows((result.data||[]) as R[]);}if(error)setNotice(error.message)}setBusy(false)},[session,tab]);
 useEffect(()=>{void load()},[load]);
 const fields=():{key:string;label:string;type?:string;required?:boolean;options?:string[]}[]=>{
 if(tab==="devices")return [{key:"model",label:"Modelo",required:true},{key:"storage",label:"Armazenamento"},{key:"color",label:"Cor"},{key:"condition",label:"Condição",options:["Novo","Seminovo","Usado"]},{key:"battery_health",label:"Saúde da bateria (%)",type:"number"},{key:"activation_status",label:"Ativação",options:["Não ativado","Ativado","Não informado"]},{key:"partner_reference",label:"Referência da Apple Royal"},{key:"partner_price",label:"Valor devido à parceira (R$)",type:"number",required:true},{key:"advertised_price",label:"Preço anunciado (R$)",type:"number",required:true},{key:"status",label:"Disponibilidade",options:["available","reserved","sold","unavailable","in_delivery"]},{key:"photo_urls",label:"URLs das fotos (separadas por vírgula)"},{key:"notes",label:"Observações"}];
 if(tab==="reservations")return [{key:"customer_name",label:"Nome do cliente",required:true},{key:"customer_phone",label:"Telefone"},{key:"desired_model",label:"Modelo desejado"},{key:"device_id",label:"Aparelho reservado",options:["",...devices.map(d=>d.id)]},{key:"agreed_price",label:"Valor combinado (R$)",type:"number"},{key:"deposit_amount",label:"Sinal (R$)",type:"number"},{key:"expires_at",label:"Validade da reserva",type:"date"},{key:"status",label:"Status",options:["reserved"]},{key:"notes",label:"Observações"}];
 if(tab==="sales")return [{key:"model_snapshot",label:"Modelo vendido (ex.: iPhone 13 128 GB, usado, bateria 87%)",required:true},{key:"customer_name",label:"Nome do cliente",required:true},{key:"customer_phone",label:"Telefone do cliente"},{key:"sale_price",label:"Preço de venda (R$)",type:"number",required:true},{key:"partner_amount_due",label:"Valor a repassar à Apple Royal (R$)",type:"number",required:true},{key:"additional_costs",label:"Custos adicionais (R$)",type:"number"},{key:"amount_received",label:"Valor já recebido (R$)",type:"number"},{key:"payment_status",label:"Recebimento",options:["pending","partial","received"]},{key:"status",label:"Situação",options:["confirmed","separating","in_delivery","delivered"]},{key:"reservation_id",label:"Vincular reserva existente (opcional)",options:["",...reservationRows.map(r=>r.id)]},{key:"device_id",label:"Vincular aparelho cadastrado (opcional)",options:["",...devices.filter(d=>["available","reserved"].includes(d.status)).map(d=>d.id)]},{key:"notes",label:"Observações"}];
 if(tab==="finance")return [{key:"sale_id",label:"Venda relacionada",options:["",...saleRows.map(x=>x.id)]},{key:"amount",label:"Valor do repasse (R$)",type:"number",required:true},{key:"status",label:"Situação",options:["pending","paid"]},{key:"paid_at",label:"Data do repasse",type:"date"},{key:"payment_method",label:"Método (registro)"},{key:"proof_reference",label:"Referência do comprovante"},{key:"notes",label:"Observações"}];
 if(tab==="deliveries")return [{key:"sale_id",label:"Venda relacionada",options:["",...saleRows.map(x=>x.id)]},{key:"status",label:"Status",options:["pending","separating","shipped","ready_for_pickup","delivered","issue"]},{key:"expected_at",label:"Previsão",type:"date"},{key:"responsible_party",label:"Responsável"},{key:"tracking_reference",label:"Rastreio/referência"},{key:"customer_confirmed",label:"Cliente confirmou? (true/false)",options:["false","true"]},{key:"notes",label:"Observações"}];
 if(tab==="warranty")return [{key:"sale_id",label:"Venda relacionada",options:["",...saleRows.map(x=>x.id)]},{key:"issue",label:"Problema relatado",required:true},{key:"warranty_until",label:"Garantia até",type:"date"},{key:"responsible_party",label:"Responsável",options:["CPS","Apple Royal","A definir"]},{key:"status",label:"Situação",options:["open","in_progress","waiting_partner","resolved","closed"]},{key:"resolution",label:"Solução"},{key:"notes",label:"Observações"}];
 return [{key:"related_type",label:"Tipo relacionado",required:true},{key:"title",label:"Título do documento",required:true},{key:"document_url",label:"Link do documento"},{key:"reference",label:"Referência"},{key:"notes",label:"Observações"}]
 };
 async function save(e:FormEvent){
  e.preventDefault();
  if(!session)return;
  setBusy(true);setNotice("");
  const defs=fields();
  const payload:any={owner_id:session.user.id};
  for(const x of defs){
    const v=f[x.key]||"";
    if(v!==""){
      if(x.type==="number")payload[x.key]=Number(v);
      else if(x.key==="photo_urls")payload[x.key]=v.split(",").map((s:string)=>s.trim()).filter(Boolean);
      else if(x.key==="customer_confirmed")payload[x.key]=v==="true";
      else payload[x.key]=v;
    }
  }
  let error:any=null;
  let insertedId:string|null=null;
  if(tab==="devices"){
    if(!payload.status)payload.status="available";
    const result=await supabase.from("apple_royal_devices").insert(payload).select("id").single();
    error=result.error;insertedId=result.data?.id||null;
  }else if(tab==="reservations"){
    const {data,error:rpcError}=await supabase.rpc("apple_royal_create_reservation",{
      p_device_id:payload.device_id||null,
      p_customer_name:payload.customer_name,
      p_customer_phone:payload.customer_phone||null,
      p_desired_model:payload.desired_model||null,
      p_agreed_price:Number(payload.agreed_price||0),
      p_deposit_amount:Number(payload.deposit_amount||0),
      p_expires_at:payload.expires_at||null,
      p_status:payload.status||"reserved",
      p_notes:payload.notes||null
    });
    error=rpcError;insertedId=typeof data==="string"?data:null;
  }else if(tab==="sales"){
    const {data,error:rpcError}=await supabase.rpc("apple_royal_create_sale",{
      p_device_id:payload.device_id||null,
      p_reservation_id:payload.reservation_id||null,
      p_customer_name:payload.customer_name,
      p_customer_phone:payload.customer_phone||null,
      p_model_snapshot:payload.model_snapshot,
      p_sale_price:Number(payload.sale_price||0),
      p_partner_amount_due:Number(payload.partner_amount_due||0),
      p_additional_costs:Number(payload.additional_costs||0),
      p_amount_received:Number(payload.amount_received||0),
      p_payment_status:payload.payment_status||"pending",
      p_status:payload.status||"confirmed",
      p_notes:payload.notes||null
    });
    error=rpcError;insertedId=typeof data==="string"?data:null;
  }else{
    if(tab==="finance"&&payload.status==="paid"&&!payload.paid_at)payload.paid_at=new Date().toISOString();
    const result=await supabase.from(tables[tab as keyof typeof tables]).insert(payload).select("id").single();
    error=result.error;insertedId=result.data?.id||null;
  }
  setBusy(false);
  if(error){setNotice(error.message||"Não foi possível salvar o registro.");return;}
  setNotice("Registro salvo com sucesso.");
  setShow(false);setF({});
  await load();
 }
 const title=nav.find(n=>n.id===tab)?.label||"Apple Royal";
 if(!ready)return <main style={{background:"#0b0c0f",color:"white",minHeight:"100vh",padding:40}}>Carregando…</main>;
 if(!session)return <main style={{background:"#0b0c0f",color:"white",minHeight:"100vh",display:"grid",placeItems:"center"}}><div style={{maxWidth:440,padding:28,border:"1px solid #292b32",borderRadius:16,background:"#14161b"}}><h1>Apple Royal</h1><p>Entre no CPS Hub V2 para acessar o módulo privado.</p><button style={button} onClick={()=>window.location.assign(new URL("../", window.location.href).toString())}>Ir para login</button></div></main>;
 const metric=rows[0]||{};const sales=(metric.sales||[]) as R[];const rems=(metric.remittances||[]) as R[];
 const activeSales=sales.filter((sale:R)=>!["cancelled","returned","refunded"].includes(String(sale.status||"").toLowerCase()));
 const paidRemittanceBySale=rems.filter((item:R)=>item.status==="paid"&&item.sale_id).reduce((totals:Record<string,number>,item:R)=>({...totals,[item.sale_id]: (totals[item.sale_id]||0)+Number(item.amount||0)}),{});
 const pendingPartnerAmount=activeSales.reduce((sum:number,sale:R)=>sum+Math.max(0,Number(sale.partner_amount_due||0)-Math.max(Number(sale.amount_remitted||0),Number(paidRemittanceBySale[sale.id]||0))),0);
 const receivedSalesAmount=activeSales.reduce((sum:number,sale:R)=>sum+Number(sale.amount_received||0),0);
 const estimatedOperationResult=activeSales.reduce((sum:number,sale:R)=>sum+Number(sale.sale_price||0)-Number(sale.partner_amount_due||0)-Number(sale.additional_costs||0),0);
 const list=rows.filter(r=>r.id!=="metrics"&&JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
 const cols=tab==="devices"?["model","storage","color","condition","partner_price","advertised_price","status"]:tab==="reservations"?["customer_name","desired_model","agreed_price","deposit_amount","status","expires_at"]:tab==="sales"?["model_snapshot","customer_name","sale_price","partner_amount_due","amount_received","payment_status","status"]:tab==="finance"?["sale_id","amount","status","paid_at","payment_method"]:tab==="deliveries"?["sale_id","status","expected_at","responsible_party","customer_confirmed"]:tab==="warranty"?["issue","warranty_until","responsible_party","status","resolution"]:["title","related_type","reference","created_at"];
 function exportCsv() {
   const escapeCsv=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';
   const csv=[cols,...list.map(row=>cols.map(column=>row[column]))].map(line=>line.map(escapeCsv).join(";")).join("\r\n");
   const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8;"});
   const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;
   link.download="apple-royal-"+tab+"-"+new Date().toISOString().slice(0,10)+".csv";link.click();URL.revokeObjectURL(url);
  }
  return <main className={`apple-royal-app${mobileMenuOpen ? " is-menu-open" : ""}`} data-theme={theme} style={{minHeight:"100vh",background:"#0b0c0f",color:"#f4f4f5",display:"grid",gridTemplateColumns:"246px minmax(0,1fr)"}}>
 <aside id="apple-royal-sidebar" className="apple-royal-sidebar" style={{background:"#101115",borderRight:"1px solid #292b32",padding:18,display:"flex",flexDirection:"column",gap:5}}>
 <div style={{padding:"5px 8px 24px"}}><div style={{fontSize:18,fontWeight:900,letterSpacing:1}}>CPS <span style={{color:"#f3c83d"}}>HUB V2</span></div><div style={{fontSize:10,color:"#888b95",marginTop:4}}>PARCERIAS COMERCIAIS</div></div>
 <button onClick={()=>window.location.assign(new URL("../", window.location.href).toString())} style={{...button,background:"#1d1f25",color:"#d8d9de",justifyContent:"flex-start",marginBottom:18}}><ArrowLeft size={15}/> Voltar à CPS Store</button>
 <div style={{display:"flex",alignItems:"center",gap:10,padding:12,background:"#292617",border:"1px solid #4a4122",borderRadius:10,color:"#f3c83d",fontWeight:800,marginBottom:12}}><Crown size={22}/> APPLE ROYAL</div>
 {nav.map(n=>{const I=n.icon;return <button key={n.id} onClick={()=>{setTab(n.id);setShow(false);setF({});setSearch("");setMobileMenuOpen(false)}} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",padding:"11px 10px",border:0,borderRadius:8,background:tab===n.id?"#292617":"transparent",color:tab===n.id?"#f3c83d":"#b7b9c2"}}><I size={17}/>{n.label}</button>})}
 <div style={{marginTop:"auto",fontSize:10,color:"#737783",lineHeight:1.7,padding:10}}>Estoque da parceria separado do estoque próprio. Repasses são apenas registrados; nenhuma transferência real é feita.</div>
 </aside>
 <section className="apple-royal-content" style={{minWidth:0,padding:"30px clamp(16px,3vw,40px)"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:22}}><button className="ar-mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen} aria-controls="apple-royal-sidebar" onClick={()=>setMobileMenuOpen(open=>!open)}>{mobileMenuOpen?<X size={20}/>:<Menu size={20}/>}<span>{mobileMenuOpen?"Fechar":"Menu"}</span></button><div><div style={{fontSize:10,letterSpacing:1.6,color:"#c7a936",fontWeight:800}}>CPS HUB V2 / APPLE ROYAL</div><h1 style={{fontSize:29,margin:"9px 0 6px",letterSpacing:-.6}}>{tab==="overview"?"Apple Royal":title}</h1><p style={{margin:0,color:"#9295a0",fontSize:12}}>Gestão da parceria · iPhones · vendas · repasses · pós-venda</p></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><div className="ar-theme-switch" role="group" aria-label="Escolher tema"><button type="button" aria-pressed={theme==="light"} onClick={()=>setTheme("light")}><Sun size={14}/> Claro</button><button type="button" aria-pressed={theme==="dark"} onClick={()=>setTheme("dark")}><Moon size={14}/> Escuro</button></div><button className="ar-action" style={{...button,background:"#22242b",color:"#eee"}} onClick={exportCsv}>Exportar CSV</button><button className="ar-action" style={{...button,background:"#22242b",color:"#eee"}} onClick={()=>void load()}><RefreshCw size={15}/> Atualizar</button>{tab!=="overview"&&tab!=="reports"&&<button style={button} onClick={()=>{setShow(!show);setF({})}}><Plus size={16}/> Novo registro</button>}</div></div>
 {notice&&<div style={{padding:12,marginBottom:16,border:"1px solid #51451f",background:"#211e13",borderRadius:8,color:"#e9d68e"}}>{notice}</div>}
 {tab==="overview"||tab==="reports"? <>
 <div className="ar-overview">
  <nav className="ar-tabs" aria-label="Navegação Apple Royal">{nav.filter(n=>["overview","devices","reservations","deliveries","finance","warranty","reports","documents"].includes(n.id)).map(n=><button key={n.id} className={tab===n.id?"active":""} onClick={()=>{setTab(n.id);setShow(false);setF({});setSearch("")}}>{n.label==="Visão geral"?"Visão geral":n.label==="Catálogo e aparelhos"?"Aparelhos":n.label==="Clientes e reservas"?"Vendas e reservas":n.label==="Entregas e pedidos"?"Entregas":n.label==="Histórico e documentos"?"Documentos":n.label}</button>)}</nav>
  <div className="ar-clean-hero"><div><span className="ar-eyebrow">APPLE ROYAL · PARCERIA</span><h2>Gestão simples. Visão completa.</h2><p>Acompanhe aparelhos, vendas e repasses sem excesso de informação.</p><button className="ar-hero-cta" onClick={()=>setTab("sales")}><ShoppingBag size={15}/> Registrar venda <span>↗</span></button></div><div className="ar-hero-mark"><Crown size={28}/><span>APPLE ROYAL</span><small>PARCERIA COMERCIAL</small></div></div>
  <div className="ar-clean-metrics">
   {[{label:"Aparelhos disponíveis",value:metric.available||0,change:metric.deviceCount?String(metric.deviceCount)+" cadastrados":"Sem aparelhos",icon:Smartphone,kind:"plain"},{label:"Vendas ativas",value:activeSales.length,change:"Exclui canceladas e devolvidas",icon:ShoppingBag,kind:"plain"},{label:"Saldo estimado a repassar",value:money(pendingPartnerAmount),change:"Vendas ativas menos repasses pagos",icon:Wallet,kind:"money"},{label:"Total vendido",value:money(activeSales.reduce((s:number,x:any)=>s+Number(x.sale_price||0),0)),change:"Valor bruto das vendas ativas",icon:CircleDollarSign,kind:"money"},{label:"Recebido informado",value:money(receivedSalesAmount),change:"Conforme valores registrados nas vendas",icon:Wallet,kind:"money"},{label:"Resultado estimado da operação",value:money(estimatedOperationResult),change:"Após repasse previsto e custos adicionais; estimativa",icon:CircleDollarSign,kind:"money"}].map((m:any,i)=><div className="ar-clean-metric" key={m.label} style={{animationDelay:(i*55)+"ms"}}><div className="ar-metric-top"><span>{m.label}</span><m.icon size={17}/></div><strong>{m.value}</strong><small>{m.change}</small></div>)}
  </div>
  <div className="ar-clean-content">
   <section className="ar-clean-panel ar-devices-panel"><div className="ar-panel-heading"><div><h3>Aparelhos recentes</h3><p>Uma visão rápida do catálogo</p></div><button onClick={()=>setTab("devices")}>Ver aparelhos <span>→</span></button></div>
    {devices.length? <div className="ar-device-list">{devices.slice(0,4).map((d:any)=><article className="ar-device-row" key={d.id}><div className="ar-device-icon"><Smartphone size={19}/></div><div className="ar-device-info"><strong>{[d.model,d.storage].filter(Boolean).join(" ")||"iPhone"}</strong><span>{[d.color,d.condition].filter(Boolean).join(" · ")||"Detalhes não informados"}</span></div><span className={"ar-status "+(d.status==="available"?"is-available":d.status==="sold"?"is-sold":d.status==="reserved"?"is-reserved":"is-other")}>{d.status==="available"?"Disponível":d.status==="sold"?"Vendido":d.status==="reserved"?"Reservado":d.status==="in_delivery"?"Em entrega":"Indisponível"}</span></article>)}</div>:<div className="ar-clean-empty"><Smartphone size={22}/><span>Nenhum aparelho cadastrado.</span><button onClick={()=>setTab("devices")}>Adicionar aparelho</button></div>}
   </section>
   <section className="ar-clean-panel ar-sales-panel"><div className="ar-panel-heading"><div><h3>Últimas vendas</h3><p>Movimentações mais recentes</p></div><button onClick={()=>setTab("sales")}>Ver vendas <span>→</span></button></div>
    {activeSales.length?<div className="ar-sales-list">{activeSales.slice(0,5).map((s:any)=><article className="ar-sale-row" key={s.id}><div className="ar-sale-glyph"><ShoppingBag size={16}/></div><div className="ar-sale-info"><strong>{s.model_snapshot||"Venda de iPhone"}</strong><span>{s.customer_name||"Cliente não informado"}</span></div><div className="ar-sale-value"><strong>{money(s.sale_price)}</strong><span className={"ar-status "+(s.payment_status==="received"?"is-available":s.payment_status==="partial"?"is-reserved":"is-other")}>{s.payment_status==="received"?"Recebido":s.payment_status==="partial"?"Parcial":"Pendente"}</span></div></article>)}</div>:<div className="ar-clean-empty"><ShoppingBag size={22}/><span>As vendas registradas aparecerão aqui.</span><button onClick={()=>setTab("sales")}>Registrar venda</button></div>}
   </section>
  </div>
  <div className="ar-clean-footer"><span><span className="ar-live-dot"/> Dados atualizados a partir da sua conta</span><span>Estoque e financeiro da parceria separados da CPS Store.</span></div>
 </div>
 </>:<><div style={{display:"flex",gap:10,alignItems:"center",margin:"18px 0 12px"}}><div style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",background:"#14161b",border:"1px solid #30323a",borderRadius:8}}><Search size={15} color="#888b95"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nesta área…" style={{background:"transparent",border:0,outline:0,color:"#f4f4f5",width:"100%"}}/></div><span style={{fontSize:11,color:"#9295a0"}}>{list.length} registros</span></div>
 {show&&<form onSubmit={save} style={{padding:18,marginBottom:18,background:"#14161b",border:"1px solid #383a42",borderRadius:12}}><h2 style={{fontSize:15,marginTop:0}}>Novo registro · {title}</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>{fields().map(x=><label key={x.key} style={{display:"grid",gap:6,color:"#b8bac3",fontSize:11}}>{x.label}{x.options?<select required={x.required} value={f[x.key]||""} onChange={e=>{const val=e.target.value;const dev=devices.find(d=>d.id===val);const reservation=reservationRows.find(r=>r.id===val);setF(o=>({...o,[x.key]:val,...(x.key==="device_id"&&dev&&tab==="sales"?{model_snapshot:dev.model+" "+dev.storage,sale_price:String(dev.advertised_price),partner_amount_due:String(dev.partner_price)}:{}),...(x.key==="reservation_id"&&reservation?{device_id:reservation.device_id||"",customer_name:reservation.customer_name||"",customer_phone:reservation.customer_phone||"",model_snapshot:reservation.desired_model||devices.find(d=>d.id===reservation.device_id)?.model||"",sale_price:String(reservation.agreed_price||devices.find(d=>d.id===reservation.device_id)?.advertised_price||0),partner_amount_due:String(devices.find(d=>d.id===reservation.device_id)?.partner_price||0)}:{})}))}} style={inputStyle}>{x.options.map((o:string)=><option key={o} value={o}>{x.key==="reservation_id"?(reservationRows.find(r=>r.id===o)?reservationRows.find(r=>r.id===o)?.customer_name+" · "+(reservationRows.find(r=>r.id===o)?.desired_model||"Reserva"):o||"Selecione"):devices.find(d=>d.id===o)?devices.find(d=>d.id===o)?.model+" "+devices.find(d=>d.id===o)?.storage:o||"Selecione"}</option>)}</select>:<input required={x.required} type={x.type||"text"} min={x.type==="number"?"0":undefined} step={x.type==="number"?(x.key==="battery_health"?"1":"0.01"):undefined} max={x.key==="battery_health"?"100":undefined} value={f[x.key]||""} onChange={e=>setF(o=>({...o,[x.key]:e.target.value}))} style={inputStyle}/>}</label>)}</div><div style={{display:"flex",gap:8,marginTop:15}}><button disabled={busy} type="submit" style={button}>{busy?"Salvando…":"Salvar registro"}</button><button type="button" onClick={()=>setShow(false)} style={{...button,background:"#292b32",color:"#eee"}}>Cancelar</button></div></form>}
 <div style={{overflowX:"auto",border:"1px solid #292b32",borderRadius:11,background:"#14161b"}}><table style={{borderCollapse:"collapse",width:"100%",minWidth:680,textAlign:"left"}}><thead><tr>{cols.map(c=><th key={c} style={{padding:13,color:"#888b95",fontSize:10,background:"#1b1d23",borderBottom:"1px solid #30323a"}}>{c.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{list.map(r=><tr key={r.id}>{cols.map(c=><td key={c} style={{padding:13,fontSize:11,color:"#d2d3d9",borderBottom:"1px solid #25272e"}}>{["partner_price","advertised_price","sale_price","partner_amount_due","amount_received","amount","additional_costs","agreed_price","deposit_amount"].includes(c)?money(r[c]):c==="created_at"||c==="sold_at"?new Date(r[c]).toLocaleDateString("pt-BR"):String(r[c]??"—")}</td>)}</tr>)}</tbody></table>{!busy&&list.length===0&&<div style={{padding:30,textAlign:"center",color:"#888b95"}}>Nenhum registro ainda. Use “Novo registro” para começar.</div>}{busy&&<div style={{padding:20,textAlign:"center",color:"#b8bac3"}}>Carregando…</div>}</div></>}
 <p style={{fontSize:10,color:"#696d78",marginTop:20,lineHeight:1.7}}>Apple Royal · dados privados vinculados à conta autenticada · sem integração bancária ou transferência automática.</p>
 </section></main>;
}
