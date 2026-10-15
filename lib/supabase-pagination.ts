export type PageResult<Row> = {
  data: Row[] | null;
  error: { message: string } | null;
};

export const fetchAllPages = async <Row>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<Row>>,
  pageSize = 1000,
): Promise<{ data: Row[]; error: { message: string } | null }> => {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize precisa ser um inteiro positivo.");
  }

  const data: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await loadPage(from, from + pageSize - 1);
    if (page.error) return { data, error: page.error };

    const pageData = page.data ?? [];
    data.push(...pageData);
    if (pageData.length < pageSize) return { data, error: null };
  }
};
