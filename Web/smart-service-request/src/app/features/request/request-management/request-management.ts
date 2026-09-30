import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Request,
  AdvancedRequest
} from '../../../core/models/request.model';
import { RequestService } from '../../../core/services/request.service';
import { RequestActionPanelComponent } from '../request-action-panel/request-action-panel';

@Component({
  selector: 'app-request-management',
  standalone: true,
  imports: [DatePipe, RequestActionPanelComponent],
  templateUrl: './request-management.html',
  styleUrl: './request-management.css'
})
export class RequestManagementComponent implements OnInit {

  // Signals so the UI re-renders as soon as data changes,
  // regardless of async timing (this app runs zoneless).
  requests = signal<Request[]>([]);
  request = signal<AdvancedRequest | null>(null);

  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private requestService: RequestService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');

    if (requestId) {
      this.loadRequest(Number(requestId));
    } else {
      this.loadRequests();
    }
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.requestService.getAllRequests().subscribe({
      next: (response) => {
        this.requests.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load requests:', error);
        this.errorMessage.set('Failed to load requests.');
        this.loading.set(false);
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

  manageRequest(requestId: number): void {
    this.router.navigate(['/request-management', requestId]);
  }

  backToRequests(): void {
    this.router.navigate(['/request-management']);
  }
}