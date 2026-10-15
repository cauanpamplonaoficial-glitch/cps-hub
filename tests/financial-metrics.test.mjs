import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardMetrics, getNetSaleAmount, summarizeCustomerPurchases } from "../lib/dashboard-metrics.ts";
import { fetchAllPages } from "../lib/supabase-pagination.ts";
import { calculateAppleRoyalMetrics } from "../lib/apple-royal-metrics.ts";
import { addSaleCartLine, getSaleCartSubtotal } from "../lib/sale-cart.ts";

test("net sales use integer cents and never become negative", () => {
  assert.equal(getNetSaleAmount({ subtotal: 19.99, discount: 0.01 }), 19.98);
  assert.equal(getNetSaleAmount({ subtotal: "100.00", discount: "20.25" }), 79.75);
  assert.equal(getNetSaleAmount({ subtotal: 10, discount: 12 }), 0);
});

test("dashboard totals exclude cancelled and out-of-period sales", () => {
  const metrics = getDashboardMetrics({
    products: [],
    sales: [
      {
        id: "in-period",
        status: "confirmed",
        channel: "WhatsApp",
        subtotal: 19.99,
        discount: 0.01,
        fees: 0.3,
        shipping_cost: 1.5,
        sold_at: "2026-10-14",
        sale_items: [{ quantity: 1, unit_cost: 10 }],
      },
      { id: "cancelled", status: "returned", subtotal: 50, created_at: "2026-10-14" },
      { id: "outside-period", status: "confirmed", subtotal: 80, sold_at: "2026-09-30" },
    ],
    purchases: [],
    expenses: [],
    customers: [],
    monthStart: new Date(2026, 9, 1),
    periodStart: new Date(2026, 9, 1),
    periodEnd: new Date(2026, 9, 31, 23, 59, 59, 999),
  });

  assert.equal(metrics.monthlySales.length, 1);
  assert.equal(metrics.salesTotals.grossSales, 19.99);
  assert.equal(metrics.salesTotals.discounts, 0.01);
  assert.equal(metrics.salesTotals.netSales, 19.98);
  assert.equal(metrics.salesTotals.estimatedProfit, 8.18);
  assert.deepEqual(metrics.channelTotals.WhatsApp, {
    count: 1,
    netSales: 19.98,
    estimatedProfit: 8.18,
  });
  assert.equal(metrics.cancelledSalesToday.length, 0);
});

test("dashboard flags products with missing cost and low stock", () => {
  const metrics = getDashboardMetrics({
    products: [
      { id: "missing-cost", name: "Item sem custo", stock_quantity: 2, min_stock: 2, sale_price: 30 },
      { id: "healthy", name: "Item saudável", stock_quantity: 5, min_stock: 1, cost_price: 10, sale_price: 20 },
    ],
    sales: [],
    purchases: [],
    expenses: [],
    customers: [],
    monthStart: new Date(2026, 9, 1),
    periodStart: new Date(2026, 9, 1),
  });

  assert.deepEqual(metrics.lowStockProducts.map((product) => product.id), ["missing-cost"]);
  assert.deepEqual(metrics.missingCostProducts.map((product) => product.id), ["missing-cost"]);
  assert.equal(metrics.costBasisComplete, true);
});

test("financial totals exclude cancelled expenses and purchases", () => {
  const metrics = getDashboardMetrics({
    products: [
      { id: "known-cost", stock_quantity: 3, min_stock: 0, cost_price: 10.1, sale_price: 15.25 },
      { id: "missing-cost", stock_quantity: 1, min_stock: 0, cost_price: 0, sale_price: 12 },
    ],
    sales: [
      {
        id: "incomplete-cost",
        status: "confirmed",
        created_at: "2026-10-10",
        subtotal: 40,
        discount: 0,
        sale_items: [{ quantity: 1, unit_cost: 0 }],
      },
    ],
    purchases: [
      { id: "received", status: "received", total: "30.15", created_at: "2026-10-10" },
      { id: "cancelled-purchase", status: "cancelled", total: 99, created_at: "2026-10-11" },
    ],
    expenses: [
      { id: "paid-expense", status: "paid", amount: 3.11, due_date: "2026-10-10" },
      { id: "cancelled-expense", status: "cancelled", amount: 99, due_date: "2026-10-11" },
    ],
    customers: [],
    monthStart: new Date(2026, 9, 1),
    periodStart: new Date(2026, 9, 1),
    periodEnd: new Date(2026, 9, 31, 23, 59, 59, 999),
  });

  assert.equal(metrics.monthlyPurchaseTotal, 30.15);
  assert.equal(metrics.monthlyExpenseTotal, 3.11);
  assert.equal(metrics.inventoryCost, 30.3);
  assert.equal(metrics.potentialInventoryMargin, 15.45);
  assert.equal(metrics.costBasisComplete, false);
  assert.deepEqual(metrics.missingCostProducts.map((product) => product.id), ["missing-cost"]);
});

