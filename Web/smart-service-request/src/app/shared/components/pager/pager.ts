import { Component, computed, input, output } from '@angular/core';

import { PAGE_SIZE_OPTIONS } from '../../../core/models/paged.model';

@Component({
  selector: 'app-pager',
  standalone: true,
  templateUrl: './pager.html',
  styleUrl: './pager.css'
})
export class PagerComponent {

  pageNumber = input.required<number>();
  pageSize = input.required<number>();
  totalCount = input.required<number>();
  totalPages = input.required<number>();
  pageSizeOptions = input<number[]>(PAGE_SIZE_OPTIONS);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  from = computed(() =>
    this.totalCount() === 0 ? 0 : (this.pageNumber() - 1) * this.pageSize() + 1
  );

  to = computed(() =>
    Math.min(this.pageNumber() * this.pageSize(), this.totalCount())
  );

  // Up to 5 page numbers around the current page
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.pageNumber();

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);

    const list: number[] = [];
    for (let p = start; p <= end; p++) {
      list.push(p);
    }

    return list;
  });
}