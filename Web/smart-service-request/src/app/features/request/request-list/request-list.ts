import {Component,DestroyRef,EventEmitter,OnInit,Output,inject,signal} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { RequestService } from '../../../core/services/request.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Request } from '../../../core/models/request.model';
import {ListFilters,REQUEST_PRIORITIES,REQUEST_STATUSES} from '../../../core/models/paged.model';
import { PagedListState } from '../../../core/utils/paged-list-state';
import { ListFilterBarComponent } from '../../../shared/components/list-filter-bar/list-filter-bar';
import { PagerComponent } from '../../../shared/components/pager/pager';
import { OpenAgeComponent } from '../../../shared/components/open-age/open-age';
import { ExportCsvButtonComponent } from '../../../shared/components/export-csv-button/export-csv-button';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [RouterLink, DatePipe, ListFilterBarComponent, PagerComponent, OpenAgeComponent, ExportCsvButtonComponent],
  templateUrl: './request-list.html',
  styleUrl: './request-list.css'
})
export class RequestListComponent implements OnInit {

  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  @Output() requestsChanged = new EventEmitter<void>();

  readonly statuses = REQUEST_STATUSES;
  readonly priorities = REQUEST_PRIORITIES;

  // Filter / sort / page values (default order is the same as before: newest first)
  readonly state = new PagedListState('CreatedDate', 'DESC');

  // Signals so the table re-renders as soon as data changes,
  // regardless of async timing (this app runs zoneless).
  requests = signal<Request[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  deletingId = signal<number | null>(null);

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
      .getRequestsPaged(this.state.toQuery())
      .subscribe({

        next: response => {

          this.isLoading.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to load requests.'
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
            error?.error?.message || 'Unable to load requests.'
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

  editRequest(request: Request): void {
    this.router.navigate(['/request/edit', request.requestId]);
  }

  async deleteRequest(request: Request): Promise<void> {

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete request',
      message: `Are you sure you want to delete request ${request.requestCode}?`,
      confirmText: 'Delete',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    this.deletingId.set(request.requestId);
    this.errorMessage.set('');

    this.requestService.deleteRequest(request.requestId).subscribe({

      next: response => {

        this.deletingId.set(null);

        if (!response.success) {
          this.errorMessage.set(
            response.message || 'Unable to delete request.'
          );
          return;
        }

        // Reload the current page (the API moves back if the page became empty)
        this.loadRequests();

        this.requestsChanged.emit();
      },

      error: error => {

        this.deletingId.set(null);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to delete request.'
        );
      }
    });
  }
}