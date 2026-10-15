export type DashboardSale = {
  id: string;
  total?: number | string | null;
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

export type CustomerHistorySale = {
  customer_id?: string | null;
  subtotal?: number | string | null;
  discount?: number | string | null;
  status?: string | null;
  sold_at?: string | null;
  created_at?: string | null;
};

export type CustomerPurchaseSummary = {
  count: number;
  total: number;
  lastPurchase: string | null;
};

const amount = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Keep currency arithmetic in integer cents; convert back only for the UI/API.
const cents = (value: unknown): number => Math.round(amount(value) * 100);
const fromCents = (value: number): number => value / 100;

const netSaleCents = (sale: Pick<DashboardSale, "subtotal" | "discount">): number =>
  Math.max(0, cents(sale.subtotal) - cents(sale.discount));

export const getNetSaleAmount = (sale: Pick<DashboardSale, "subtotal" | "discount">): number =>
  fromCents(netSaleCents(sale));

const isCancelled = (status?: string | null) =>
  ["cancelled", "canceled", "refunded", "returned", "void"].includes(
    String(status ?? "").trim().toLowerCase(),
  );

export const summarizeCustomerPurchases = (
  sales: readonly CustomerHistorySale[],
): Map<string, CustomerPurchaseSummary> => {
  const totals = new Map<string, { count: number; totalCents: number; lastPurchase: string | null }>();

  for (const sale of sales) {
    if (isCancelled(sale.status) || !sale.customer_id) continue;

    const current = totals.get(sale.customer_id) ?? { count: 0, totalCents: 0, lastPurchase: null };
    const saleDate = sale.sold_at || sale.created_at || null;
    const saleDateTime = saleDate ? new Date(saleDate).getTime() : Number.NaN;
    const lastDateTime = current.lastPurchase ? new Date(current.lastPurchase).getTime() : Number.NaN;

    current.count += 1;
    current.totalCents += Math.max(0, cents(sale.subtotal) - cents(sale.discount));
    if (saleDate && !Number.isNaN(saleDateTime) && (Number.isNaN(lastDateTime) || saleDateTime > lastDateTime)) {
      current.lastPurchase = saleDate;
    }
    totals.set(sale.customer_id, current);
  }

  return new Map([...totals].map(([customerId, summary]) => [customerId, {
    count: summary.count,
    total: fromCents(summary.totalCents),
    lastPurchase: summary.lastPurchase,
  }]));
};

export const isInMonth = (
  value: string | null | undefined,
  fallback: string | null | undefined,
  monthStart: Date,
): boolean => {
  const dateValue = value || fallback || "";
  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const date = calendarDate
    ? new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3]))
    : new Date(dateValue);
  return !Number.isNaN(date.getTime()) && date >= monthStart;
};

