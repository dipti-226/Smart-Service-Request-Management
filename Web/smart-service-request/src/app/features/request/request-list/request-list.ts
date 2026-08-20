import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

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

  requests: Request[] = [];

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.requestService.getAllRequests().subscribe({

      next: response => {

        this.isLoading = false;

        if (!response.success) {
          this.errorMessage =
            response.message || 'Unable to load requests.';
          return;
        }

        this.requests = response.data ?? [];
      },

      error: error => {

        this.isLoading = false;

        console.error(error);

        this.errorMessage =
          'Unable to load requests.';
      }

    });
  }
}