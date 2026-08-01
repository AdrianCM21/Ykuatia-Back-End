export type PaginationInput = {
  page?: number | string;
  limit?: number | string;
  desde?: number | string;
};

export type PaginationResult = {
  page: number;
  limit: number;
  skip: number;
};

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export const resolvePagination = (input: PaginationInput): PaginationResult => {
  const limitRaw = Number(input.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1), MAX_LIMIT);

  if (input.page != null) {
    const pageRaw = Number(input.page);
    const page = Math.max(Number.isFinite(pageRaw) ? pageRaw : 1, 1);
    return { page, limit, skip: (page - 1) * limit };
  }

  const desdeRaw = Number(input.desde ?? 0);
  const skip = Math.max(Number.isFinite(desdeRaw) ? desdeRaw : 0, 0);
  return { page: Math.floor(skip / limit) + 1, limit, skip };
};
