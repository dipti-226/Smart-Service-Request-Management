import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { RequestService } from '../../../core/services/request.service';
import { Request } from '../../../core/models/request.model';
import {
  ListFilters,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES
} from '../../../core/models/paged.model';
import { PagedListState } from '../../../core/utils/paged-list-state';
import { ListFilterBarComponent } from '../../../shared/components/list-filter-bar/list-filter-bar';
import { PagerComponent } from '../../../shared/components/pager/pager';

@Component({
  selector: 'app-assigned-requests',
  standalone: true,
  imports: [RouterLink, DatePipe, ListFilterBarComponent, PagerComponent],
  templateUrl: './assigned-requests.html',
  styleUrl: './assigned-requests.css'
})
export class AssignedRequestsComponent implements OnInit {

  private readonly requestService = inject(RequestService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = REQUEST_STATUSES;
  readonly priorities = REQUEST_PRIORITIES;
  readonly state = new PagedListState('CreatedDate', 'DESC');

  requests = signal<Request[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  private loadSubscription?: Subscription;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.loadSubscription?.unsubscribe());
    this.loadRequests();
  }

  loadRequests(): void {

    // Cancel the previous call, so an old slow response cannot overwrite a newer one
    this.loadSubscription?.unsubscribe();

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.loadSubscription = this.requestService
      .getAssignedRequestsPaged(this.state.toQuery())
      .subscribe({

        next: response => {

          this.isLoading.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to load your assigned requests.'
            );
            return;
          }

          this.requests.set(response.data.items);
          this.state.applyResult(response.data);
        },

        error: error => {

          this.isLoading.set(false);

          console.error(error);

          this.errorMessage.set(
            error?.error?.message || 'Unable to load your assigned requests.'
          );
        }
      });
  }

  onFiltersChanged(filters: ListFilters): void {
    this.state.applyFilters(filters);
    this.loadRequests();
  }

  onSort(column: string): void {
    this.state.toggleSort(column);
    this.loadRequests();
  }

  onPageChange(page: number): void {
    this.state.goToPage(page);
    this.loadRequests();
  }

  onPageSizeChange(size: number): void {
    this.state.setPageSize(size);
    this.loadRequests();
  }
}