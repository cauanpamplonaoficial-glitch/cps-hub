"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { addSaleCartLine, getSaleCartSubtotal, type SaleCartLine, type SaleCartProduct } from "@/lib/sale-cart";

type SaleCartEditorProps = {
  products: SaleCartProduct[];
  items: SaleCartLine[];
  onChange: (items: SaleCartLine[]) => void;
  disabled?: boolean;
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "10px 11px",
  border: "1px solid #30323a",
  borderRadius: 8,
  background: "#111318",
  color: "#f3f3f5",
};

export function SaleCartEditor({ products, items, onChange, disabled = false }: SaleCartEditorProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const hasAvailableProducts = products.some((product) => Number(product.stock_quantity) > 0);

  function addItem() {
    const result = addSaleCartLine(items, {
      product_id: productId,
      quantity: Number(quantity),
      unit_price: unitPrice,
    }, products);
    if (result.error) {
      setError(result.error);
      return;
    }
    onChange(result.items);
    setProductId("");
    setQuantity("1");
    setUnitPrice("");
    setError("");
  }

  return (
    <section
      aria-label="Itens da venda"
      style={{ margin: "14px 0", padding: 14, border: "1px solid #353741", borderRadius: 10, background: "#14161b" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <strong style={{ color: "#f4f4f6", fontSize: 13 }}>Produtos da venda</strong>
        <span style={{ color: "#9699a3", fontSize: 11 }}>Estoque validado novamente ao salvar</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 5, color: "#b8bac3", fontSize: 11 }}>
          Produto
          <select
            aria-label="Produto da venda"
            value={productId}
            disabled={disabled || !hasAvailableProducts}
            onChange={(event) => {
              const nextId = event.target.value;
              const product = products.find((row) => row.id === nextId);
              setProductId(nextId);
              setUnitPrice(product ? Number(product.sale_price || 0).toFixed(2) : "");
              setError("");
            }}
            style={inputStyle}
          >
            <option value="">Selecione um produto</option>
            {products.map((product) => {
              const available = Math.max(0, Math.trunc(Number(product.stock_quantity) || 0));
              return (
                <option key={product.id} value={product.id} disabled={available === 0}>
                  {product.name} · {available} un.
                </option>
              );
            })}
          </select>
        </label>

        <label style={{ display: "grid", gap: 5, color: "#b8bac3", fontSize: 11 }}>
          Quantidade
          <input
            aria-label="Quantidade do produto"
            type="number"
            min="1"
            step="1"
            value={quantity}
            disabled={disabled}
            onChange={(event) => setQuantity(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 5, color: "#b8bac3", fontSize: 11 }}>
          Preço unitário (R$)
          <input
            aria-label="Preço unitário do produto"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            disabled={disabled}
            onChange={(event) => setUnitPrice(event.target.value)}
            style={inputStyle}
          />
        </label>

        <button
          type="button"
          disabled={disabled || !hasAvailableProducts}
          onClick={addItem}
          style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 7, padding: "10px 12px", border: 0, borderRadius: 8, background: "#f2cc46", color: "#17150d", fontWeight: 700, cursor: "pointer" }}
        >
          <Plus size={15} /> Adicionar item
        </button>
      </div>

      {error && <p role="alert" style={{ margin: "9px 0 0", color: "#f0aab3", fontSize: 11 }}>{error}</p>}
      {!hasAvailableProducts && <p role="status" style={{ margin: "9px 0 0", color: "#d9c777", fontSize: 11 }}>Nenhum produto ativo com estoque foi encontrado.</p>}

      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {items.map((line) => {
          const product = products.find((row) => row.id === line.product_id);
          const label = product?.name || "Produto não encontrado";
          return (
            <div key={line.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", alignItems: "center", gap: 10, padding: "9px 10px", border: "1px solid #292b32", borderRadius: 8, background: "#111318", color: "#d2d3d9", fontSize: 11 }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><strong>{label}</strong><br />{line.quantity} × {money(line.unit_price)}</span>
              <strong>{money(line.quantity * line.unit_price)}</strong>
              <button
                type="button"
                aria-label={`Remover ${label} da venda`}
                disabled={disabled}
                onClick={() => onChange(items.filter((item) => item.id !== line.id))}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 8px", border: "1px solid #55333a", borderRadius: 7, background: "#2b1c20", color: "#f0aab3", cursor: "pointer" }}
              >
                <Minus size={13} /> Remover
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid #292b32", color: "#d2d3d9", fontSize: 12 }}>
        <span>{items.reduce((sum, line) => sum + line.quantity, 0)} unidade(s) · {items.length} item(ns)</span>
        <strong style={{ color: "#f2cc46" }}>Subtotal: {money(getSaleCartSubtotal(items))}</strong>
      </div>
    </section>
  );
}
