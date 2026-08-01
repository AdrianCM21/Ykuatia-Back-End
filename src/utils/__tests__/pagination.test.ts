import { resolvePagination } from '../pagination';

describe('resolvePagination', () => {
  it('usa page/limit por defecto', () => {
    expect(resolvePagination({})).toEqual({ page: 1, limit: 30, skip: 0 });
  });

  it('calcula skip desde page', () => {
    expect(resolvePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('soporta modo desde (offset)', () => {
    expect(resolvePagination({ desde: 40, limit: 20 })).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('acota limit máximo a 100', () => {
    expect(resolvePagination({ page: 1, limit: 500 }).limit).toBe(100);
  });

  it('normaliza page inválida a 1', () => {
    expect(resolvePagination({ page: -2, limit: 10 }).page).toBe(1);
  });
});
