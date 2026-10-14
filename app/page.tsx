"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getDashboardMetrics } from "@/lib/dashboard-metrics";
import { Activity, Boxes, CircleDollarSign, Crown, LogOut, Package, Plus, RefreshCw, Search, ShoppingBag, Truck, Users, Wallet, Database, Sun, Moon, Menu, X } from "lucide-react";

type ModuleName = "dashboard" | "products" | "customers" | "suppliers" | "sales" | "purchases" | "inventory_movements" | "expenses" | "v1_archive" | "conversations" | "history";
type RowData = Record<string, unknown> & { id: string; created_at?: string };
const modules: { id: ModuleName; label: string; icon: typeof Package }[] = [
  { id: "dashboard", label: "Dashboard executivo", icon: CircleDollarSign },
  { id: "products", label: "Produtos", icon: Package },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "suppliers", label: "Fornecedores", icon: Truck },
  { id: "sales", label: "Vendas", icon: ShoppingBag },
  { id: "purchases", label: "Compras", icon: Boxes },
  { id: "inventory_movements", label: "Movimentações", icon: Activity },
  { id: "expenses", label: "Despesas", icon: Wallet },
  { id: "conversations", label: "Conversas importadas", icon: Users },
  { id: "history", label: "Histórico de atividades", icon: Activity },
  { id: "v1_archive", label: "Outros dados importados", icon: Database },
];
const money = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const styles = {
  input: { width: "100%", padding: "11px 12px", background: "#111318", border: "1px solid #30323a", borderRadius: 8, color: "#f3f3f5", outline: "none" } as const,
  button: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "#f2cc46", color: "#17150d", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" } as const,
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [module, setModule] = useState<ModuleName>("dashboard");
  const [dash, setDash] = useState<Record<string, any>>({});
  const [rows, setRows] = useState<RowData[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [lookupProducts, setLookupProducts] = useState<RowData[]>([]);
  const [lookupCustomers, setLookupCustomers] = useState<RowData[]>([]);
  const [lookupSuppliers, setLookupSuppliers] = useState<RowData[]>([]);

  useEffect(() => { const saved = window.localStorage.getItem("cps-hub-theme"); if (saved === "light" || saved === "dark") setTheme(saved); }, []);
  useEffect(() => { window.localStorage.setItem("cps-hub-theme", theme); }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadRows = useCallback(async () => {
    if (!session) return;
    setBusy(true); setNotice("");
    if (module === "dashboard") {
      const [p,s,bu,e,cu,mv] = await Promise.all([
        supabase.from("products").select("id,name,stock_quantity,min_stock,cost_price,sale_price,active").eq("active",true).limit(2000),
        supabase.from("sales").select("id,subtotal,discount,fees,shipping_cost,status,channel,sold_at,created_at,sale_items(quantity,unit_cost)").order("created_at",{ascending:false}).limit(2000),
        supabase.from("purchases").select("id,total,status,ordered_at,created_at").order("created_at",{ascending:false}).limit(2000),
        supabase.from("expenses").select("id,amount,due_date,paid_at,created_at,status").limit(2000),
        supabase.from("customers").select("id").limit(2000),
        supabase.from("inventory_movements").select("id,created_at,movement_type,quantity_delta").order("created_at",{ascending:false}).limit(8)
      ]);
      const err = [p,s,bu,e,cu,mv].find(x=>x.error);
      if (err?.error) { setNotice(err.error.message); setDash({}); setRows([]); } else {
        setDash({products:p.data||[],sales:s.data||[],purchases:bu.data||[],expenses:e.data||[],customers:cu.data||[],movements:mv.data||[]}); setRows([]);
      }
      setBusy(false); return;
    }
    let query = supabase.from(["conversations","history"].includes(module) ? "v1_archive" : module).select("*");
    if (module === "conversations") query = query.in("entity_name", ["InboxConversation", "InboxMessage", "ChatMessage"]);
    if (module === "history") query = query.eq("entity_name", "AuditLog");
    if (module === "v1_archive") query = query.not("entity_name", "like", "Consorcio%");
    const orderColumn = module === "sales" ? "sold_at" : module === "purchases" ? "ordered_at" : ["v1_archive","conversations","history"].includes(module) ? "imported_at" : "created_at";
    const { data, error } = await query.order(orderColumn, { ascending: false }).limit(["v1_archive","conversations","history"].includes(module) ? 1000 : 200);
    if (error) { setRows([]); setNotice(error.message); }
    else if (module === "customers") {
      const { data: salesData, error: salesError } = await supabase.from("sales").select("customer_id,subtotal,discount,status,sold_at,created_at").not("customer_id", "is", null).limit(2000);
      if (salesError) setNotice("Clientes carregados, mas o histórico de compras não pôde ser consultado: " + salesError.message);
      const summaries = new Map<string, { count: number; total: number; lastPurchase: string | null }>();
      for (const sale of salesData || []) {
        if (["cancelled", "canceled", "returned", "refunded", "void"].includes(String(sale.status || "").toLowerCase())) continue;
        const customerId = String(sale.customer_id || "");
        if (!customerId) continue;
        const summary = summaries.get(customerId) || { count: 0, total: 0, lastPurchase: null };
        summary.count += 1;
        summary.total += Math.max(0, Number(sale.subtotal || 0) - Number(sale.discount || 0));
        const date = String(sale.sold_at || sale.created_at || "");
        if (date && (!summary.lastPurchase || new Date(date).getTime() > new Date(summary.lastPurchase).getTime())) summary.lastPurchase = date;
        summaries.set(customerId, summary);
      }
      setRows(((data || []) as RowData[]).map((customer) => {
        const summary = summaries.get(customer.id) || { count: 0, total: 0, lastPurchase: null };
        return { ...customer, purchase_count: summary.count, total_spent: summary.total, last_purchase: summary.lastPurchase };
      }));
    } else setRows((data || []) as RowData[]);
    if (module === "sales" || module === "purchases") {
      const [p,c,sup] = await Promise.all([
        supabase.from("products").select("id,name,stock_quantity,sale_price,cost_price").eq("active",true).order("name").limit(500),
        supabase.from("customers").select("id,name").order("name").limit(500),
        supabase.from("suppliers").select("id,name").order("name").limit(500)
      ]);
      setLookupProducts((p.data || []) as RowData[]); setLookupCustomers((c.data || []) as RowData[]); setLookupSuppliers((sup.data || []) as RowData[]);
    }
    setBusy(false);
  }, [module, session]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  async function authenticate(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setNotice(result.error.message);
    else if (authMode === "signup" && !result.data.session) setNotice("Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.");
    else setNotice("Autenticação concluída.");
  }

  function fieldsFor(): { key: string; label: string; type?: string; required?: boolean }[] {
    if (module === "products") return [
      { key: "name", label: "Nome do produto", required: true }, { key: "sku", label: "SKU / código" },
      { key: "category", label: "Categoria" }, { key: "cost_price", label: "Custo (R$)", type: "number", required: true },
      { key: "sale_price", label: "Preço de venda (R$)", type: "number", required: true },
      { key: "stock_quantity", label: "Estoque inicial", type: "number", required: true },
      { key: "min_stock", label: "Estoque mínimo", type: "number" }, { key: "description", label: "Descrição" },
    ];
    if (module === "customers") return [
      { key: "name", label: "Nome do cliente", required: true }, { key: "phone", label: "Telefone" },
      { key: "email", label: "E-mail", type: "email" }, { key: "notes", label: "Observações" },
    ];
    if (module === "suppliers") return [
      { key: "name", label: "Nome do fornecedor", required: true }, { key: "phone", label: "Telefone" },
      { key: "email", label: "E-mail", type: "email" }, { key: "document_number", label: "CNPJ/CPF" },
      { key: "notes", label: "Observações" },
    ];
    if (["v1_archive","conversations","history"].includes(module)) return [];
    if (module === "sales") return [
      { key: "customer_id", label: "Cliente (opcional)" }, { key: "product_id", label: "Produto", required: true },
      { key: "quantity", label: "Quantidade", type: "number", required: true }, { key: "unit_price", label: "Preço unitário (R$)", type: "number", required: true },
      { key: "channel", label: "Canal de venda" }, { key: "discount", label: "Desconto (R$)", type: "number" }, { key: "fees", label: "Taxas (R$)", type: "number" },
      { key: "shipping_cost", label: "Frete (R$)", type: "number" }, { key: "notes", label: "Observações" }
    ];
    if (module === "purchases") return [
      { key: "supplier_id", label: "Fornecedor (opcional)" }, { key: "product_id", label: "Produto", required: true },
      { key: "quantity", label: "Quantidade", type: "number", required: true }, { key: "unit_cost", label: "Custo unitário (R$)", type: "number", required: true },
      { key: "notes", label: "Observações" }
    ];
    if (module === "expenses") return [
      { key: "description", label: "Descrição da despesa", required: true }, { key: "category", label: "Categoria" },
      { key: "amount", label: "Valor (R$)", type: "number", required: true }, { key: "due_date", label: "Vencimento", type: "date" },
      { key: "status", label: "Status (pending, paid, cancelled)" },
    ];
    return [];
  }

  async function saveRow(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    const fields = fieldsFor();
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = form[field.key] ?? "";
      if (value !== "") payload[field.key] = field.type === "number" ? Number(value) : value;
    }
    if (module === "expenses" && !payload.status) payload.status = "pending";
    let error: { message: string } | null = null;
    if (module === "products") {
      const { error: rpcError } = await supabase.rpc("create_product_with_opening_stock", {
        p_sku: payload.sku || null,
        p_name: payload.name,
        p_category: payload.category || null,
        p_description: payload.description || null,
        p_cost_price: Number(payload.cost_price || 0),
        p_sale_price: Number(payload.sale_price || 0),
        p_stock_quantity: Math.trunc(Number(payload.stock_quantity || 0)),
        p_min_stock: Math.trunc(Number(payload.min_stock || 0)),
      });
      error = rpcError;
    } else if (module === "sales") {
      const { error: rpcError } = await supabase.rpc("create_sale", { p_customer_id: payload.customer_id || null, p_channel: payload.channel || "Manual", p_notes: payload.notes || null, p_discount: Number(payload.discount || 0), p_fees: Number(payload.fees || 0), p_shipping_cost: Number(payload.shipping_cost || 0), p_items: [{ product_id: payload.product_id, quantity: Number(payload.quantity), unit_price: Number(payload.unit_price) }] });
      error = rpcError;
    } else if (module === "purchases") {
      const { error: rpcError } = await supabase.rpc("create_purchase", { p_supplier_id: payload.supplier_id || null, p_notes: payload.notes || null, p_items: [{ product_id: payload.product_id, quantity: Number(payload.quantity), unit_cost: Number(payload.unit_cost) }] });
      error = rpcError;
    } else { const result = await supabase.from(module).insert(payload); error = result.error; }
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setNotice("Registro salvo com sucesso."); setShowForm(false); setForm({});
    await loadRows();
  }

  async function deleteRow(id: string) {
    const selectedRow = rows.find((row) => row.id === id);
    if (module === "products" && Number(selectedRow?.stock_quantity || 0) > 0) {
      setNotice("Não é possível desativar um produto com estoque disponível. Registre a saída do estoque primeiro.");
      return;
    }
    const actionLabel = module === "products" ? "desativar este produto" : module === "expenses" ? "cancelar esta despesa" : "excluir este cadastro";
    if (!window.confirm("Confirma " + actionLabel + "? O histórico financeiro e de estoque será preservado.")) return;
    setBusy(true);
    let error: { message: string } | null = null;
    if (module === "products") {
      const result = await supabase.from("products").update({ active: false }).eq("id", id);
      error = result.error;
    } else if (module === "expenses") {
      const result = await supabase.from("expenses").update({ status: "cancelled" }).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from(module).delete().eq("id", id);
      error = result.error;
    }
    setBusy(false);
    if (error) setNotice(error.message);
    else { setNotice(module === "products" ? "Produto desativado; o histórico foi preservado." : module === "expenses" ? "Despesa cancelada; o registro foi preservado." : "Cadastro excluído."); await loadRows(); }
  }

  const visibleRows = rows.filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const dashboardMetrics = getDashboardMetrics({ products: dash.products || [], sales: dash.sales || [], purchases: dash.purchases || [], expenses: dash.expenses || [], customers: dash.customers || [] });
  const title = modules.find(m => m.id === module)?.label || "Painel";
  if (!ready) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#eee" }}>Carregando CPS Hub V2…</main>;

  if (!session) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#0d0e12" }}>
    <form onSubmit={authenticate} style={{ width: "100%", maxWidth: 420, padding: 28, border: "1px solid #30323a", borderRadius: 16, background: "#17191e", color: "#f5f5f7" }}>
      <div style={{ color: "#f2cc46", fontWeight: 900, letterSpacing: 2, fontSize: 13 }}>CPS STORE</div>
      <h1 style={{ fontSize: 28, margin: "10px 0 6px" }}>CPS Hub <span style={{ color: "#f2cc46" }}>V2</span></h1>
      <p style={{ color: "#a2a4ad", fontSize: 13, lineHeight: 1.6 }}>Entre ou crie sua conta para acessar seu ambiente privado de testes.</p>
      <label style={{ display: "block", marginTop: 20, fontSize: 12 }}>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{ ...styles.input, marginTop: 7 }} /></label>
      <label style={{ display: "block", marginTop: 14, fontSize: 12 }}>Senha (mínimo 6 caracteres)<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ ...styles.input, marginTop: 7 }} /></label>
      {notice && <p role="status" style={{ color: notice.includes("sucesso") || notice.includes("Confira") ? "#80d6ad" : "#f0c96b", fontSize: 12, lineHeight: 1.5 }}>{notice}</p>}
      <button disabled={busy} type="submit" style={{ ...styles.button, width: "100%", justifyContent: "center", marginTop: 18, opacity: busy ? .65 : 1 }}>{busy ? "Aguarde…" : authMode === "signin" ? "Entrar" : "Criar conta"}</button>
      <button type="button" onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setNotice("");}} style={{ width: "100%", marginTop: 12, padding: 10, color: "#d3d4da", background: "transparent", border: 0, cursor: "pointer" }}>{authMode==="signin" ? "Primeiro acesso? Criar conta" : "Já tenho conta — entrar"}</button>
      <p style={{ color: "#737783", fontSize: 10, lineHeight: 1.5, marginTop: 18 }}>Ambiente de testes isolado. Use dados fictícios; não reutilize senhas de outros serviços.</p>
    </form>
  </main>;

  const display = (row: RowData) => {
    if (module === "products") return [row.name, row.sku || "—", row.category || "—", money(row.cost_price), money(row.sale_price), String(row.stock_quantity ?? 0)];
    if (module === "customers") return [row.name, row.phone || "—", row.email || "—", String(row.purchase_count ?? 0), money(row.total_spent), row.last_purchase ? new Date(String(row.last_purchase)).toLocaleDateString("pt-BR") : "Sem compras", row.notes || "—"];
    if (module === "suppliers") return [row.name, row.phone || "—", row.email || "—", row.document_number || "—"];
    if (["v1_archive","conversations","history"].includes(module)) return [row.entity_name, row.legacy_id, JSON.stringify(row.payload || {}).slice(0,220), row.imported_at ? new Date(String(row.imported_at)).toLocaleString("pt-BR") : "—"];
    if (module === "expenses") return [row.description, row.category || "—", money(row.amount), row.due_date || "—", row.status || "pending"];
    if (module === "sales") return [row.order_number || row.id.slice(0,8), row.channel || "Manual", row.status || "pending", new Date(String(row.sold_at)).toLocaleDateString("pt-BR"), money(row.subtotal)];
    if (module === "purchases") return [row.supplier_id || "Sem fornecedor", row.status || "pending", new Date(String(row.ordered_at)).toLocaleDateString("pt-BR"), money(row.total)];
    return [row.movement_type, row.product_id, String(row.quantity_delta), row.notes || "—", new Date(String(row.created_at)).toLocaleDateString("pt-BR")];
  };
  function exportCsv() {
    const escapeCsv = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const csv = [columns, ...visibleRows.map(row => display(row))].map(line => line.map(escapeCsv).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cps-store-" + module + "-" + new Date().toISOString().slice(0,10) + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const columns = module === "products" ? ["Produto","SKU","Categoria","Custo","Venda","Estoque"] :
    module === "customers" ? ["Cliente","Telefone","E-mail","Compras","Total comprado","Última compra","Observações"] :
    module === "suppliers" ? ["Fornecedor","Telefone","E-mail","Documento"] :
    module === "expenses" ? ["Despesa","Categoria","Valor","Vencimento","Status"] :
    ["v1_archive","conversations","history"].includes(module) ? ["Tipo","ID original","Dados preservados (resumo)","Importado em"] :
    module === "sales" ? ["Pedido","Canal","Status","Data","Subtotal"] :
    module === "purchases" ? ["Fornecedor","Status","Data","Total"] : ["Movimento","Produto","Quantidade","Observações","Data"];

  return <main className="cps-app" data-theme={theme} style={{ minHeight: "100vh", background: theme === "dark" ? "#0d0e12" : "#f4f6fa", color: theme === "dark" ? "#f3f3f5" : "#202431" }}>
    <style jsx global>{`@keyframes cpsFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes cpsGlow{0%,100%{box-shadow:0 0 0 rgba(242,204,70,0)}50%{box-shadow:0 0 24px rgba(242,204,70,.08)}}[data-theme="dark"]{color-scheme:dark;background:#0b0d12!important;color:#f4f6fb!important;--bg:#0b0d12;--surface:#141720;--surface2:#191d27;--text:#f4f6fb;--muted:#a0a9ba;--border:#2a3040;--field:#10131a;--gold:#f5ce4b;--goldText:#17150d}[data-theme="light"]{color-scheme:light;background:#f2f5fa!important;color:#182033!important;--bg:#f2f5fa;--surface:#fff;--surface2:#f8faff;--text:#182033;--muted:#59677e;--border:#dce3ef;--field:#fff;--gold:#f5ce4b;--goldText:#17150d}[data-theme] {transition:background-color .25s ease,color .25s ease}[data-theme] header,[data-theme] aside{transition:background-color .25s ease,border-color .25s ease}[data-theme="dark"] header,[data-theme="dark"] aside{background:#10131a!important;color:#f4f6fb!important;border-color:#252b38!important}[data-theme="dark"] section{background:var(--bg)!important;color:var(--text)!important}[data-theme="light"] header,[data-theme="light"] aside{background:#fff!important;color:#182033!important;border-color:#dce3ef!important;box-shadow:0 4px 24px #23365a08}[data-theme="light"] section{background:radial-gradient(ellipse at 80% 0%,#fff9e8 0%,#f2f5fa 42%)!important;color:#182033!important}[data-theme="light"] section div{border-color:#dce3ef}[data-theme="light"] section div[style*="background:linear-gradient"],[data-theme="light"] section div[style*="background: linear-gradient"],[data-theme="light"] section div[style*="background:radial-gradient"],[data-theme="light"] section div[style*="background: radial-gradient"]{background:linear-gradient(125deg,#fff8df,#ffffff 76%)!important;color:#182033!important;border-color:#eadca4!important}[data-theme="light"] section div[style*="background: #17191e"],[data-theme="light"] section div[style*="background: #14161b"],[data-theme="light"] section div[style*="background: #1b1d23"],[data-theme="light"] section div[style*="background: #15171c"],[data-theme="light"] section div[style*="background: #25272e"],[data-theme="light"] section div[style*="background: #22242b"],[data-theme="light"] section div[style*="background: #292b32"]{background:#fff!important;color:#182033!important;border-color:#dce3ef!important}[data-theme="light"] section *{color:inherit}[data-theme="light"] section p,[data-theme="light"] section label,[data-theme="light"] section small{color:#59677e!important}[data-theme="light"] section h1,[data-theme="light"] section h2,[data-theme="light"] section h3,[data-theme="light"] section strong,[data-theme="light"] section td{color:#182033!important}[data-theme="light"] section [style*="color: #f2cc46"],[data-theme="light"] section [style*="color: #f5ce4b"]{color:#876300!important}[data-theme="light"] section button{transition:transform .18s ease,box-shadow .18s ease,background-color .18s ease;background:#e9eef7!important;color:#202b40!important;border:1px solid #d4ddec!important}[data-theme="light"] section button[style*="background: #f2cc46"],[data-theme="light"] section button[style*="background: #f5ce4b"],[data-theme="light"] section button[type="submit"]{background:#f5ce4b!important;color:#17150d!important;border-color:#e4bd32!important}[data-theme="light"] section input,[data-theme="light"] section select,[data-theme="light"] section textarea{background:#fff!important;color:#182033!important;border:1px solid #cbd5e4!important;box-shadow:0 1px 2px #1927430a!important;color-scheme:light}[data-theme="light"] section input::placeholder,[data-theme="light"] section textarea::placeholder{color:#77849a!important;opacity:1}[data-theme="light"] section table{background:#fff!important;color:#182033!important}[data-theme="light"] section th{background:#edf1f8!important;color:#46536a!important}[data-theme="light"] section td{background:#fff!important;color:#182033!important}[data-theme="light"] aside button{color:#46536a!important;background:transparent!important;border-color:transparent!important}[data-theme="light"] aside button[style*="background: #292617"],[data-theme="light"] aside button[style*="background: #211e13"],[data-theme="light"] aside button[style*="background: rgb(41, 38, 23)"]{background:#fff3c7!important;color:#674d00!important;border-color:#eadca4!important}[data-theme="dark"] section input,[data-theme="dark"] section select,[data-theme="dark"] section textarea{background:#10131a!important;color:#f4f6fb!important;border:1px solid #303748!important;color-scheme:dark}[data-theme="dark"] section table,[data-theme="dark"] section td{background:#141720!important;color:#e9edf5!important}[data-theme="dark"] section th{background:#1c2230!important;color:#b8c1d2!important}[data-theme] section h1{letter-spacing:-.035em}[data-theme] section h2,[data-theme] section h3{letter-spacing:-.02em}[data-theme] section button{transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}[data-theme] section button:hover{transform:translateY(-1px);filter:brightness(1.035);box-shadow:0 7px 18px #10182818}[data-theme] section > div{animation:cpsFadeUp .35s ease both}[data-theme] section div[style*="borderRadius: 12"],[data-theme] section div[style*="borderRadius: 16"],[data-theme] section div[style*="border-radius: 12px"],[data-theme] section div[style*="border-radius: 16px"]{transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}[data-theme="dark"] section div[style*="borderRadius: 12"],[data-theme="dark"] section div[style*="borderRadius: 16"]{box-shadow:0 8px 30px #00000012}[data-theme="light"] section div[style*="borderRadius: 12"],[data-theme="light"] section div[style*="borderRadius: 16"]{box-shadow:0 8px 28px #2538580a}[data-theme] section ::selection{background:#f5ce4b;color:#17150d}[data-theme] ::-webkit-scrollbar{width:10px;height:10px}[data-theme] ::-webkit-scrollbar-thumb{background:#8a93a355;border-radius:20px;border:2px solid transparent;background-clip:content-box}`}</style>
    <header className="cps-header" style={{ height: 68, borderBottom: "1px solid #292b32", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 12 }}>
      <button className="cps-mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(open => !open)}><>{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}<span>{mobileMenuOpen ? "Fechar" : "Menu"}</span></></button>
      <div><strong style={{ letterSpacing: 1 }}>CPS <span style={{ color: "#f2cc46" }}>HUB V2</span></strong><div style={{ fontSize: 10, color: "#9295a0", marginTop: 4 }}>AMBIENTE SUPABASE DE TESTES</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, flexWrap:"wrap" }}><div role="group" aria-label="Escolher tema" style={{display:"inline-flex",alignItems:"center",gap:4,padding:4,borderRadius:10,border:`1px solid ${theme==="dark"?"#30323a":"#dfe4ed"}`,background:theme==="dark"?"#15171c":"#f1f3f7"}}><button type="button" aria-pressed={theme==="light"} onClick={()=>setTheme("light")} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 11px",border:0,borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,background:theme==="light"?"#f2cc46":"transparent",color:theme==="light"?"#17150d":theme==="dark"?"#c4c7d0":"#424858"}}><Sun size={15}/> Claro</button><button type="button" aria-pressed={theme==="dark"} onClick={()=>setTheme("dark")} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 11px",border:0,borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,background:theme==="dark"?"#f2cc46":"transparent",color:theme==="dark"?"#17150d":"#424858"}}><Moon size={15}/> Escuro</button></div><span style={{ color: theme === "dark" ? "#a2a4ad" : "#626979" }}>{session.user.email}</span><button onClick={()=>supabase.auth.signOut()} style={{ ...styles.button, background: "#25272e", color: "#eee" }}><LogOut size={15}/> Sair</button></div>
    </header>
    <div className={`cps-layout${mobileMenuOpen ? " is-menu-open" : ""}`} style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", minHeight: "calc(100vh - 68px)" }}>
      <aside id="cps-sidebar" className="cps-sidebar" style={{ borderRight: "1px solid #292b32", padding: 14 }}>
        <p style={{ fontSize: 10, letterSpacing: 1.5, color: "#777b86", fontWeight: 800, paddingLeft: 10 }}>CPS STORE</p>
        <button onClick={()=>{setMobileMenuOpen(false);window.location.assign(new URL("apple-royal/", window.location.href).toString());}} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",padding:"11px 10px",margin:"12px 0",borderRadius:8,border:"1px solid #4a4122",background:"#292617",color:"#f2cc46",cursor:"pointer",fontWeight:700 }}><Crown size={17}/> Apple Royal <span style={{marginLeft:"auto",fontSize:9,background:"#f2cc46",color:"#17150d",padding:"3px 5px",borderRadius:4}}>PARCERIA</span></button>{modules.map(item => { const Icon = item.icon; return <button key={item.id} onClick={()=>{setModule(item.id);setShowForm(false);setForm({});}} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 10px", marginBottom: 4, borderRadius: 8, border: 0, background: module===item.id ? "#2b2718" : "transparent", color: module===item.id ? "#f2cc46" : "#b7b9c2", cursor: "pointer" }}><Icon size={17}/>{item.label}</button>; })}
        <div style={{ margin: "24px 8px", padding: 12, border: "1px solid #3b3524", borderRadius: 9, color: "#c3b77f", fontSize: 11, lineHeight: 1.6 }}>Dados isolados por conta. Vendas e compras preservam os dados importados do V1.</div>
      </aside>
      <section className="cps-content" style={{ padding: "28px clamp(14px,3vw,36px)", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><p style={{ color: "#f2cc46", fontSize: 10, letterSpacing: 1.5, fontWeight: 800, margin: 0 }}>CPS STORE / MÓDULOS</p><h1 style={{ fontSize: 28, margin: "8px 0" }}>{title}</h1><p style={{ color: "#9699a3", fontSize: 12, margin: 0 }}>Dados vinculados à sua conta. O arquivo V1 mantém os campos originais para conferência.</p></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={exportCsv} style={{ ...styles.button, background: "#22242b", color: "#eee" }}>Exportar CSV</button><button onClick={()=>void loadRows()} style={{ ...styles.button, background: "#22242b", color: "#eee" }}><RefreshCw size={15}/> Atualizar</button>{fieldsFor().length>0&&<button onClick={()=>{setShowForm(!showForm);setForm({});}} style={styles.button}><Plus size={16}/> Novo registro</button>}</div>
        </div>
        {notice && <div role="status" style={{ padding: 12, marginTop: 18, borderRadius: 8, border: "1px solid #51451f", background: "#211e13", color: "#e9d68e", fontSize: 12 }}>{notice}</div>}
        {module === "dashboard" && <div style={{marginTop:24,display:"grid",gap:18}}><div className="cps-panel cps-hero" style={{padding:24,border:"1px solid #393522",borderRadius:16,background:"radial-gradient(circle at top right,#332b13,#17191e 60%)"}}><div style={{color:"#f2cc46",fontSize:10,fontWeight:800,letterSpacing:2}}>VISÃO EXECUTIVA · CPS STORE</div><h2 style={{fontSize:24,margin:"10px 0 6px"}}>Sua operação em um só lugar</h2><p style={{color:"#a2a4ad",fontSize:12,margin:0}}>Indicadores do ambiente de testes. Valores dependem dos registros existentes e do período selecionado: mês atual.</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:18}}><button className="cps-button cps-button--primary" onClick={()=>{setModule("sales");setShowForm(false);}} style={styles.button}><ShoppingBag size={15}/> Registrar venda</button><button className="cps-button" onClick={()=>{setModule("products");setShowForm(false);}} style={{...styles.button,background:"#292b32",color:"#eee"}}><Package size={15}/> Ver estoque</button></div></div><div className="cps-stagger" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>{[{label:"Vendas no mês",value:money(dashboardMetrics.salesTotals.netSales),sub:`${dashboardMetrics.monthlySales.length} registro(s) · líquido após descontos`,icon:ShoppingBag},{label:"Compras no mês",value:money(dashboardMetrics.monthlyPurchaseTotal),sub:`${dashboardMetrics.monthlyPurchases.length} registro(s) não cancelado(s)`,icon:Boxes},{label:"Despesas no mês",value:money(dashboardMetrics.monthlyExpenseTotal),sub:`${dashboardMetrics.monthlyExpenses.length} registro(s) não cancelado(s)`,icon:Wallet},{label:"Clientes cadastrados",value:String((dash.customers||[]).length),sub:"Registros consultados",icon:Users},{label:"Valor do estoque (custo)",value:money(dashboardMetrics.inventoryCost),sub:`${(dash.products||[]).length} produto(s) ativo(s)`,icon:Package},{label:"Margem potencial em estoque",value:money(dashboardMetrics.potentialInventoryMargin),sub:"Estimativa, não lucro realizado",icon:CircleDollarSign}, {label:"Lucro bruto estimado no mês",value:money(dashboardMetrics.salesTotals.estimatedProfit),sub:dashboardMetrics.costBasisComplete ? "Após custo, descontos, taxas e frete; antes das despesas gerais" : "Estimativa parcial: existem itens sem custo unitário válido",icon:CircleDollarSign}].map((m:any)=><div key={m.label} className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#17191e"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#a2a4ad",fontSize:11}}>{m.label}<m.icon size={17} color="#f2cc46"/></div><div className="cps-value" style={{fontSize:22,fontWeight:800,marginTop:13,overflowWrap:"anywhere"}}>{m.value}</div><div style={{fontSize:10,color:"#777b86",marginTop:7}}>{m.sub}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}><div className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#14161b"}}><h3 style={{fontSize:14,marginTop:0}}>Estoque que precisa de atenção</h3>{dashboardMetrics.lowStockProducts.slice(0,8).map((x:any)=><div key={x.id} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"10px 0",borderBottom:"1px solid #25272e",fontSize:11}}><span>{x.name}</span><strong style={{color:"#f0c96b"}}>{x.stock_quantity} un.</strong></div>)}{dashboardMetrics.lowStockProducts.length === 0&&<p style={{fontSize:12,color:"#9295a0"}}>Nenhum produto abaixo do estoque mínimo informado.</p>}</div><div className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#14161b"}}><h3 style={{fontSize:14,marginTop:0}}>Vendas recentes</h3>{dashboardMetrics.sales.slice(0,8).map((x:any)=><div key={x.id} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"10px 0",borderBottom:"1px solid #25272e",fontSize:11}}><span>{x.channel||"Venda"} · {new Date(x.sold_at||x.created_at||Date.now()).toLocaleDateString("pt-BR")}</span><strong>{money(x.total??x.subtotal)}</strong></div>)}{!dashboardMetrics.sales.length&&<p style={{fontSize:12,color:"#9295a0"}}>Ainda não há vendas registradas.</p>}</div><div className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#14161b"}}><h3 style={{fontSize:14,marginTop:0}}>Movimentações recentes</h3>{(dash.movements||[]).map((x:any)=><div key={x.id} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"10px 0",borderBottom:"1px solid #25272e",fontSize:11}}><span>{x.movement_type||"Movimentação"} · {new Date(x.created_at||Date.now()).toLocaleDateString("pt-BR")}</span><strong>{x.quantity_delta??"—"}</strong></div>)}{!(dash.movements||[]).length&&<p style={{fontSize:12,color:"#9295a0"}}>Nenhuma movimentação encontrada.</p>}</div></div><div className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#14161b"}}><h3 style={{fontSize:14,marginTop:0}}>Fechamento de hoje</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}><div><div style={{fontSize:10,color:"#9295a0"}}>Vendas líquidas</div><strong>{money(dashboardMetrics.todaySalesTotals.netSales)}</strong></div><div><div style={{fontSize:10,color:"#9295a0"}}>Despesas pagas</div><strong>{money(dashboardMetrics.todayPaidExpenses)}</strong></div><div><div style={{fontSize:10,color:"#9295a0"}}>Despesas vencendo hoje</div><strong>{money(dashboardMetrics.todayPendingExpenses)}</strong></div><div><div style={{fontSize:10,color:"#9295a0"}}>Resultado estimado após despesas pagas</div><strong>{money(dashboardMetrics.todaySalesTotals.estimatedProfit-dashboardMetrics.todayPaidExpenses)}</strong></div></div><p style={{fontSize:10,color:"#9295a0",marginBottom:0}}>Estimativa baseada nos registros atuais; não substitui conciliação bancária e pode ser parcial se houver itens sem custo.</p></div><div className="cps-card" style={{padding:18,border:"1px solid #2d3038",borderRadius:12,background:"#14161b"}}><h3 style={{fontSize:14,marginTop:0}}>Vendas por canal no mês</h3>{Object.entries(dashboardMetrics.channelTotals).sort((a,b)=>b[1].netSales-a[1].netSales).map(([channel,totals])=><div key={channel} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #25272e",fontSize:11}}><div><strong>{channel}</strong><div style={{color:"#9295a0",marginTop:4}}>{totals.count} venda(s) · resultado bruto estimado {money(totals.estimatedProfit)}</div></div><strong>{money(totals.netSales)}</strong></div>)}{!Object.keys(dashboardMetrics.channelTotals).length&&<p style={{fontSize:12,color:"#9295a0"}}>Não há vendas ativas no período para comparar canais.</p>}</div></div>}\n        {module !== "dashboard" && <>\n        {showForm && <form onSubmit={saveRow} style={{ marginTop: 20, padding: 18, border: "1px solid #383a42", borderRadius: 12, background: "#17191e" }}><h2 style={{ fontSize: 15, marginTop: 0 }}>Novo registro — {title}</h2>{(module === "sales" || module === "purchases") && <p style={{ color: "#d9c777", fontSize: 11 }}>A operação e o movimento de estoque são salvos juntos. Compras entram no estoque imediatamente; vendas validam saldo disponível.</p>}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>{fieldsFor().map(field=><label key={field.key} style={{ display: "grid", gap: 6, color: "#b8bac3", fontSize: 11 }}>{field.label}{field.key === "product_id" ? <select required value={form[field.key] || ""} onChange={e=>{const selected=lookupProducts.find(p=>p.id===e.target.value);setForm(old=>({...old,[field.key]:e.target.value,...(module==="sales"&&selected?{unit_price:String(selected.sale_price ?? 0)}:{}),...(module==="purchases"&&selected?{unit_cost:String(selected.cost_price ?? 0)}:{})}));}} style={styles.input}><option value="">Selecione um produto</option>{lookupProducts.map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name)} · estoque {String(p.stock_quantity ?? 0)}</option>)}</select> : field.key === "customer_id" || field.key === "supplier_id" ? <select value={form[field.key] || ""} onChange={e=>setForm(old=>({...old,[field.key]:e.target.value}))} style={styles.input}><option value="">Sem seleção</option>{(field.key==="customer_id"?lookupCustomers:lookupSuppliers).map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>)}</select> : <input required={field.required} min={field.type==="number" ? "0" : undefined} step={field.type==="number" ? (["quantity","stock_quantity","min_stock"].includes(field.key) ? "1" : "0.01") : undefined} type={field.type || "text"} value={form[field.key] || ""} onChange={e=>setForm(old=>({...old,[field.key]:e.target.value}))} style={styles.input}/>}</label>)}</div><div style={{ display: "flex", gap: 8, marginTop: 15 }}><button disabled={busy} type="submit" style={styles.button}>{busy ? "Salvando…" : "Salvar registro"}</button><button type="button" onClick={()=>setShowForm(false)} style={{ ...styles.button, background: "#292b32", color: "#eee" }}>Cancelar</button></div></form>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 12px", flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 230px", padding: "9px 11px", background: "#17191e", border: "1px solid #30323a", borderRadius: 8, color: "#888b95" }}><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar registros…" style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: "#f3f3f5" }}/></div><span style={{ fontSize: 11, color: "#9295a0" }}>{visibleRows.length} registro(s)</span></div>
        <div style={{ border: "1px solid #292b32", borderRadius: 11, overflowX: "auto", background: "#14161b" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620, textAlign: "left" }}><thead><tr>{columns.map(c=><th key={c} style={{ padding: 13, fontSize: 10, color: "#888b95", background: "#1b1d23", borderBottom: "1px solid #30323a" }}>{c}</th>)}<th style={{ padding: 13, fontSize: 10, color: "#888b95", background: "#1b1d23" }}>Ações</th></tr></thead><tbody>{visibleRows.map(row=><tr key={row.id}>{display(row).map((v,i)=><td key={i} style={{ padding: 13, fontSize: 11, color: "#d2d3d9", borderBottom: "1px solid #25272e" }}>{String(v ?? "—")}</td>)}<td style={{ padding: 10, borderBottom: "1px solid #25272e" }}>{["products","customers","suppliers","expenses"].includes(module)&&<button onClick={()=>void deleteRow(row.id)} style={{ border: "1px solid #55333a", borderRadius: 6, padding: "6px 8px", background: "#2b1c20", color: "#f0aab3", cursor: "pointer" }}>{module==="products"?"Desativar":module==="expenses"?"Cancelar":"Excluir"}</button>}</td></tr>)}</tbody></table>{!busy&&visibleRows.length===0&&<div style={{ padding: 34, textAlign: "center", color: "#888b95", fontSize: 12 }}>Nenhum registro encontrado. Você pode adicionar um novo registro nos módulos disponíveis.</div>}{busy&&<div style={{ padding: 20, textAlign: "center", color: "#b8bac3", fontSize: 12 }}>Carregando…</div>}</div>
        <p style={{ color: "#696d78", fontSize: 10, marginTop: 18, lineHeight: 1.6 }}>CPS Hub V2 · Dados protegidos por autenticação e RLS. Vendas e compras atualizam estoque em transação única. Dados de consórcio foram removidos da interface.</p>
        </>}
      </section>
    </div>
  </main>;
}
