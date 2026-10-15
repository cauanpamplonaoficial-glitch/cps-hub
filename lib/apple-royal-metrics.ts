type Amount = number | string | null | undefined;

export type AppleRoyalSale = {
  id: string;
  status?: string | null;
  sale_price?: Amount;
  partner_amount_due?: Amount;
  additional_costs?: Amount;
  amount_received?: Amount;
  amount_remitted?: Amount;
};

export type AppleRoyalReceipt = {
  sale_id?: string | null;
  amount?: Amount;
  reference?: string | null;
};

export type AppleRoyalRemittance = {
  sale_id?: string | null;
  amount?: Amount;
  status?: string | null;
  proof_reference?: string | null;
};

const cents = (value: Amount): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

const fromCents = (value: number): number => value / 100;
const isInactiveSale = (status?: string | null) =>
  ["cancelled", "canceled", "returned", "refunded", "void"].includes(String(status ?? "").toLowerCase());

export const calculateAppleRoyalMetrics = <Sale extends AppleRoyalSale>(input: {
  sales: readonly Sale[];
  receipts: readonly AppleRoyalReceipt[];
  remittances: readonly AppleRoyalRemittance[];
}) => {
  const activeSales = input.sales.filter((sale) => !isInactiveSale(sale.status));
  const receiptCentsBySale = new Map<string, number>();
  const paidRemittanceCentsBySale = new Map<string, number>();

  for (const receipt of input.receipts) {
    if (!receipt.sale_id) continue;
    receiptCentsBySale.set(receipt.sale_id, (receiptCentsBySale.get(receipt.sale_id) ?? 0) + cents(receipt.amount));
  }
  for (const remittance of input.remittances) {
    if (!remittance.sale_id || remittance.status !== "paid") continue;
    paidRemittanceCentsBySale.set(remittance.sale_id, (paidRemittanceCentsBySale.get(remittance.sale_id) ?? 0) + cents(remittance.amount));
  }

  const saleIdsWithMissingReferences = new Set<string>();
  for (const receipt of input.receipts) {
    if (receipt.sale_id && !receipt.reference) saleIdsWithMissingReferences.add(receipt.sale_id);
  }
  for (const remittance of input.remittances) {
    if (remittance.sale_id && remittance.status === "paid" && !remittance.proof_reference) {
      saleIdsWithMissingReferences.add(remittance.sale_id);
    }
  }

  const receiptMismatches = activeSales.filter((sale) => cents(sale.amount_received) !== (receiptCentsBySale.get(sale.id) ?? 0));
  const remittanceMismatches = activeSales.filter((sale) => cents(sale.amount_remitted) !== (paidRemittanceCentsBySale.get(sale.id) ?? 0));
  const referencePendingIds = new Set(activeSales.filter((sale) => saleIdsWithMissingReferences.has(sale.id)).map((sale) => sale.id));

  const pendingSales = activeSales.filter((sale) =>
    (receiptCentsBySale.get(sale.id) ?? 0) < cents(sale.sale_price) ||
    (paidRemittanceCentsBySale.get(sale.id) ?? 0) < cents(sale.partner_amount_due) ||
    referencePendingIds.has(sale.id),
  );

  return {
    activeSales,
    receiptCentsBySale,
    paidRemittanceCentsBySale,
    receiptMismatches,
    remittanceMismatches,
    referencePendingIds,
    pendingSales,
    pendingPartnerAmount: fromCents(activeSales.reduce((sum, sale) =>
      sum + Math.max(0, cents(sale.partner_amount_due) - (paidRemittanceCentsBySale.get(sale.id) ?? 0)), 0)),
    receivedSalesAmount: fromCents(activeSales.reduce((sum, sale) => sum + (receiptCentsBySale.get(sale.id) ?? 0), 0)),
    receiptMismatchAmount: fromCents(receiptMismatches.reduce((sum, sale) =>
      sum + Math.abs(cents(sale.amount_received) - (receiptCentsBySale.get(sale.id) ?? 0)), 0)),
    remittanceMismatchAmount: fromCents(remittanceMismatches.reduce((sum, sale) =>
      sum + Math.abs(cents(sale.amount_remitted) - (paidRemittanceCentsBySale.get(sale.id) ?? 0)), 0)),
    estimatedOperationResult: fromCents(activeSales.reduce((sum, sale) =>
      sum + cents(sale.sale_price) - cents(sale.partner_amount_due) - cents(sale.additional_costs), 0)),
    totalSold: fromCents(activeSales.reduce((sum, sale) => sum + cents(sale.sale_price), 0)),
  };
};
