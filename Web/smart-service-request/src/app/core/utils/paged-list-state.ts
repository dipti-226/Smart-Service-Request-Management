import { WritableSignal, computed, signal } from '@angular/core';

import {
  ListFilters,
  ListQuery,
  PagedResult,
  SortDirection
} from '../models/paged.model';

export class PagedListState {

  readonly search = signal('');
  readonly status = signal('');
  readonly priority = signal('');

  readonly sortBy: WritableSignal<string>;
  readonly sortDir: WritableSignal<SortDirection>;

  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);

  readonly totalCount = signal(0);
  readonly totalPages = signal(0);

  readonly hasFilters = computed(
    () => !!this.search() || !!this.status() || !!this.priority()
  );

  constructor(
    defaultSortBy = 'CreatedDate',
    defaultSortDir: SortDirection = 'DESC'
  ) {
    this.sortBy = signal(defaultSortBy);
    this.sortDir = signal<SortDirection>(defaultSortDir);
  }

  toQuery(): ListQuery {
    return {
      search: this.search(),
      status: this.status(),
      priority: this.priority(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    };
  }

  // A new filter always starts again from page 1
  applyFilters(filters: ListFilters): void {
    this.search.set(filters.search);
    this.status.set(filters.status);
    this.priority.set(filters.priority);
    this.pageNumber.set(1);
  }

  toggleSort(column: string): void {
    if (this.sortBy() === column) {
      this.sortDir.set(this.sortDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortBy.set(column);
      this.sortDir.set('ASC');
    }

    this.pageNumber.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1) {
      this.pageNumber.set(page);
    }
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(1);
  }

  // Take the real values back from the API (it may move to the last page)
  applyResult(result: PagedResult<unknown>): void {
    this.totalCount.set(result.totalCount);
    this.totalPages.set(result.totalPages);
    this.pageNumber.set(result.pageNumber);
    this.pageSize.set(result.pageSize);
  }

  // Serial number of the first row on this page (Sr. No. continues across pages)
  startIndex(): number {
    return (this.pageNumber() - 1) * this.pageSize();
  }

  sortIcon(column: string): string {
    if (this.sortBy() !== column) {
      return '';
    }

    return this.sortDir() === 'ASC' ? '▲' : '▼';
  }

  ariaSort(column: string): 'ascending' | 'descending' | 'none' {
    if (this.sortBy() !== column) {
      return 'none';
    }

    return this.sortDir() === 'ASC' ? 'ascending' : 'descending';
  }
}