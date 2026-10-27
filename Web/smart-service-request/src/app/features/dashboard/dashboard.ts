import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RequestService } from '../../core/services/request.service';
import { Request } from '../../core/models/request.model';
import { REQUEST_STATUSES } from '../../core/models/paged.model';
import { RequestListComponent } from '../request/request-list/request-list';
import { OpenAgeComponent } from '../../shared/components/open-age/open-age';

// How many requests the "Recent requests" panel shows
const RECENT_COUNT = 5;

// Chart colours (same as the dashboard cards and status badges)
const STATUS_COLORS: Record<string, string> = {
  'Open': '#f59e0b',
  'In Progress': '#7c3aed',
  'On Hold': '#f97316',
  'Resolved': '#16a34a',
  'Closed': '#0f766e',
  'Cancelled': '#dc2626'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, RequestListComponent, OpenAgeComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  private readonly requestService = inject(RequestService);

  // Signals so the UI re-renders as soon as data changes,
  // regardless of async timing (this app runs zoneless).
  totalRequests = signal(0);
  openRequests = signal(0);
  inProgressRequests = signal(0);
  onHoldRequests = signal(0);
  resolvedRequests = signal(0);
  closedRequests = signal(0);
  cancelledRequests = signal(0);

  isLoading = signal(false);
  errorMessage = signal('');

  // Latest requests (the same list API the table uses, newest first)
  recentRequests = signal<Request[]>([]);
  recentLoading = signal(false);
  recentError = signal('');

  // One slice of the donut chart: size comes from the counts already loaded above
  readonly segments = computed(() => {

    const counts: Record<string, number> = {
      'Open': this.openRequests(),
      'In Progress': this.inProgressRequests(),
      'On Hold': this.onHoldRequests(),
      'Resolved': this.resolvedRequests(),
      'Closed': this.closedRequests(),
      'Cancelled': this.cancelledRequests()
    };

    const total = REQUEST_STATUSES.reduce((sum, status) => sum + counts[status], 0);

    return REQUEST_STATUSES.map(status => ({
      status,
      count: counts[status],
      percent: total > 0 ? (counts[status] / total) * 100 : 0
    }));
  });

  readonly hasRequests = computed(() =>
    this.segments().some(segment => segment.count > 0)
  );

  // The donut is a plain CSS conic-gradient built from the slices (starts at 12 o'clock)
  readonly donutGradient = computed(() => {

    let start = 0;
    const stops: string[] = [];

    for (const segment of this.segments()) {

      if (segment.count === 0) {
        continue;
      }

      const end = start + segment.percent;
      stops.push(`${STATUS_COLORS[segment.status]} ${start}% ${end}%`);
      start = end;
    }

    return stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '';
  });

  // Text for screen readers, because the chart itself is only drawn with CSS
  readonly barDescription = computed(() =>
    this.segments().map(segment => `${segment.status} ${segment.count}`).join(', ')
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.loadRecent();

    this.requestService.getDashboard().subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success) {
          this.errorMessage.set(
            response.message || 'Unable to load dashboard.'
          );
          return;
        }

        this.totalRequests.set(response.data?.totalRequests ?? 0);
        this.openRequests.set(response.data?.openRequests ?? 0);
        this.inProgressRequests.set(response.data?.inProgressRequests ?? 0);
        this.onHoldRequests.set(response.data?.onHoldRequests ?? 0);
        this.resolvedRequests.set(response.data?.resolvedRequests ?? 0);
        this.closedRequests.set(response.data?.closedRequests ?? 0);
        this.cancelledRequests.set(response.data?.cancelledRequests ?? 0);
      },

      error: error => {

        this.isLoading.set(false);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to load dashboard.'
        );
      }

    });
  }

  private loadRecent(): void {

    this.recentLoading.set(true);
    this.recentError.set('');

    this.requestService.getRequestsPaged({
      search: '',
      status: '',
      priority: '',
      sortBy: 'CreatedDate',
      sortDir: 'DESC',
      pageNumber: 1,
      pageSize: RECENT_COUNT
    }).subscribe({

      next: response => {

        this.recentLoading.set(false);

        if (!response.success || !response.data) {
          this.recentError.set(response.message || 'Unable to load recent requests.');
          return;
        }

        this.recentRequests.set(response.data.items);
      },

      error: error => {

        this.recentLoading.set(false);

        console.error(error);

        this.recentError.set(
          error?.error?.message || 'Unable to load recent requests.'
        );
      }
    });
  }
}