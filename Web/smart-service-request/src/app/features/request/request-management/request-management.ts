import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {Request,AdvancedRequest} from '../../../core/models/request.model';
import {ListFilters,REQUEST_PRIORITIES,REQUEST_STATUSES} from '../../../core/models/paged.model';
import { RequestService } from '../../../core/services/request.service';
import { PagedListState } from '../../../core/utils/paged-list-state';
import { RequestActionPanelComponent } from '../request-action-panel/request-action-panel';
import { ListFilterBarComponent } from '../../../shared/components/list-filter-bar/list-filter-bar';
import { PagerComponent } from '../../../shared/components/pager/pager';
import { RequestCommentsComponent } from '../../../shared/components/request-comments/request-comments';
import { RequestTimelineComponent } from '../../../shared/components/request-timeline/request-timeline';

@Component({
  selector: 'app-request-management',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    RequestActionPanelComponent,
    ListFilterBarComponent,
    PagerComponent,
    RequestTimelineComponent,
    RequestCommentsComponent
  ],
  templateUrl: './request-management.html',
  styleUrl: './request-management.css'
})
export class RequestManagementComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = REQUEST_STATUSES;
  readonly priorities = REQUEST_PRIORITIES;
  readonly state = new PagedListState('CreatedDate', 'DESC');

  requests = signal<Request[]>([]);
  request = signal<AdvancedRequest | null>(null);

  // loading / errorMessage = single request page (unchanged)
  loading = signal(false);
  errorMessage = signal('');

  // listLoading / listError = the list page
  listLoading = signal(false);
  listError = signal('');

  private listSubscription?: Subscription;

  constructor(
    private requestService: RequestService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.listSubscription?.unsubscribe());

    const requestId = this.route.snapshot.paramMap.get('id');

    if (requestId) {
      this.loadRequest(Number(requestId));
    } else {
      this.loadRequests();
    }
  }

  private loadRequests(): void {
    this.listSubscription?.unsubscribe();

    this.listLoading.set(true);
    this.listError.set('');

    this.listSubscription = this.requestService
      .getRequestsPaged(this.state.toQuery())
      .subscribe({
        next: (response) => {
          this.listLoading.set(false);

          if (!response.success || !response.data) {
            this.listError.set(response.message || 'Failed to load requests.');
            return;
          }

          this.requests.set(response.data.items);
          this.state.applyResult(response.data);
        },
        error: (error) => {
          console.error('Failed to load requests:', error);
          this.listError.set('Failed to load requests.');
          this.listLoading.set(false);
        }
      });
  }

  private loadRequest(requestId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.requestService.getAdvancedRequestById(requestId).subscribe({
      next: (response) => {
        this.request.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load request:', error);
        this.errorMessage.set('Failed to load request.');
        this.loading.set(false);
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

  manageRequest(requestId: number): void {
    this.router.navigate(['/request-management', requestId]);
  }

  backToRequests(): void {
    this.router.navigate(['/request-management']);
  }
}