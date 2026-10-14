export type DashboardSale = {
  id: string;
  status?: string | null;
  channel?: string | null;
  subtotal?: number | string | null;
  discount?: number | string | null;
  fees?: number | string | null;
  shipping_cost?: number | string | null;
  sold_at?: string | null;
  created_at?: string | null;
  sale_items?: Array<{ quantity?: number | string | null; unit_cost?: number | string | null }> | null;
};

export type DashboardPurchase = {
  id: string;
  status?: string | null;
  total?: number | string | null;
  ordered_at?: string | null;
  created_at?: string | null;
};

export type DashboardExpense = {
  id: string;
  status?: string | null;
  amount?: number | string | null;
  due_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export type DashboardProduct = {
  id: string;
  name?: string | null;
  stock_quantity?: number | string | null;
  min_stock?: number | string | null;
  cost_price?: number | string | null;
  sale_price?: number | string | null;
};

const amount = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isCancelled = (status?: string | null) =>
  ["cancelled", "canceled", "refunded", "returned", "void"].includes(
    String(status ?? "").trim().toLowerCase(),
  );

export const isInMonth = (
  value: string | null | undefined,
  fallback: string | null | undefined,
  monthStart: Date,
): boolean => {
  const date = new Date(value || fallback || "");
  return !Number.isNaN(date.getTime()) && date >= monthStart;
};

export const getDashboardMetrics = (data: {
  products: DashboardProduct[];
  sales: DashboardSale[];
  purchases: DashboardPurchase[];
  expenses: DashboardExpense[];
  customers: Array<{ id: string }>;
  monthStart?: Date;
}) => {
  const monthStart = data.monthStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sales = data.sales.filter((sale) => !isCancelled(sale.status));
  const purchases = data.purchases.filter((purchase) => !isCancelled(purchase.status));
  const expenses = data.expenses.filter((expense) => !isCancelled(expense.status));
  const monthlySales = sales.filter((sale) => isInMonth(sale.sold_at, sale.created_at, monthStart));
  const monthlyPurchases = purchases.filter((purchase) => isInMonth(purchase.ordered_at, purchase.created_at, monthStart));
  const monthlyExpenses = expenses.filter((expense) => isInMonth(expense.due_date, expense.created_at, monthStart));

  const calculateSaleTotals = (saleRows: DashboardSale[]) =>
    saleRows.reduce(
      (totals, sale) => {
        const subtotal = amount(sale.subtotal);
        const discount = amount(sale.discount);
        const fees = amount(sale.fees);
        const shipping = amount(sale.shipping_cost);
        const costOfGoods = (sale.sale_items ?? []).reduce(
          (sum, item) => sum + amount(item.quantity) * amount(item.unit_cost),
          0,
        );

        totals.grossSales += subtotal;
        totals.discounts += discount;
        totals.netSales += Math.max(0, subtotal - discount);
        totals.fees += fees;
        totals.shipping += shipping;
        totals.costOfGoods += costOfGoods;
        totals.estimatedProfit += subtotal - discount - fees - shipping - costOfGoods;
        return totals;
      },
      { grossSales: 0, discounts: 0, netSales: 0, fees: 0, shipping: 0, costOfGoods: 0, estimatedProfit: 0 },
    );

  const salesTotals = calculateSaleTotals(monthlySales);
  const inventoryCost = data.products.reduce(
    (sum, product) => sum + amount(product.stock_quantity) * amount(product.cost_price),
    0,
  );
  const potentialInventoryMargin = data.products.reduce(
    (sum, product) => sum + amount(product.stock_quantity) * (amount(product.sale_price) - amount(product.cost_price)),
    0,
  );
  const lowStockProducts = data.products.filter(
    (product) => amount(product.stock_quantity) <= amount(product.min_stock),
  );

  const channelTotals = monthlySales.reduce<Record<string, { count: number; netSales: number; estimatedProfit: number }>>(
    (result, sale) => {
      const channel = String(sale.channel || "Manual");
      const totals = result[channel] ?? { count: 0, netSales: 0, estimatedProfit: 0 };
      const saleTotals = calculateSaleTotals([sale]);
      totals.count += 1;
      totals.netSales += saleTotals.netSales;
      totals.estimatedProfit += saleTotals.estimatedProfit;
      result[channel] = totals;
      return result;
    },
    {},
  );

  return {
    sales,
    purchases,
    expenses,
    monthlySales,
    monthlyPurchases,
    monthlyExpenses,
    salesTotals,
    inventoryCost,
    potentialInventoryMargin,
    lowStockProducts,
    channelTotals,
    monthlyExpenseTotal: monthlyExpenses.reduce((sum, expense) => sum + amount(expense.amount), 0),
    monthlyPurchaseTotal: monthlyPurchases.reduce((sum, purchase) => sum + amount(purchase.total), 0),
    costBasisComplete: monthlySales.every((sale) => Boolean(sale.sale_items?.length) && sale.sale_items!.every((item) => amount(item.unit_cost) > 0)),
    customersCount: data.customers.length,
  };
};
