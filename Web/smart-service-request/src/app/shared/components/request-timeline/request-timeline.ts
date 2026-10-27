import { DatePipe } from '@angular/common';
import {Component,DestroyRef,effect,inject,input,signal,untracked} from '@angular/core';
import { Subscription } from 'rxjs';

import { RequestService } from '../../../core/services/request.service';
import { StatusHistoryService } from '../../../core/services/status-history.service';
import { StatusHistoryEntry } from '../../../core/models/status-history.model';

// Status timeline of one request, oldest step first. Used on the Admin, Technician
// and Employee request pages. Who may read it is decided by the API.
@Component({
  selector: 'app-request-timeline',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './request-timeline.html',
  styleUrl: './request-timeline.css'
})
export class RequestTimelineComponent {

  private readonly historyService = inject(StatusHistoryService);
  private readonly requestService = inject(RequestService);
  private readonly destroyRef = inject(DestroyRef);

  requestId = input.required<number>();

  entries = signal<StatusHistoryEntry[]>([]);

  isLoading = signal(true);
  loadError = signal('');

  private subscription?: Subscription;

  constructor() {

    // Loads when the page opens, and again after every successful status change
    effect(() => {
      const id = this.requestId();
      this.requestService.statusChanged();

      untracked(() => this.loadHistory(id));
    });

    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());
  }

  private loadHistory(id: number): void {

    // A newer call replaces an older one, so a slow old answer cannot overwrite it
    this.subscription?.unsubscribe();

    // Show the loading text only the first time, so the list does not flash after an update
    if (this.entries().length === 0) {
      this.isLoading.set(true);
    }

    this.loadError.set('');

    this.subscription = this.historyService.getStatusHistory(id).subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.loadError.set(response.message || 'Unable to load the status timeline.');
          return;
        }

        this.entries.set(response.data);
      },

      error: error => {
        this.isLoading.set(false);
        console.error(error);
        this.loadError.set(error?.error?.message || 'Unable to load the status timeline.');
      }
    });
  }
}