test("customer purchase history excludes cancelled sales and sums cents precisely", () => {
  const summaries = summarizeCustomerPurchases([
    { customer_id: "customer-1", subtotal: 0.1, discount: 0, status: "confirmed", sold_at: "2026-10-10" },
    { customer_id: "customer-1", subtotal: 0.2, discount: 0, status: "confirmed", sold_at: "2026-10-12" },
    { customer_id: "customer-1", subtotal: 50, discount: 0, status: "returned", sold_at: "2026-10-13" },
    { customer_id: "customer-2", subtotal: 20, discount: 25, status: "confirmed", created_at: "2026-10-11" },
    { customer_id: null, subtotal: 99, status: "confirmed" },
  ]);

  assert.deepEqual(summaries.get("customer-1"), { count: 2, total: 0.3, lastPurchase: "2026-10-12" });
  assert.deepEqual(summaries.get("customer-2"), { count: 1, total: 0, lastPurchase: "2026-10-11" });
  assert.equal(summaries.has("customer-3"), false);
});

test("pagination fetches every page in stable ranges and stops on a short page", async () => {
  const ranges = [];
  const rows = await fetchAllPages(async (from, to) => {
    ranges.push([from, to]);
    if (from === 0) return { data: [1, 2], error: null };
    return { data: [3], error: null };
  }, 2);

  assert.deepEqual(rows, { data: [1, 2, 3], error: null });
  assert.deepEqual(ranges, [[0, 1], [2, 3]]);
});

test("pagination preserves fetched rows and stops when a page fails", async () => {
  const rows = await fetchAllPages(async (from) => from === 0
    ? { data: ["first"], error: null }
    : { data: null, error: { message: "offline" } }, 1);

  assert.deepEqual(rows, { data: ["first"], error: { message: "offline" } });
});

test("Apple Royal reconciliation totals use cents and ignore inactive sales", () => {
  const metrics = calculateAppleRoyalMetrics({
    sales: [
      { id: "sale-1", status: "confirmed", sale_price: 0.3, partner_amount_due: 0.1, additional_costs: 0.05, amount_received: 0.1, amount_remitted: 0.1 },
      { id: "sale-2", status: "delivered", sale_price: 20, partner_amount_due: 12, additional_costs: 2, amount_received: 5, amount_remitted: 0 },
      { id: "cancelled", status: "cancelled", sale_price: 500, partner_amount_due: 400 },
    ],
    receipts: [
      { sale_id: "sale-1", amount: 0.1, reference: "PIX-1" },
      { sale_id: "sale-2", amount: 5, reference: null },
    ],
    remittances: [
      { sale_id: "sale-1", amount: 0.1, status: "paid", proof_reference: "COMPROVANTE-1" },
      { sale_id: "sale-2", amount: 4, status: "paid", proof_reference: null },
      { sale_id: "sale-2", amount: 2, status: "pending" },
    ],
  });

  assert.equal(metrics.totalSold, 20.3);
  assert.equal(metrics.receivedSalesAmount, 5.1);
  assert.equal(metrics.pendingPartnerAmount, 8);
  assert.equal(metrics.estimatedOperationResult, 6.15);
  assert.equal(metrics.receiptMismatchAmount, 0);
  assert.equal(metrics.remittanceMismatchAmount, 4);
  assert.deepEqual(metrics.referencePendingIds, new Set(["sale-2"]));
  assert.deepEqual(metrics.pendingSales.map((sale) => sale.id), ["sale-1", "sale-2"]);
});

test("sale cart adds multiple products and totals in integer cents", () => {
  const products = [
    { id: "keyboard", name: "Teclado", stock_quantity: 5, sale_price: 100 },
    { id: "mouse", name: "Mouse", stock_quantity: 2, sale_price: 0.1 },
  ];
  const first = addSaleCartLine([], { product_id: "keyboard", quantity: 2, unit_price: 89.9 }, products);
  assert.equal(first.error, null);
  const second = addSaleCartLine(first.items, { product_id: "mouse", quantity: 2, unit_price: 0.1 }, products);
  assert.equal(second.error, null);
  assert.equal(getSaleCartSubtotal(second.items), 180);
  assert.equal(second.items.length, 2);
});

test("sale cart prevents combined quantities above available stock", () => {
  const products = [{ id: "headset", name: "Headset", stock_quantity: 3, sale_price: 50 }];
  const first = addSaleCartLine([], { product_id: "headset", quantity: 2, unit_price: 50 }, products);
  const rejected = addSaleCartLine(first.items, { product_id: "headset", quantity: 2, unit_price: 49 }, products);

  assert.match(rejected.error || "", /Estoque insuficiente/);
  assert.equal(rejected.items.length, 1);
  assert.equal(rejected.items[0].quantity, 2);
});

test("sale cart does not convert an empty unit price into a free item", () => {
  const products = [{ id: "case", name: "Capa", stock_quantity: 2, sale_price: 25 }];
  const result = addSaleCartLine([], { product_id: "case", quantity: 1, unit_price: "" }, products);

  assert.match(result.error || "", /preço unitário válido/);
  assert.deepEqual(result.items, []);
});