export const getDashboardMetrics = (data: {
  products: DashboardProduct[];
  sales: DashboardSale[];
  purchases: DashboardPurchase[];
  expenses: DashboardExpense[];
  customers: Array<{ id: string }>;
  monthStart?: Date;
  periodStart?: Date;
  periodEnd?: Date;
}) => {
  const monthStart = data.monthStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const periodStart = data.periodStart ?? monthStart;
  const periodEnd = data.periodEnd;
  const sales = data.sales.filter((sale) => !isCancelled(sale.status));
  const purchases = data.purchases.filter((purchase) => !isCancelled(purchase.status));
  const expenses = data.expenses.filter((expense) => !isCancelled(expense.status));
  const isInPeriod = (value: string | null | undefined, fallback: string | null | undefined) => {
    const valueToCheck = value || fallback;
    if (!isInMonth(valueToCheck, null, periodStart)) return false;
    if (!periodEnd || !valueToCheck) return true;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(valueToCheck)
      ? new Date(`${valueToCheck}T23:59:59.999`)
      : new Date(valueToCheck);
    return !Number.isNaN(parsed.getTime()) && parsed <= periodEnd;
  };
  const monthlySales = sales.filter((sale) => isInPeriod(sale.sold_at, sale.created_at));
  const monthlyPurchases = purchases.filter((purchase) => isInPeriod(purchase.ordered_at, purchase.created_at));
  const monthlyExpenses = expenses.filter((expense) => isInPeriod(expense.due_date, expense.created_at));

  const calculateSaleTotals = (saleRows: DashboardSale[]) =>
    (() => {
      const totals = saleRows.reduce(
        (result, sale) => {
          const subtotal = cents(sale.subtotal);
          const discount = cents(sale.discount);
          const fees = cents(sale.fees);
          const shipping = cents(sale.shipping_cost);
          const costOfGoods = (sale.sale_items ?? []).reduce(
            (sum, item) => sum + Math.round(amount(item.quantity) * cents(item.unit_cost)),
            0,
          );
          const netSales = netSaleCents(sale);

          result.grossSales += subtotal;
          result.discounts += discount;
          result.netSales += netSales;
          result.fees += fees;
          result.shipping += shipping;
          result.costOfGoods += costOfGoods;
          result.estimatedProfit += netSales - fees - shipping - costOfGoods;
          return result;
        },
        { grossSales: 0, discounts: 0, netSales: 0, fees: 0, shipping: 0, costOfGoods: 0, estimatedProfit: 0 },
      );

      return Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [key, fromCents(value)]),
      ) as typeof totals;
    })();

  const today = new Date();
  const isToday = (value: string | null | undefined) => {
    if (!value) return false;
    const calendarDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = calendarDate
      ? new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3]))
      : new Date(value);
    return !Number.isNaN(date.getTime()) &&
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };
  const todaySales = sales.filter((sale) => isToday(sale.sold_at || sale.created_at));
  const todaySalesTotals = calculateSaleTotals(todaySales);
  const todayPaidExpenses = expenses
    .filter((expense) => String(expense.status || "").toLowerCase() === "paid" && isToday(expense.paid_at))
    .reduce((sum, expense) => sum + cents(expense.amount), 0);
  const todayPendingExpenses = expenses
    .filter((expense) => !["paid", "cancelled", "canceled"].includes(String(expense.status || "").toLowerCase()) && isToday(expense.due_date))
    .reduce((sum, expense) => sum + cents(expense.amount), 0);
  const cancelledSales = data.sales.filter((sale) => isCancelled(sale.status));
  const cancelledSalesToday = cancelledSales.filter((sale) => isToday(sale.sold_at || sale.created_at));
  const cancelledSalesTodayTotal = fromCents(cancelledSalesToday.reduce((sum, sale) => sum + cents(sale.subtotal), 0));
  const missingCostProducts = data.products.filter((product) => amount(product.stock_quantity) > 0 && amount(product.cost_price) <= 0);

  const salesTotals = calculateSaleTotals(monthlySales);
  const inventoryCost = data.products.reduce(
    (sum, product) => sum + Math.round(amount(product.stock_quantity) * cents(product.cost_price)),
    0,
  );
  const potentialInventoryMargin = data.products.reduce(
    (sum, product) => amount(product.cost_price) > 0
      ? sum + Math.round(amount(product.stock_quantity) * (cents(product.sale_price) - cents(product.cost_price)))
      : sum,
    0,
  );
  const lowStockProducts = data.products.filter(
    (product) => amount(product.stock_quantity) <= amount(product.min_stock),
  );

  const channelTotalsInCents = monthlySales.reduce<Record<string, { count: number; netSales: number; estimatedProfit: number }>>(
    (result, sale) => {
      const channel = String(sale.channel || "Manual");
      const totals = result[channel] ?? { count: 0, netSales: 0, estimatedProfit: 0 };
      const saleTotals = calculateSaleTotals([sale]);
      totals.count += 1;
      totals.netSales += cents(saleTotals.netSales);
      totals.estimatedProfit += cents(saleTotals.estimatedProfit);
      result[channel] = totals;
      return result;
    },
    {},
  );
  const channelTotals = Object.fromEntries(Object.entries(channelTotalsInCents).map(([channel, totals]) => [channel, {
    count: totals.count,
    netSales: fromCents(totals.netSales),
    estimatedProfit: fromCents(totals.estimatedProfit),
  }]));

  return {
    sales,
    purchases,
    expenses,
    monthlySales,
    monthlyPurchases,
    monthlyExpenses,
    salesTotals,
    todaySalesTotals,
    todayPaidExpenses: fromCents(todayPaidExpenses),
    todayPendingExpenses: fromCents(todayPendingExpenses),
    cancelledSalesToday,
    cancelledSalesTodayTotal,
    missingCostProducts,
    inventoryCost: fromCents(inventoryCost),
    potentialInventoryMargin: fromCents(potentialInventoryMargin),
    lowStockProducts,
    channelTotals,
    monthlyExpenseTotal: fromCents(monthlyExpenses.reduce((sum, expense) => sum + cents(expense.amount), 0)),
    monthlyPurchaseTotal: fromCents(monthlyPurchases.reduce((sum, purchase) => sum + cents(purchase.total), 0)),
    costBasisComplete: monthlySales.every((sale) => Boolean(sale.sale_items?.length) && sale.sale_items!.every((item) => amount(item.unit_cost) > 0)),
    customersCount: data.customers.length,
  };
};
