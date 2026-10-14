export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export type SortDirection = 'ASC' | 'DESC';

export interface ListFilters {
  search: string;
  status: string;
  priority: string;
}

export interface ListQuery extends ListFilters {
  sortBy: string;
  sortDir: SortDirection;
  pageNumber: number;
  pageSize: number;
}

export const REQUEST_STATUSES: string[] = [
  'Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Cancelled'
];

export const REQUEST_PRIORITIES: string[] = ['Low', 'Medium', 'High', 'Critical'];

export const PAGE_SIZE_OPTIONS: number[] = [10, 25, 50];