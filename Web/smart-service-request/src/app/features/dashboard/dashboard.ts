import { Component, inject, OnInit, signal } from '@angular/core';

import { RequestService } from '../../core/services/request.service';
import { RequestListComponent } from '../request/request-list/request-list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RequestListComponent],
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
  resolvedRequests = signal(0);

  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

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
        this.resolvedRequests.set(response.data?.resolvedRequests ?? 0);
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
}
