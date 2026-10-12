import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';
import { Request } from '../../../core/models/request.model';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>My Requests</h1>
          <p>Requests created by you.</p>
        </div>

        <a routerLink="/request/new" class="primary-btn">+ Create Request</a>
      </div>

      <div class="table-card">

        @if (isLoading()) {

          <div class="state-message">Loading your requests...</div>

        } @else if (errorMessage()) {

          <div class="state-message error">{{ errorMessage() }}</div>

        } @else if (requests().length === 0) {

          <div class="state-message">You have not created any requests yet.</div>

        } @else {

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Request ID</th>
                  <th>Request Type</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>

              <tbody>
                @for (request of requests(); track request.requestId; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td>{{ request.requestCode }}</td>
                    <td>{{ request.requestType }}</td>
                    <td class="description">{{ request.requestDescription }}</td>
                    <td>
                      <span
                        class="priority"
                        [class.high]="request.priority === 'High'"
                        [class.critical]="request.priority === 'Critical'">
                        {{ request.priority }}
                      </span>
                    </td>
                    <td><span class="status">{{ request.status }}</span></td>
                    <td>{{ request.createdDate | date:'dd-MM-yyyy HH:mm' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        }

      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; color: #111827; }
    .page-header p { margin: 4px 0 0; color: #6b7280; }
    .primary-btn { background: #2563eb; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .primary-btn:hover { background: #1d4ed8; }
    .table-card { background: #fff; border-radius: 12px; border: 1px solid #eef0f3; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f0f1f3; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; white-space: nowrap; }
    td { font-size: 14px; color: #1f2937; }
    tbody tr:last-child td { border-bottom: none; }
    .description { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .priority, .status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .priority { background: #f3f4f6; color: #374151; }
    .priority.high { background: #fef3c7; color: #92400e; }
    .priority.critical { background: #fee2e2; color: #991b1b; }
    .status { background: #dbeafe; color: #1e40af; }
    .state-message { padding: 32px; text-align: center; color: #6b7280; }
    .state-message.error { color: #b91c1c; }
  `]
})
export class MyRequestsComponent implements OnInit {

  private readonly requestService = inject(RequestService);

  requests = signal<Request[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getMyRequests().subscribe({
      next: response => {
        this.requests.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message || 'Unable to load your requests.'
        );
        this.isLoading.set(false);
      }
    });
  }
}