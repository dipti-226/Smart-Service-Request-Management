import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { AdvancedRequest } from '../../../core/models/request.model';
import { RequestDetailViewComponent } from '../../../shared/components/request-detail-view/request-detail-view';
import { RequestCommentsComponent } from '../../../shared/components/request-comments/request-comments';
import { RequestTimelineComponent } from '../../../shared/components/request-timeline/request-timeline';

@Component({
  selector: 'app-my-request-details',
  standalone: true,
  imports: [RouterLink, RequestDetailViewComponent, RequestTimelineComponent, RequestCommentsComponent],
  templateUrl: './my-request-details.html',
  styleUrl: './my-request-details.css'
})
export class MyRequestDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  request = signal<AdvancedRequest | null>(null);

  // Edit and cancel are possible only while the status is Open
  isOpen = computed(() => this.request()?.status === 'Open');
  // Close and Reopen are possible only while the status is Resolved
  isResolved = computed(() => this.request()?.status === 'Resolved');
  isChangingStatus = signal(false);
  isLoading = signal(true);
  isCancelling = signal(false);

  // errorMessage = the page could not load, actionError / actionSuccess = cancel result
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

    this.requestService.getOwnRequestById(id).subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(response.message || 'Request not found.');
          return;
        }

        this.request.set(response.data);
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

  async cancelRequest(): Promise<void> {

    const current = this.request();

    if (!current || this.isCancelling()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancel request',
      message: `Cancel request ${current.requestCode}? A cancelled request cannot be reopened.`,
      confirmText: 'Yes, cancel request',
      cancelText: 'Keep request',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    this.isCancelling.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    this.requestService.cancelOwnRequest(current.requestId).subscribe({

      next: response => {

        this.isCancelling.set(false);

        if (!response.success || !response.data) {
          this.actionError.set(
            response.message || 'Unable to cancel the request.'
          );
          return;
        }

        this.request.set(response.data);
        this.actionSuccess.set(response.message || 'Request cancelled successfully.');
      },

      error: error => {

        this.isCancelling.set(false);

        console.error(error);

        this.actionError.set(
          error?.error?.message || 'Unable to cancel the request.'
        );
      }
    });
  }

    async closeRequest(): Promise<void> {

    const current = this.request();

    if (!current || this.isChangingStatus()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Close request',
      message: `Close request ${current.requestCode}? A closed request cannot be reopened.`,
      confirmText: 'Yes, close request',
      cancelText: 'Keep it',
      danger: false
    });

    if (!confirmed) {
      return;
    }

    this.runStatusChange(
      this.requestService.closeOwnRequest(current.requestId),
      'Request closed successfully.',
      'Unable to close the request.'
    );
  }

  async reopenRequest(): Promise<void> {

    const current = this.request();

    if (!current || this.isChangingStatus()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Reopen request',
      message: `Reopen request ${current.requestCode}? It will go back to Open.`,
      confirmText: 'Yes, reopen request',
      cancelText: 'Keep it resolved',
      danger: false
    });

    if (!confirmed) {
      return;
    }

    this.runStatusChange(
      this.requestService.reopenOwnRequest(current.requestId),
      'Request reopened successfully.',
      'Unable to reopen the request.'
    );
  }

  private runStatusChange(
    call: Observable<ApiResponse<AdvancedRequest>>,
    successText: string,
    failText: string
  ): void {

    this.isChangingStatus.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    call.subscribe({

      next: response => {

        this.isChangingStatus.set(false);

        if (!response.success || !response.data) {
          this.actionError.set(response.message || failText);
          return;
        }

        this.request.set(response.data);
        this.actionSuccess.set(response.message || successText);
      },

      error: error => {

        this.isChangingStatus.set(false);

        console.error(error);

        this.actionError.set(error?.error?.message || failText);
      }
    });
  }
}