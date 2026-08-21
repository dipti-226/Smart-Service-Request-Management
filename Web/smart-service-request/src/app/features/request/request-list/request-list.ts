import { Component, inject, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';
import { Request } from '../../../core/models/request.model';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './request-list.html',
  styleUrl: './request-list.css'
})
export class RequestListComponent implements OnInit {

  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);

  @Output() requestsChanged = new EventEmitter<void>();

  // Signals so the table re-renders as soon as data changes,
  // regardless of async timing (this app runs zoneless).
  requests = signal<Request[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getAllRequests().subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success) {
          this.errorMessage.set(
            response.message || 'Unable to load requests.'
          );
          return;
        }

        this.requests.set(response.data ?? []);
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

  editRequest(request: Request): void {
    this.router.navigate(['/request/edit', request.requestId]);
  }

  deleteRequest(request: Request): void {

    const confirmed = confirm(
      `Are you sure you want to delete request ${request.requestCode}?`
    );

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

        this.requests.update(
          current => current.filter(r => r.requestId !== request.requestId)
        );

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
