import { Component, inject, OnInit } from '@angular/core';

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

  totalRequests = 0;

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.requestService.getDashboard().subscribe({

      next: response => {

        this.isLoading = false;

        if (!response.success) {
          this.errorMessage =
            response.message || 'Unable to load dashboard.';
          return;
        }

        this.totalRequests =
          response.data?.totalRequests ?? 0;
      },

      error: error => {

        this.isLoading = false;

        console.error(error);

        this.errorMessage =
          'Unable to load dashboard.';
      }

    });
  }
}