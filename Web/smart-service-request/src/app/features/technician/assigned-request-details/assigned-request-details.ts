import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';
import { AdvancedRequest } from '../../../core/models/request.model';
import { RequestDetailViewComponent } from '../../../shared/components/request-detail-view/request-detail-view';
import { RequestCommentsComponent } from '../../../shared/components/request-comments/request-comments';
import { RequestTimelineComponent } from '../../../shared/components/request-timeline/request-timeline';

@Component({
  selector: 'app-assigned-request-details',
  standalone: true,
  imports: [RouterLink, RequestDetailViewComponent, RequestTimelineComponent, RequestCommentsComponent],
  templateUrl: './assigned-request-details.html',
  styleUrl: './assigned-request-details.css'
})
export class AssignedRequestDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestService);

  request = signal<AdvancedRequest | null>(null);

  // Next statuses this technician may choose (from the API, follows the step 1 rules)
  allowedStatuses = signal<string[]>([]);
  selectedStatus = signal('');

  isLoading = signal(true);
  isUpdating = signal(false);

  // errorMessage = the page could not load, actionError / actionSuccess = status update result
  errorMessage = signal('');
  actionError = signal('');
  actionSuccess = signal('');

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid request.');
      return;
    }

    this.loadRequest(id);
  }

  private loadRequest(id: number): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getAssignedRequestById(id).subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(response.message || 'Request not found.');
          return;
        }

        this.request.set(response.data);
        this.loadAllowedStatuses(response.data.requestId);
      },

      error: error => {

        this.isLoading.set(false);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to load the request.'
        );
      }
    });
  }

  private loadAllowedStatuses(id: number): void {

    this.requestService.getAllowedStatuses(id).subscribe({

      next: response => {
        this.allowedStatuses.set(response.data ?? []);
        this.selectedStatus.set('');
      },

      error: error => {
        console.error(error);

        this.allowedStatuses.set([]);

        this.actionError.set(
          error?.error?.message || 'Unable to load the allowed statuses.'
        );
      }
    });
  }

  onStatusSelected(status: string): void {
    this.selectedStatus.set(status);
  }

  updateStatus(): void {

    const current = this.request();
    const status = this.selectedStatus();

    if (!current || !status || this.isUpdating()) {
      return;
    }

    this.isUpdating.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    this.requestService
      .updateRequestStatus(current.requestId, { status })
      .subscribe({

        next: response => {

          this.isUpdating.set(false);

          if (!response.success || !response.data) {
            this.actionError.set(
              response.message || 'Unable to update the request status.'
            );
            return;
          }

          this.request.set(response.data);
          this.actionSuccess.set('Request status updated successfully.');

          // The next allowed statuses depend on the new status
          this.loadAllowedStatuses(response.data.requestId);
        },

        error: error => {

          this.isUpdating.set(false);

          console.error(error);

          this.actionError.set(
            error?.error?.message || 'Unable to update the request status.'
          );
        }
      });
  }
}