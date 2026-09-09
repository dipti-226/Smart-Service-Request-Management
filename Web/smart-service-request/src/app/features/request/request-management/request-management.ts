import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  requests: Request[] = [];
  request: AdvancedRequest | null = null;

  loading = false;
  errorMessage = '';

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
    this.loading = true;
    this.errorMessage = '';

    this.requestService.getAllRequests().subscribe({
      next: (response) => {
        this.requests = response.data ?? [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load requests:', error);
        this.errorMessage = 'Failed to load requests.';
        this.loading = false;
      }
    });
  }

  private loadRequest(requestId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.requestService.getAdvancedRequestById(requestId).subscribe({
      next: (response) => {
        this.request = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load request:', error);
        this.errorMessage = 'Failed to load request.';
        this.loading = false;
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