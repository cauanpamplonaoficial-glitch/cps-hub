export type SaleCartProduct = {
  id: string;
  name: string;
  stock_quantity: number | string | null;
  sale_price: number | string | null;
};

export type SaleCartLine = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type SaleCartCandidate = {
  product_id: string;
  quantity: number;
  unit_price: number | string;
};

export type SaleCartUpdate =
  | { items: SaleCartLine[]; error: null }
  | { items: SaleCartLine[]; error: string };

const toCents = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const addSaleCartLine = (
  items: readonly SaleCartLine[],
  candidate: SaleCartCandidate,
  products: readonly SaleCartProduct[],
): SaleCartUpdate => {
  const product = products.find((row) => row.id === candidate.product_id);
  if (!product) return { items: [...items], error: "Selecione um produto válido." };

  if (!Number.isInteger(candidate.quantity) || candidate.quantity < 1) {
    return { items: [...items], error: "A quantidade precisa ser um número inteiro maior que zero." };
  }

  if ((typeof candidate.unit_price === "string" && candidate.unit_price.trim() === "") ||
    !Number.isFinite(Number(candidate.unit_price)) || Number(candidate.unit_price) < 0) {
    return { items: [...items], error: "Informe um preço unitário válido e não negativo." };
  }

  const stock = Math.max(0, Math.trunc(Number(product.stock_quantity) || 0));
  const quantityInCart = items
    .filter((line) => line.product_id === product.id)
    .reduce((sum, line) => sum + line.quantity, 0);
  if (quantityInCart + candidate.quantity > stock) {
    return {
      items: [...items],
      error: `Estoque insuficiente para ${product.name}. Disponível: ${Math.max(0, stock - quantityInCart)} unidade(s).`,
    };
  }

  const unitPriceCents = toCents(Number(candidate.unit_price));
  const line: SaleCartLine = {
    id: globalThis.crypto.randomUUID(),
    product_id: product.id,
    quantity: candidate.quantity,
    unit_price: unitPriceCents / 100,
  };
  return { items: [...items, line], error: null };
};

export const getSaleCartSubtotal = (items: readonly SaleCartLine[]): number =>
  items.reduce((sum, line) => sum + line.quantity * toCents(line.unit_price), 0) / 100;
