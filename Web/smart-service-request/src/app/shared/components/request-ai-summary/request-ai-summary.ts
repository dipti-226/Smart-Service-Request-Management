import { DatePipe } from '@angular/common';
import {Component,DestroyRef,effect,inject,input,signal,untracked} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { AiRequestSummary } from '../../../core/models/ai.model';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { RequestService } from '../../../core/services/request.service';

// A short AI summary of one request. Only Admin and Technician see it, and only when
// the AI is switched on. It never runs by itself: the user clicks "Summarize this request".
@Component({
  selector: 'app-request-ai-summary',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './request-ai-summary.html',
  styleUrl: './request-ai-summary.css'
})
export class RequestAiSummaryComponent {

  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);
  private readonly requestService = inject(RequestService);
  private readonly destroyRef = inject(DestroyRef);

  requestId = input.required<number>();

  // Employees never see the summary (the API refuses them as well)
  readonly allowed = this.authService.isAdmin() || this.authService.isTechnician();

  readonly hint =
    'The AI reads the description, the status history and the comments of this request. ' +
    'People are shown by role only, and emails and phone numbers are removed.';

  aiEnabled = signal(false);
  isLoading = signal(false);
  summary = signal<AiRequestSummary | null>(null);
  errorMessage = signal('');

  // true when the request changed after the summary was made
  isStale = signal(false);

  private subscription?: Subscription;

  constructor() {

    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());

    // Any problem here simply means "AI off": the page stays exactly as it was
    if (this.allowed) {
      this.aiService
        .isEnabled()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(enabled => this.aiEnabled.set(enabled));
    }

    // A different request: forget the old summary
    effect(() => {
      this.requestId();

      untracked(() => this.reset());
    });

    // A status change after the summary was made: it may be out of date
    effect(() => {
      this.requestService.statusChanged();

      untracked(() => {
        if (this.summary()?.aiUsed) {
          this.isStale.set(true);
        }
      });
    });
  }

  summarize(): void {

    if (this.isLoading()) {
      return;
    }

    this.subscription?.unsubscribe();

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.isStale.set(false);

    this.subscription = this.aiService
      .summarizeRequest(this.requestId())
      .subscribe({

        next: response => {

          this.isLoading.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(response.message || 'The summary is not available right now.');
            return;
          }

          this.summary.set(response.data);
        },

        error: error => {

          this.isLoading.set(false);

          this.errorMessage.set(
            error?.status === 429
              ? 'Too many AI requests. Please wait a minute and try again.'
              : error?.error?.message || 'The summary is not available right now.'
          );
        }
      });
  }

  private reset(): void {
    this.subscription?.unsubscribe();
    this.isLoading.set(false);
    this.summary.set(null);
    this.errorMessage.set('');
    this.isStale.set(false);
  }
}