/**
 * Shared response shape for every paginated list endpoint (`GET /movies`,
 * the 5 movie nested-relation routes, `GET /favorites`) so they all read
 * the same way regardless of which service produces them.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
