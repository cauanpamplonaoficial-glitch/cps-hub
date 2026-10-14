"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Smartphone, LayoutDashboard, Package, ShoppingBag, Wallet, Truck, ShieldCheck, BarChart3, Files, Plus, RefreshCw, Search, Crown, CircleDollarSign, Sun, Moon, Menu, X } from "lucide-react";

type Tab = "overview" | "devices" | "reservations" | "sales" | "receipts" | "finance" | "deliveries" | "warranty" | "reports" | "documents";
type R = Record<string, any> & { id: string };
const nav: {id:Tab;label:string;icon:any}[] = [
 {id:"overview",label:"Visão geral",icon:LayoutDashboard},{id:"devices",label:"Catálogo e aparelhos",icon:Smartphone},
 {id:"reservations",label:"Clientes e reservas",icon:Package},{id:"sales",label:"Vendas",icon:ShoppingBag},
 {id:"receipts",label:"Recebimentos",icon:CircleDollarSign},{id:"finance",label:"Repasses",icon:Wallet},{id:"deliveries",label:"Entregas e pedidos",icon:Truck},
 {id:"warranty",label:"Garantia e pós-venda",icon:ShieldCheck},{id:"reports",label:"Relatórios",icon:BarChart3},{id:"documents",label:"Histórico e documentos",icon:Files}
];
const tables: Record<Exclude<Tab,"overview"|"reports">,string> = {devices:"apple_royal_devices",reservations:"apple_royal_reservations",sales:"apple_royal_sales",receipts:"apple_royal_receipts",finance:"apple_royal_remittances",deliveries:"apple_royal_deliveries",warranty:"apple_royal_after_sales",documents:"apple_royal_documents"};
const money=(n:any)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const inputStyle:any={width:"100%",padding:"10px 11px",background:"#111318",border:"1px solid #30323a",borderRadius:8,color:"#f4f4f5"};
const button:any={display:"inline-flex",alignItems:"center",gap:8,padding:"10px 13px",border:0,borderRadius:8,background:"#f3c83d",color:"#15130c",fontWeight:700,cursor:"pointer"};
export default function AppleRoyalPage(){
 const [session,setSession]=useState<Session|null>(null); const [ready,setReady]=useState(false);
 const [tab,setTab]=useState<Tab>("overview"); const [rows,setRows]=useState<R[]>([]); const [devices,setDevices]=useState<R[]>([]);
 const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [show,setShow]=useState(false); const [search,setSearch]=useState(""); const [saleRows,setSaleRows]=useState<R[]>([]); const [reservationRows,setReservationRows]=useState<R[]>([]);
 const [f,setF]=useState<Record<string,string>>({}); const [theme,setTheme]=useState<"dark"|"light">("dark"); const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
 const [salesStatus,setSalesStatus]=useState("all"); const [salesBalance,setSalesBalance]=useState("all"); const [page,setPage]=useState(0); const [rowCount,setRowCount]=useState(0);
 const [selectedSale,setSelectedSale]=useState<R|null>(null); const [saleTimeline,setSaleTimeline]=useState<R[]>([]); const [saleDetailBusy,setSaleDetailBusy]=useState(false);
 const [tabReceipts,setTabReceipts]=useState<R[]>([]); const [tabRemittances,setTabRemittances]=useState<R[]>([]);
 const [selectedRows,setSelectedRows]=useState<Set<string>>(new Set());
 const loadSequence=useRef(0);
 const saleDetailSequence=useRef(0);
 useEffect(()=>{const saved=window.localStorage.getItem("cps-hub-theme");if(saved==="light"||saved==="dark")setTheme(saved);supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setReady(true)});return()=>data.subscription.unsubscribe()},[]);
  useEffect(()=>{window.localStorage.setItem("cps-hub-theme",theme)},[theme]);
 const load=useCallback(async()=>{
  if(!session)return;
  const requestId=++loadSequence.current;
  setBusy(true);setNotice("");
  if(tab==="overview"||tab==="reports"){
   const [d,s,r,a,receipts]=await Promise.all([
    supabase.from("apple_royal_devices").select("id,model,storage,color,condition,status,partner_price,advertised_price").limit(500),
    supabase.from("apple_royal_sales").select("id,device_id,reservation_id,customer_name,model_snapshot,sale_price,partner_amount_due,additional_costs,amount_received,amount_remitted,payment_status,status,sold_at,created_at").order("sold_at",{ascending:false}).limit(500),
    supabase.from("apple_royal_remittances").select("id,sale_id,amount,status,paid_at,proof_reference,created_at").limit(1000),
    supabase.from("apple_royal_after_sales").select("id,sale_id,issue,status,created_at").limit(500),
    supabase.from("apple_royal_receipts").select("id,sale_id,amount,received_at,payment_method,reference").limit(1000)
   ]);
   if(requestId!==loadSequence.current)return;
   setDevices((d.data||[]) as R[]);setSaleRows((s.data||[]) as R[]);
   setRows([{id:"metrics",deviceCount:d.data?.length||0,available:(d.data||[]).filter((x:any)=>x.status==="available").length,sales:s.data||[],remittances:r.data||[],receipts:receipts.data||[],afterSales:a.data||[]} as R]);
   const firstError=[d.error,s.error,r.error,a.error,receipts.error].find(Boolean);
   if(firstError)setNotice(firstError.message||"Não foi possível carregar todos os dados financeiros.");
  }else{
   const table=tables[tab as keyof typeof tables];
   let tableQuery=supabase.from(table).select("*",{count:"exact"});
   if(tab==="sales"&&salesStatus!=="all")tableQuery=tableQuery.eq("status",salesStatus);
   if(tab==="sales"&&salesBalance==="pending")tableQuery=tableQuery.in("payment_status",["pending","partial"]);
   if(tab==="sales"&&salesBalance==="settled")tableQuery=tableQuery.eq("payment_status","received");
   const {data,error,count}=await tableQuery.order(tab==="sales"?"sold_at":"created_at",{ascending:false}).range(page*50,page*50+49);
   if(requestId!==loadSequence.current)return;
   setRowCount(count||0);
   setRows((data||[]) as R[]);
   const [ds,ss]=await Promise.all([
    supabase.from("apple_royal_devices").select("id,model,storage,color,status,partner_price,advertised_price").order("created_at",{ascending:false}).limit(500),
    supabase.from("apple_royal_sales").select("id,model_snapshot,customer_name,sale_price,partner_amount_due,amount_received,amount_remitted,status").order("sold_at",{ascending:false}).limit(500)
   ]);
   if(requestId!==loadSequence.current)return;
   setDevices((ds.data||[]) as R[]);setSaleRows((ss.data||[]) as R[]);
   if(tab==="sales"){
    const ids=(data||[]).map((row:any)=>row.id);
    if(ids.length){
     const [receiptResult,remittanceResult]=await Promise.all([
      supabase.from("apple_royal_receipts").select("id,sale_id,amount,received_at").in("sale_id",ids),
      supabase.from("apple_royal_remittances").select("id,sale_id,amount,status,paid_at").in("sale_id",ids)
     ]);
     if(requestId!==loadSequence.current)return;
     setTabReceipts((receiptResult.data||[]) as R[]);setTabRemittances((remittanceResult.data||[]) as R[]);
     if(receiptResult.error||remittanceResult.error)setNotice("Vendas carregadas, mas alguns totais de conciliação não puderam ser conferidos.");
    }else{setTabReceipts([]);setTabRemittances([])}
   }
   if(tab==="sales"){
    const result=await supabase.from("apple_royal_reservations").select("id,customer_name,customer_phone,desired_model,device_id,agreed_price,status").eq("status","reserved").order("created_at",{ascending:false}).limit(500);
    if(requestId!==loadSequence.current)return;
    setReservationRows((result.data||[]) as R[]);
   }
   if(error)setNotice(error.message);
  }
  setBusy(false);
 },[session,tab,page,salesStatus,salesBalance]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{setPage(0);setSelectedRows(new Set())},[tab]);
 useEffect(()=>{
  if(!mobileMenuOpen&&!selectedSale)return;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileMenuOpen(false);setSelectedSale(null)}};
  window.addEventListener("keydown",onKeyDown);
  return()=>window.removeEventListener("keydown",onKeyDown);
 },[mobileMenuOpen,selectedSale]);
 const fields=():{key:string;label:string;type?:string;required?:boolean;options?:string[]}[]=>{
 if(tab==="devices")return [{key:"model",label:"Modelo",required:true},{key:"storage",label:"Armazenamento"},{key:"color",label:"Cor"},{key:"condition",label:"Condição",options:["Novo","Seminovo","Usado"]},{key:"battery_health",label:"Saúde da bateria (%)",type:"number"},{key:"activation_status",label:"Ativação",options:["Não ativado","Ativado","Não informado"]},{key:"partner_reference",label:"Referência da Apple Royal"},{key:"partner_price",label:"Valor devido à parceira (R$)",type:"number",required:true},{key:"advertised_price",label:"Preço anunciado (R$)",type:"number",required:true},{key:"status",label:"Disponibilidade",options:["available","reserved","sold","unavailable","in_delivery"]},{key:"photo_urls",label:"URLs das fotos (separadas por vírgula)"},{key:"notes",label:"Observações"}];
 if(tab==="reservations")return [{key:"customer_name",label:"Nome do cliente",required:true},{key:"customer_phone",label:"Telefone"},{key:"desired_model",label:"Modelo desejado"},{key:"device_id",label:"Aparelho reservado",options:["",...devices.map(d=>d.id)]},{key:"agreed_price",label:"Valor combinado (R$)",type:"number"},{key:"deposit_amount",label:"Sinal (R$)",type:"number"},{key:"expires_at",label:"Validade da reserva",type:"date"},{key:"status",label:"Status",options:["reserved"]},{key:"notes",label:"Observações"}];
 if(tab==="sales")return [{key:"model_snapshot",label:"Modelo vendido (ex.: iPhone 13 128 GB, usado, bateria 87%)",required:true},{key:"customer_name",label:"Nome do cliente",required:true},{key:"customer_phone",label:"Telefone do cliente"},{key:"sale_price",label:"Preço de venda (R$)",type:"number",required:true},{key:"partner_amount_due",label:"Valor a repassar à Apple Royal (R$)",type:"number",required:true},{key:"additional_costs",label:"Custos adicionais (R$)",type:"number"},{key:"amount_received",label:"Valor já recebido (R$)",type:"number"},{key:"status",label:"Situação",options:["confirmed","separating","in_delivery","delivered"]},{key:"reservation_id",label:"Vincular reserva existente (opcional)",options:["",...reservationRows.map(r=>r.id)]},{key:"device_id",label:"Vincular aparelho cadastrado (opcional)",options:["",...devices.filter(d=>["available","reserved"].includes(d.status)).map(d=>d.id)]},{key:"notes",label:"Observações"}];
 if(tab==="receipts")return [{key:"sale_id",label:"Venda relacionada",required:true,options:["",...saleRows.filter(x=>!["cancelled","returned"].includes(String(x.status||""))).map(x=>x.id)]},{key:"amount",label:"Valor efetivamente recebido (R$)",type:"number",required:true},{key:"received_at",label:"Data do recebimento",type:"date"},{key:"payment_method",label:"Método informado"},{key:"reference",label:"Referência/comprovante"},{key:"notes",label:"Observações"}];
 if(tab==="finance")return [{key:"sale_id",label:"Venda relacionada",required:true,options:["",...saleRows.filter(x=>!["cancelled","returned"].includes(String(x.status||""))).map(x=>x.id)]},{key:"amount",label:"Valor informado do repasse (R$)",type:"number",required:true},{key:"status",label:"Situação",options:["pending","paid"]},{key:"paid_at",label:"Data efetiva do pagamento",type:"date"},{key:"payment_method",label:"Método informado"},{key:"proof_reference",label:"Referência do comprovante"},{key:"notes",label:"Observações"}];
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
  }else if(tab==="receipts"){
    const {data,error:rpcError}=await supabase.rpc("apple_royal_record_receipt",{
      p_sale_id:payload.sale_id,p_amount:Number(payload.amount||0),
      p_received_at:payload.received_at||null,p_payment_method:payload.payment_method||null,
      p_reference:payload.reference||null,p_notes:payload.notes||null
    });
    error=rpcError;insertedId=typeof data==="string"?data:null;
  }else if(tab==="finance"){
    const {data,error:rpcError}=await supabase.rpc("apple_royal_record_remittance",{
      p_sale_id:payload.sale_id,p_amount:Number(payload.amount||0),p_status:payload.status||"pending",
      p_paid_at:payload.paid_at||null,p_payment_method:payload.payment_method||null,
      p_proof_reference:payload.proof_reference||null,p_notes:payload.notes||null
    });
    error=rpcError;insertedId=typeof data==="string"?data:null;
  }else{
    const result=await supabase.from(tables[tab as keyof typeof tables]).insert(payload).select("id").single();
    error=result.error;insertedId=result.data?.id||null;
  }
  setBusy(false);
  if(error){setNotice(error.message||"Não foi possível salvar o registro.");return;}
  setNotice("Registro salvo com sucesso.");
  setShow(false);setF({});
  await load();
 }

 async function cancelAppleSale(sale:R){
  const received=Number(sale.amount_received||0);
  const remitted=Number(sale.amount_remitted||0);
  const financialNote=received>0||remitted>0?" Os registros de recebimentos e repasses serão mantidos; qualquer devolução ou ajuste financeiro deverá ser conciliado manualmente. Nenhuma transferência será feita.":"";
  if(!window.confirm(`Cancelar a venda de ${sale.model_snapshot||"aparelho"}? O aparelho vinculado voltará ao disponível e o registro permanecerá no histórico.${financialNote}`))return;
  setBusy(true);setNotice("");
  const {error}=await supabase.rpc("apple_royal_cancel_sale",{p_sale_id:sale.id});
  setBusy(false);
  if(error){setNotice(error.message);return;}
  setNotice("Venda cancelada. O histórico financeiro foi preservado; confira a conciliação caso já houvesse recebimentos ou repasses.");
  await load();
 }
 async function markRemittancePaid(remittance:R){
  if(!window.confirm(`Confirma que o repasse de ${money(remittance.amount)} foi efetivamente pago? Esta ação só atualiza o livro; nenhuma transferência será feita.`))return;
  setBusy(true);setNotice("");
  const {error}=await supabase.rpc("apple_royal_mark_remittance_paid",{
   p_remittance_id:remittance.id,p_paid_at:new Date().toISOString(),
   p_payment_method:remittance.payment_method||null,p_proof_reference:remittance.proof_reference||null,p_notes:null
  });
  setBusy(false);
  if(error){setNotice(error.message);return;}
  setNotice("Repasse marcado como pago e registrado no histórico. Nenhuma transferência foi feita.");
  await load();
 }
 async function openSaleDetails(sale:R){
  const requestId=++saleDetailSequence.current;
  setSelectedSale(sale);setSaleTimeline([]);setSaleDetailBusy(true);
  const [receipts,remittances,deliveries,afterSales,activity]=await Promise.all([
   supabase.from("apple_royal_receipts").select("id,amount,received_at,payment_method,reference,notes").eq("sale_id",sale.id).order("received_at",{ascending:false}),
   supabase.from("apple_royal_remittances").select("id,amount,status,paid_at,payment_method,proof_reference,created_at,notes").eq("sale_id",sale.id).order("created_at",{ascending:false}),
   supabase.from("apple_royal_deliveries").select("id,status,expected_at,tracking_reference,created_at,notes").eq("sale_id",sale.id).order("created_at",{ascending:false}),
   supabase.from("apple_royal_after_sales").select("id,issue,status,warranty_until,resolution,created_at").eq("sale_id",sale.id).order("created_at",{ascending:false}),
   supabase.from("apple_royal_activity_log").select("id,action,details,created_at").eq("entity_id",sale.id).order("created_at",{ascending:false})
  ]);
  if(requestId!==saleDetailSequence.current)return;
  const error=[receipts.error,remittances.error,deliveries.error,afterSales.error,activity.error].find(Boolean);
  if(error)setNotice("Detalhes da venda carregados parcialmente: "+error.message);
  const events:R[]=[
   ...(receipts.data||[]).map((row:any)=>({...row,eventType:"Recebimento",eventDate:row.received_at,eventLabel:money(row.amount)+" recebido · "+(row.payment_method||"método não informado")})),
   ...(remittances.data||[]).map((row:any)=>({...row,eventType:row.status==="paid"?"Repasse pago":"Repasse previsto",eventDate:row.paid_at||row.created_at,eventLabel:money(row.amount)+" · "+(row.payment_method||"sem método informado")})),
   ...(deliveries.data||[]).map((row:any)=>({...row,eventType:"Entrega",eventDate:row.created_at,eventLabel:String(row.status||"status não informado")+(row.tracking_reference?" · "+row.tracking_reference:"")})),
   ...(afterSales.data||[]).map((row:any)=>({...row,eventType:"Pós-venda",eventDate:row.created_at,eventLabel:String(row.status||"aberto")+" · "+String(row.issue||"")})),
   ...(activity.data||[]).map((row:any)=>({...row,eventType:"Histórico",eventDate:row.created_at,eventLabel:String(row.action||"atualização")})),
   {id:"sale-created",eventType:"Venda criada",eventDate:sale.sold_at||sale.created_at,eventLabel:String(sale.status||"confirmed")}
  ].sort((left,right)=>new Date(String(right.eventDate||0)).getTime()-new Date(String(left.eventDate||0)).getTime());
  setSaleTimeline(events);setSaleDetailBusy(false);
 }
 const title=nav.find(n=>n.id===tab)?.label||"Apple Royal";
 const statusLabel=(value:unknown)=>({available:"Disponível",reserved:"Reservado",sold:"Vendido",unavailable:"Indisponível",in_delivery:"Em entrega",confirmed:"Confirmada",separating:"Em preparação",delivered:"Entregue",cancelled:"Cancelada",returned:"Devolvida",pending:"Pendente",partial:"Parcial",received:"Recebido",paid:"Pago",shipped:"Enviado",ready_for_pickup:"Pronto para retirada",issue:"Com problema",open:"Aberto",in_progress:"Em andamento",waiting_partner:"Aguardando parceira",resolved:"Resolvido",closed:"Encerrado"} as Record<string,string>)[String(value)]||String(value??"—");
 const formatCell=(row:R,column:string)=>{
  if(column==="sale_id"){const sale=saleRows.find(item=>item.id===row.sale_id);return sale?`${sale.customer_name||"Cliente"} · ${sale.model_snapshot||"Venda"}`:`Venda ${String(row.sale_id||"").slice(0,8)}`;}
  if(["partner_price","advertised_price","sale_price","partner_amount_due","amount_received","amount_remitted","amount","additional_costs","agreed_price","deposit_amount"].includes(column))return money(row[column]);
  if(column==="status"||column==="payment_status")return statusLabel(row[column]);
  if(["created_at","sold_at","received_at","paid_at","expected_at","expires_at","warranty_until"].includes(column)&&row[column])return new Date(row[column]).toLocaleDateString("pt-BR");
  if(column==="customer_confirmed")return row[column]?"Confirmado":"Não confirmado";
  return String(row[column]??"—");
 };
 if(!ready)return <main style={{background:"#0b0c0f",color:"white",minHeight:"100vh",padding:40}}>Carregando…</main>;
 if(!session)return <main style={{background:"#0b0c0f",color:"white",minHeight:"100vh",display:"grid",placeItems:"center"}}><div style={{maxWidth:440,padding:28,border:"1px solid #292b32",borderRadius:16,background:"#14161b"}}><h1>Apple Royal</h1><p>Entre no CPS Hub V2 para acessar o módulo privado.</p><button style={button} onClick={()=>window.location.assign(new URL("../", window.location.href).toString())}>Ir para login</button></div></main>;
 const metric=rows[0]||{};const sales=(metric.sales||[]) as R[];const rems=(metric.remittances||[]) as R[];
 const activeSales=sales.filter((sale:R)=>!["cancelled","returned","refunded"].includes(String(sale.status||"").toLowerCase()));
 const paidRemittanceBySale=rems.filter((item:R)=>item.status==="paid"&&item.sale_id).reduce<Record<string,number>>((totals,item)=>({...totals,[item.sale_id]: (totals[item.sale_id]||0)+Number(item.amount||0)}),{});
 const receipts=(metric.receipts||[]) as R[];
 const receiptLedger=receipts.length?receipts:tabReceipts;
 const receiptBySale=receiptLedger.filter((item:R)=>item.sale_id).reduce<Record<string,number>>((totals,item)=>({...totals,[item.sale_id]: (totals[item.sale_id]||0)+Number(item.amount||0)}),{});
 const pendingPartnerAmount=activeSales.reduce((sum:number,sale:R)=>sum+Math.max(0,Number(sale.partner_amount_due||0)-Number(paidRemittanceBySale[sale.id]||0)),0);
 const receivedSalesAmount=activeSales.reduce((sum:number,sale:R)=>sum+Number(receiptBySale[sale.id]||0),0);
 const cents=(value:unknown)=>Math.round((Number(value||0)+Number.EPSILON)*100);
 const receiptMismatches=activeSales.filter((sale:R)=>cents(sale.amount_received)!==cents(receiptBySale[sale.id]));
 const remittanceMismatches=activeSales.filter((sale:R)=>cents(sale.amount_remitted)!==cents(paidRemittanceBySale[sale.id]));
 const receiptMismatchAmount=receiptMismatches.reduce((sum:number,sale:R)=>sum+Math.abs(Number(sale.amount_received||0)-Number(receiptBySale[sale.id]||0)),0);
 const remittanceMismatchAmount=remittanceMismatches.reduce((sum:number,sale:R)=>sum+Math.abs(Number(sale.amount_remitted||0)-Number(paidRemittanceBySale[sale.id]||0)),0);
 const estimatedOperationResult=activeSales.reduce((sum:number,sale:R)=>sum+Number(sale.sale_price||0)-Number(sale.partner_amount_due||0)-Number(sale.additional_costs||0),0);
 const referencePendingIds=new Set(activeSales.filter((sale:R)=>receipts.some((item:R)=>item.sale_id===sale.id&&!item.reference)||rems.some((item:R)=>item.sale_id===sale.id&&item.status==="paid"&&!item.proof_reference)).map((sale:R)=>sale.id));
 const pendingSales=activeSales.filter((sale:R)=>Number(receiptBySale[sale.id]||0)<Number(sale.sale_price||0)||Number(paidRemittanceBySale[sale.id]||0)<Number(sale.partner_amount_due||0)||referencePendingIds.has(sale.id));
 const list=rows.filter(r=>r.id!=="metrics"&&JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).filter(sale=>{
  if(tab!=="sales")return true;
  if(salesStatus!=="all"&&sale.status!==salesStatus)return false;
  const remaining=Math.max(0,Number(sale.sale_price||0)-Number(receiptBySale[sale.id]||0));
  if(salesBalance==="pending"&&remaining<=0)return false;
  if(salesBalance==="settled"&&remaining>0)return false;
  return true;
 });
 const cols=tab==="devices"?["model","storage","color","condition","partner_price","advertised_price","status"]:tab==="reservations"?["customer_name","desired_model","agreed_price","deposit_amount","status","expires_at"]:tab==="sales"?["model_snapshot","customer_name","sale_price","partner_amount_due","amount_received","payment_status","status"]:tab==="receipts"?["sale_id","amount","received_at","payment_method","reference","notes"]:tab==="finance"?["sale_id","amount","status","paid_at","payment_method","proof_reference"]:tab==="deliveries"?["sale_id","status","expected_at","responsible_party","customer_confirmed"]:tab==="warranty"?["issue","warranty_until","responsible_party","status","resolution"]:["title","related_type","reference","created_at"];
 function exportCsv() {
   const escapeCsv=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';
   const rowsToExport=selectedRows.size?list.filter(row=>selectedRows.has(row.id)):list;
   const csv=[cols,...rowsToExport.map(row=>cols.map(column=>row[column]))].map(line=>line.map(escapeCsv).join(";")).join("\r\n");
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
 {mobileMenuOpen&&<button className="ar-mobile-scrim" type="button" aria-label="Fechar menu" onClick={()=>setMobileMenuOpen(false)}/>}
 <div className="ar-topbar"><button className="ar-mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen} aria-controls="apple-royal-sidebar" onClick={()=>setMobileMenuOpen(open=>!open)}>{mobileMenuOpen?<X size={20}/>:<Menu size={20}/>}<span>{mobileMenuOpen?"Fechar":"Menu"}</span></button><div className="ar-title-block"><div><div className="ar-eyebrow">CPS HUB V2 / APPLE ROYAL</div><h1>{tab==="overview"?"Apple Royal":title}</h1><p>Gestão da parceria · iPhones · vendas · repasses · pós-venda</p></div><nav className="cps-shop-switcher" aria-label="Alternar loja"><button type="button" onClick={()=>window.location.assign(new URL("../",window.location.href).toString())}><ShoppingBag size={15}/><span>CPS STORE</span></button><button type="button" aria-current="page"><Crown size={15}/><span>APPLE ROYAL</span></button></nav></div><div className="ar-top-actions"><div className="ar-theme-switch" role="group" aria-label="Escolher tema"><button type="button" aria-pressed={theme==="light"} onClick={()=>setTheme("light")}><Sun size={14}/> Claro</button><button type="button" aria-pressed={theme==="dark"} onClick={()=>setTheme("dark")}><Moon size={14}/> Escuro</button></div><button className="ar-action" style={{...button,background:"#22242b",color:"#eee"}} onClick={exportCsv}>Exportar CSV</button><button className="ar-action" style={{...button,background:"#22242b",color:"#eee"}} onClick={()=>void load()}><RefreshCw size={15}/> Atualizar</button>{tab!=="overview"&&tab!=="reports"&&<button style={button} onClick={()=>{setShow(!show);setF({})}}><Plus size={16}/> Novo registro</button>}</div></div>
 {notice&&<div style={{padding:12,marginBottom:16,border:"1px solid #51451f",background:"#211e13",borderRadius:8,color:"#e9d68e"}}>{notice}</div>}
 {tab==="sales"&&<div className="ar-sales-filters" aria-label="Filtros de vendas"><label>Etapa<select value={salesStatus} onChange={event=>{setSalesStatus(event.target.value);setPage(0);setSelectedRows(new Set())}}><option value="all">Todas as etapas</option><option value="confirmed">Confirmada</option><option value="separating">Em preparação</option><option value="in_delivery">Em entrega</option><option value="delivered">Entregue</option><option value="cancelled">Cancelada</option></select></label><label>Recebimento<select value={salesBalance} onChange={event=>{setSalesBalance(event.target.value);setPage(0);setSelectedRows(new Set())}}><option value="all">Todos os saldos</option><option value="pending">Com saldo pendente</option><option value="settled">Recebidas integralmente</option></select></label><span>{list.length} venda(s) nesta página filtrada</span></div>}
 {tab==="overview"||tab==="reports"? <>
 <div className="ar-overview">
  <nav className="ar-tabs" aria-label="Navegação Apple Royal">{nav.filter(n=>["overview","devices","reservations","deliveries","receipts","finance","warranty","reports","documents"].includes(n.id)).map(n=><button key={n.id} className={tab===n.id?"active":""} onClick={()=>{setTab(n.id);setShow(false);setF({});setSearch("")}}>{n.label==="Visão geral"?"Visão geral":n.label==="Catálogo e aparelhos"?"Aparelhos":n.label==="Clientes e reservas"?"Vendas e reservas":n.label==="Entregas e pedidos"?"Entregas":n.label==="Histórico e documentos"?"Documentos":n.label}</button>)}</nav>
  <div className="ar-clean-hero"><div><span className="ar-eyebrow">APPLE ROYAL · PARCERIA</span><h2>Gestão simples. Visão completa.</h2><p>Acompanhe aparelhos, vendas e repasses sem excesso de informação.</p><button className="ar-hero-cta" onClick={()=>setTab("sales")}><ShoppingBag size={15}/> Registrar venda <span>↗</span></button></div><div className="ar-hero-mark"><Crown size={28}/><span>APPLE ROYAL</span><small>PARCERIA COMERCIAL</small></div></div>
  <div className="ar-clean-metrics">
   {[{label:"Aparelhos disponíveis",value:metric.available||0,change:metric.deviceCount?String(metric.deviceCount)+" cadastrados":"Sem aparelhos",icon:Smartphone,kind:"plain"},{label:"Vendas ativas",value:activeSales.length,change:"Exclui canceladas e devolvidas",icon:ShoppingBag,kind:"plain"},{label:"Saldo estimado a repassar",value:money(pendingPartnerAmount),change:"Vendas ativas menos repasses pagos registrados",icon:Wallet,kind:"money"},{label:"Total vendido",value:money(activeSales.reduce((s:number,x:any)=>s+Number(x.sale_price||0),0)),change:"Valor bruto das vendas ativas",icon:CircleDollarSign,kind:"money"},{label:"Recebido no livro",value:money(receivedSalesAmount),change:"Soma dos recebimentos registrados",icon:Wallet,kind:"money"},{label:"Resultado estimado da operação",value:money(estimatedOperationResult),change:"Após repasse previsto e custos adicionais; estimativa",icon:CircleDollarSign,kind:"money"}].map((m:any,i)=><div className="ar-clean-metric" key={m.label} style={{animationDelay:(i*55)+"ms"}}><div className="ar-metric-top"><span>{m.label}</span><m.icon size={17}/></div><strong>{m.value}</strong><small>{m.change}</small></div>)}
  </div>
  {(receiptMismatches.length+remittanceMismatches.length)>0&&<section className="ar-reconciliation-alert" role="status"><div><strong>Conciliação pendente</strong><p>{receiptMismatches.length>0?`${receiptMismatches.length} venda(s) têm diferença no livro de recebimentos (${money(receiptMismatchAmount)}). `:""}{remittanceMismatches.length>0?`${remittanceMismatches.length} venda(s) têm diferença no livro de repasses (${money(remittanceMismatchAmount)}).`:""}Os valores existentes foram preservados; confira os registros antes de lançar novos valores.</p></div><div><button type="button" onClick={()=>setTab("receipts")}>Ver recebimentos</button><button type="button" onClick={()=>setTab("finance")}>Ver repasses</button></div></section>}
  {referencePendingIds.size>0&&<div className="ar-reconciliation-alert" role="status"><div><strong>Referências pendentes</strong><p>{referencePendingIds.size} venda(s) têm recebimentos sem referência ou repasses pagos sem comprovante registrado. Confira os documentos antes de fechar a conciliação.</p></div><button type="button" onClick={()=>setTab("sales")}>Revisar vendas</button></div>}
  <section className="ar-pending-queue"><div><span className="ar-eyebrow">PRÓXIMAS AÇÕES</span><h3>Pendências financeiras</h3><p>Recebimentos e repasses que ainda precisam de conferência.</p></div><div className="ar-pending-list">{pendingSales.slice(0,5).map((sale:R)=><article key={sale.id}><div><strong>{sale.customer_name||sale.model_snapshot||"Venda"}</strong><span>{sale.model_snapshot||"Modelo não informado"} · faltam receber {money(Math.max(0,Number(sale.sale_price||0)-Number(receiptBySale[sale.id]||0)))}</span></div><span>Repassar {money(Math.max(0,Number(sale.partner_amount_due||0)-Number(paidRemittanceBySale[sale.id]||0)))}</span><button type="button" onClick={()=>void openSaleDetails(sale)}>Ver venda</button></article>)}{!pendingSales.length&&<div className="ar-pending-empty">Nenhuma pendência financeira identificada nas vendas carregadas.</div>}</div><button type="button" className="ar-pending-all" onClick={()=>{setTab("sales");setSalesBalance("pending")}}>Ver fila completa →</button></section>
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
 {selectedRows.size>0&&<div className="cps-selection-bar"><strong>{selectedRows.size} selecionado(s)</strong><span>Exportação segura dos registros selecionados.</span><button type="button" onClick={exportCsv}>Exportar selecionados</button><button type="button" onClick={()=>setSelectedRows(new Set())}>Limpar seleção</button></div>}
 <div style={{overflowX:"auto",border:"1px solid #292b32",borderRadius:11,background:"#14161b"}}><table style={{borderCollapse:"collapse",width:"100%",minWidth:710,textAlign:"left"}}><thead><tr><th style={{padding:10,background:"#1b1d23"}}><input type="checkbox" aria-label="Selecionar registros desta página" checked={list.length>0&&list.every(row=>selectedRows.has(row.id))} onChange={event=>setSelectedRows(previous=>{const next=new Set(previous);list.forEach(row=>event.target.checked?next.add(row.id):next.delete(row.id));return next})}/></th>{cols.map(c=><th key={c} style={{padding:13,color:"#888b95",fontSize:10,background:"#1b1d23",borderBottom:"1px solid #30323a"}}>{c.replaceAll("_"," ")}</th>)}{["sales","finance"].includes(tab)&&<th style={{padding:13,color:"#888b95",fontSize:10,background:"#1b1d23",borderBottom:"1px solid #30323a"}}>Ações</th>}</tr></thead><tbody>{list.map(r=><tr key={r.id}><td style={{padding:10,borderBottom:"1px solid #25272e"}}><input type="checkbox" aria-label={`Selecionar registro ${r.id.slice(0,8)}`} checked={selectedRows.has(r.id)} onChange={event=>setSelectedRows(previous=>{const next=new Set(previous);event.target.checked?next.add(r.id):next.delete(r.id);return next})}/></td>{cols.map(c=><td key={c} style={{padding:13,fontSize:11,color:"#d2d3d9",borderBottom:"1px solid #25272e"}}>{formatCell(r,c)}</td>)}{["sales","finance"].includes(tab)&&<td style={{padding:10,borderBottom:"1px solid #25272e",whiteSpace:"nowrap"}}>{tab==="sales"&&<><button type="button" disabled={busy} onClick={()=>void openSaleDetails(r)} className="ar-secondary-action">Detalhes</button>{!["cancelled","returned","refunded"].includes(String(r.status||""))&&<button type="button" disabled={busy} onClick={()=>void cancelAppleSale(r)} style={{border:"1px solid #55333a",borderRadius:6,padding:"7px 9px",background:"#2b1c20",color:"#f0aab3",fontSize:11,fontWeight:700,cursor:"pointer"}}>Cancelar</button>}</>}{tab==="finance"&&r.status==="pending"&&<button type="button" disabled={busy} onClick={()=>void markRemittancePaid(r)} style={{border:"1px solid #375844",borderRadius:6,padding:"7px 9px",background:"#18271e",color:"#8bd7a3",fontSize:11,fontWeight:700,cursor:"pointer"}}>Confirmar pagamento</button>}</td>}</tr>)}</tbody></table>{!busy&&list.length===0&&<div style={{padding:30,textAlign:"center",color:"#888b95"}}>Nenhum registro encontrado para estes filtros.</div>}{busy&&<div style={{padding:20,textAlign:"center",color:"#b8bac3"}}>Carregando…</div>}</div>
 {rowCount>50&&<div className="cps-pagination"><span>{page*50+1}–{Math.min((page+1)*50,rowCount)} de {rowCount}</span><button type="button" disabled={page===0||busy} onClick={()=>setPage(value=>Math.max(0,value-1))}>Anterior</button><button type="button" disabled={(page+1)*50>=rowCount||busy} onClick={()=>setPage(value=>value+1)}>Próxima</button></div>}
 </>}
 {selectedSale&&<div className="ar-sale-modal" role="presentation" onClick={event=>{if(event.target===event.currentTarget)setSelectedSale(null)}}><section role="dialog" aria-modal="true" aria-labelledby="ar-sale-detail-title" className="ar-sale-detail"><div className="ar-sale-detail-head"><div><span className="ar-eyebrow">FICHA DA VENDA</span><h2 id="ar-sale-detail-title">{selectedSale.model_snapshot||"Venda Apple Royal"}</h2><p>{selectedSale.customer_name||"Cliente não informado"} · {statusLabel(selectedSale.status)}</p></div><button type="button" aria-label="Fechar detalhes da venda" onClick={()=>setSelectedSale(null)}>Fechar</button></div><div className="ar-sale-finance-grid"><div><span>Preço da venda</span><strong>{money(selectedSale.sale_price)}</strong></div><div><span>Recebido no livro</span><strong>{money(saleTimeline.filter(item=>item.eventType==="Recebimento").reduce((sum,item)=>sum+Number(item.amount||0),0))}</strong></div><div><span>Saldo do cliente</span><strong>{money(Math.max(0,Number(selectedSale.sale_price||0)-saleTimeline.filter(item=>item.eventType==="Recebimento").reduce((sum,item)=>sum+Number(item.amount||0),0)))}</strong></div><div><span>Devido à parceira</span><strong>{money(selectedSale.partner_amount_due)}</strong></div><div><span>Repasses pagos</span><strong>{money(saleTimeline.filter(item=>item.eventType==="Repasse pago").reduce((sum,item)=>sum+Number(item.amount||0),0))}</strong></div><div><span>Resultado estimado</span><strong>{money(Number(selectedSale.sale_price||0)-Number(selectedSale.partner_amount_due||0)-Number(selectedSale.additional_costs||0))}</strong></div></div><p className="ar-sale-estimate-note">Estimativa após o valor previsto à parceira e custos adicionais informados. Não inclui despesas gerais.</p><div className="ar-timeline-heading"><h3>Linha do tempo</h3>{saleDetailBusy&&<span>Carregando eventos…</span>}</div><div className="ar-sale-timeline">{saleTimeline.map(event=><article key={event.id}><span className="ar-timeline-dot"/><div><strong>{event.eventType}</strong><p>{event.eventLabel}</p><small>{event.eventDate?new Date(String(event.eventDate)).toLocaleString("pt-BR"):"Data não informada"}</small></div></article>)}{!saleTimeline.length&&!saleDetailBusy&&<p>Nenhum evento financeiro ou operacional encontrado.</p>}</div></section></div>}
 <p style={{fontSize:10,color:"#696d78",marginTop:20,lineHeight:1.7}}>Apple Royal · dados privados vinculados à conta autenticada · sem integração bancária ou transferência automática.</p>
 </section></main>;
}
