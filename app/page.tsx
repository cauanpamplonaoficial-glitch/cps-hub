"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Activity, Boxes, CircleDollarSign, LogOut, Package, Plus, RefreshCw, Search, ShoppingBag, Truck, Users, Wallet, Database } from "lucide-react";

type ModuleName = "products" | "customers" | "suppliers" | "sales" | "purchases" | "inventory_movements" | "expenses" | "v1_archive";
type RowData = Record<string, unknown> & { id: string; created_at?: string };
const modules: { id: ModuleName; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Produtos", icon: Package },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "suppliers", label: "Fornecedores", icon: Truck },
  { id: "sales", label: "Vendas", icon: ShoppingBag },
  { id: "purchases", label: "Compras", icon: Boxes },
  { id: "inventory_movements", label: "Movimentações", icon: Activity },
  { id: "expenses", label: "Despesas", icon: Wallet },
  { id: "v1_archive", label: "Dados migrados do V1", icon: Database },
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
  const [module, setModule] = useState<ModuleName>("products");
  const [rows, setRows] = useState<RowData[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadRows = useCallback(async () => {
    if (!session) return;
    setBusy(true); setNotice("");
    const orderColumn = module === "sales" ? "sold_at" : module === "purchases" ? "ordered_at" : module === "v1_archive" ? "imported_at" : "created_at";
    const { data, error } = await supabase.from(module).select("*").order(orderColumn, { ascending: false }).limit(200);
    if (error) { setRows([]); setNotice(error.message); }
    else setRows((data || []) as RowData[]);
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
    if (module === "v1_archive") return [];
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
    const { error } = await supabase.from(module).insert(payload);
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setNotice("Registro salvo com sucesso."); setShowForm(false); setForm({});
    await loadRows();
  }

  async function deleteRow(id: string) {
    if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    const { error } = await supabase.from(module).delete().eq("id", id);
    setBusy(false);
    if (error) setNotice(error.message); else { setNotice("Registro excluído."); await loadRows(); }
  }

  const visibleRows = rows.filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
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
    if (module === "customers") return [row.name, row.phone || "—", row.email || "—", row.notes || "—"];
    if (module === "suppliers") return [row.name, row.phone || "—", row.email || "—", row.document_number || "—"];
    if (module === "v1_archive") return [row.entity_name, row.legacy_id, JSON.stringify(row.payload || {}).slice(0,220), row.imported_at ? new Date(String(row.imported_at)).toLocaleString("pt-BR") : "—"];
    if (module === "expenses") return [row.description, row.category || "—", money(row.amount), row.due_date || "—", row.status || "pending"];
    if (module === "sales") return [row.order_number || row.id.slice(0,8), row.channel || "Manual", row.status || "pending", new Date(String(row.sold_at)).toLocaleDateString("pt-BR"), money(row.subtotal)];
    if (module === "purchases") return [row.supplier_id || "Sem fornecedor", row.status || "pending", new Date(String(row.ordered_at)).toLocaleDateString("pt-BR"), money(row.total)];
    return [row.movement_type, row.product_id, String(row.quantity_delta), row.notes || "—", new Date(String(row.created_at)).toLocaleDateString("pt-BR")];
  };
  const columns = module === "products" ? ["Produto","SKU","Categoria","Custo","Venda","Estoque"] :
    module === "customers" ? ["Cliente","Telefone","E-mail","Observações"] :
    module === "suppliers" ? ["Fornecedor","Telefone","E-mail","Documento"] :
    module === "expenses" ? ["Despesa","Categoria","Valor","Vencimento","Status"] :
    module === "v1_archive" ? ["Tipo","ID original","Dados preservados (resumo)","Importado em"] :
    module === "sales" ? ["Pedido","Canal","Status","Data","Subtotal"] :
    module === "purchases" ? ["Fornecedor","Status","Data","Total"] : ["Movimento","Produto","Quantidade","Observações","Data"];

  return <main style={{ minHeight: "100vh", background: "#0d0e12", color: "#f3f3f5" }}>
    <header style={{ height: 68, borderBottom: "1px solid #292b32", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 12 }}>
      <div><strong style={{ letterSpacing: 1 }}>CPS <span style={{ color: "#f2cc46" }}>HUB V2</span></strong><div style={{ fontSize: 10, color: "#9295a0", marginTop: 4 }}>AMBIENTE SUPABASE DE TESTES</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}><span style={{ color: "#a2a4ad" }}>{session.user.email}</span><button onClick={()=>supabase.auth.signOut()} style={{ ...styles.button, background: "#25272e", color: "#eee" }}><LogOut size={15}/> Sair</button></div>
    </header>
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", minHeight: "calc(100vh - 68px)" }}>
      <aside style={{ borderRight: "1px solid #292b32", padding: 14 }}>
        <p style={{ fontSize: 10, letterSpacing: 1.5, color: "#777b86", fontWeight: 800, paddingLeft: 10 }}>GESTÃO</p>
        {modules.map(item => { const Icon = item.icon; return <button key={item.id} onClick={()=>{setModule(item.id);setShowForm(false);setForm({});}} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 10px", marginBottom: 4, borderRadius: 8, border: 0, background: module===item.id ? "#2b2718" : "transparent", color: module===item.id ? "#f2cc46" : "#b7b9c2", cursor: "pointer" }}><Icon size={17}/>{item.label}</button>; })}
        <div style={{ margin: "24px 8px", padding: 12, border: "1px solid #3b3524", borderRadius: 9, color: "#c3b77f", fontSize: 11, lineHeight: 1.6 }}>Dados isolados por conta. Vendas e compras preservam os dados importados do V1.</div>
      </aside>
      <section style={{ padding: "28px clamp(14px,3vw,36px)", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><p style={{ color: "#f2cc46", fontSize: 10, letterSpacing: 1.5, fontWeight: 800, margin: 0 }}>CPS STORE / MÓDULOS</p><h1 style={{ fontSize: 28, margin: "8px 0" }}>{title}</h1><p style={{ color: "#9699a3", fontSize: 12, margin: 0 }}>Dados vinculados à sua conta. O arquivo V1 mantém os campos originais para conferência.</p></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={()=>void loadRows()} style={{ ...styles.button, background: "#22242b", color: "#eee" }}><RefreshCw size={15}/> Atualizar</button>{fieldsFor().length>0&&<button onClick={()=>{setShowForm(!showForm);setForm({});}} style={styles.button}><Plus size={16}/> Novo registro</button>}</div>
        </div>
        {notice && <div role="status" style={{ padding: 12, marginTop: 18, borderRadius: 8, border: "1px solid #51451f", background: "#211e13", color: "#e9d68e", fontSize: 12 }}>{notice}</div>}
        {showForm && <form onSubmit={saveRow} style={{ marginTop: 20, padding: 18, border: "1px solid #383a42", borderRadius: 12, background: "#17191e" }}><h2 style={{ fontSize: 15, marginTop: 0 }}>Novo registro — {title}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>{fieldsFor().map(field=><label key={field.key} style={{ display: "grid", gap: 6, color: "#b8bac3", fontSize: 11 }}>{field.label}<input required={field.required} min={field.type==="number" ? "0" : undefined} step={field.type==="number" ? "0.01" : undefined} type={field.type || "text"} value={form[field.key] || ""} onChange={e=>setForm(old=>({...old,[field.key]:e.target.value}))} style={styles.input}/></label>)}</div><div style={{ display: "flex", gap: 8, marginTop: 15 }}><button disabled={busy} type="submit" style={styles.button}>{busy ? "Salvando…" : "Salvar registro"}</button><button type="button" onClick={()=>setShowForm(false)} style={{ ...styles.button, background: "#292b32", color: "#eee" }}>Cancelar</button></div></form>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 12px", flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 230px", padding: "9px 11px", background: "#17191e", border: "1px solid #30323a", borderRadius: 8, color: "#888b95" }}><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar registros…" style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: "#f3f3f5" }}/></div><span style={{ fontSize: 11, color: "#9295a0" }}>{visibleRows.length} registro(s)</span></div>
        <div style={{ border: "1px solid #292b32", borderRadius: 11, overflowX: "auto", background: "#14161b" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620, textAlign: "left" }}><thead><tr>{columns.map(c=><th key={c} style={{ padding: 13, fontSize: 10, color: "#888b95", background: "#1b1d23", borderBottom: "1px solid #30323a" }}>{c}</th>)}<th style={{ padding: 13, fontSize: 10, color: "#888b95", background: "#1b1d23" }}>Ações</th></tr></thead><tbody>{visibleRows.map(row=><tr key={row.id}>{display(row).map((v,i)=><td key={i} style={{ padding: 13, fontSize: 11, color: "#d2d3d9", borderBottom: "1px solid #25272e" }}>{String(v ?? "—")}</td>)}<td style={{ padding: 10, borderBottom: "1px solid #25272e" }}>{["products","customers","suppliers","expenses"].includes(module)&&<button onClick={()=>void deleteRow(row.id)} style={{ border: "1px solid #55333a", borderRadius: 6, padding: "6px 8px", background: "#2b1c20", color: "#f0aab3", cursor: "pointer" }}>Excluir</button>}</td></tr>)}</tbody></table>{!busy&&visibleRows.length===0&&<div style={{ padding: 34, textAlign: "center", color: "#888b95", fontSize: 12 }}>Nenhum registro encontrado. Você pode adicionar um novo registro nos módulos disponíveis.</div>}{busy&&<div style={{ padding: 20, textAlign: "center", color: "#b8bac3", fontSize: 12 }}>Carregando…</div>}</div>
        <p style={{ color: "#696d78", fontSize: 10, marginTop: 18, lineHeight: 1.6 }}>CPS Hub V2 · Dados protegidos por autenticação e RLS. O arquivo de migração preserva o conteúdo original do V1; confira os dados antes de operar estoque e financeiro.</p>
      </section>
    </div>
  </main>;
}
