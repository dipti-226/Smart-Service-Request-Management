import { NgTemplateOutlet } from '@angular/common';
import {Component,DestroyRef,EventEmitter,Input,OnInit,Output,inject,signal} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import {AdvancedRequest,Technician} from '../../../../core/models/request.model';

import { AiTechnicianSuggestion } from '../../../../core/models/ai.model';
import { TechnicianRecommendation } from '../../../../core/models/technician-recommendation.model';
import { AiService } from '../../../../core/services/ai.service';
import { TechnicianRecommendationService } from '../../../../core/services/technician-recommendation.service';

// Statuses that count as a technician's active workload (same list as the API)
const ACTIVE_STATUSES = ['Open', 'In Progress', 'On Hold'];

// Final statuses: a technician can no longer be assigned
const LOCKED_STATUSES = ['Cancelled', 'Closed'];

@Component({
  selector: 'app-technician-action',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './technician-action.html',
  styleUrl: './technician-action.css'
})
export class TechnicianActionComponent implements OnInit {

  private readonly recommendationService = inject(TechnicianRecommendationService);
  private readonly aiService = inject(AiService);
  private readonly destroyRef = inject(DestroyRef);

  @Input()
  request!: AdvancedRequest;

  @Input()
  technicians: Technician[] = [];

  @Output()
  technicianAssigned =
    new EventEmitter<number>();

  selectedTechnicianId: number | null = null;

  // Tooltip texts (kept out of the layout to keep the panel clean)
  readonly workloadHint =
    'The number after each name is active requests / limit. Open, In Progress and On Hold requests count.';

  readonly aiHint =
    'The AI only compares technicians who are already eligible. The final choice is yours, ' +
    'and the workload limit is checked again when you assign.';

  // The technician the server suggests for this request (null until loaded, or on error)
  recommendation = signal<TechnicianRecommendation | null>(null);

  // AI second opinion (only used when the AI is switched on in the API settings)
  aiEnabled = signal(false);
  aiLoading = signal(false);
  aiResult = signal<AiTechnicianSuggestion | null>(null);
  aiError = signal('');

  ngOnInit(): void {

    if (!this.request || this.isAssignmentLocked) {
      return;
    }

    this.recommendationService
      .getForRequest(this.request.requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: response => {
          if (response.success && response.data) {
            this.recommendation.set(response.data);
          }
        },

        // The recommendation is optional: if it fails, the dropdown still works
        error: () => { }
      });

    // Any problem here simply means "AI off": the screen stays exactly as it was
    this.aiService
      .isEnabled()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => this.aiEnabled.set(enabled));
  }

  // ---------- Recommendation ----------

  get hasRecommendation(): boolean {
    return !!this.recommendation()?.hasRecommendation;
  }

  // true when the request already has the recommended technician
  get recommendationIsCurrent(): boolean {

    const rec = this.recommendation();

    return !!rec && rec.technicianId === this.request?.technicianId;
  }

  // Shown as a tag next to the current technician when they are already the best match
  get bestMatchText(): string {

    return this.recommendation()?.matchesSpecialization
      ? `Best match for ${this.request.requestType} requests`
      : 'Least busy available technician';
  }

  // The "Suggested" part of the card (not needed when the current technician is the best match)
  get showStandardSuggestion(): boolean {
    return !this.isAssignmentLocked && this.hasRecommendation && !this.recommendationIsCurrent;
  }

  get showAiBlock(): boolean {
    return this.aiLoading() || !!this.aiResult() || !!this.aiError();
  }

  get showSuggestionCard(): boolean {
    return !this.isAssignmentLocked
      && this.hasRecommendation
      && (this.showStandardSuggestion || this.showAiBlock);
  }

  get canAskAi(): boolean {
    return this.aiEnabled()
      && !this.isAssignmentLocked
      && this.hasRecommendation
      && !this.aiResult()
      && !this.aiLoading();
  }

  // Selects the recommended technician in the dropdown (nothing is assigned yet)
  useRecommended(): void {

    const rec = this.recommendation();

    if (rec?.technicianId) {
      this.selectTechnician(rec.technicianId);
    }
  }

  // Selects a technician in the dropdown, only if the dropdown actually offers them
  selectTechnician(technicianId: number): void {

    if (this.availableTechnicians.some(t => t.technicianId === technicianId)) {
      this.selectedTechnicianId = technicianId;
    }
  }

  // Asks the AI for a second opinion. The server only lets it reorder and explain
  // technicians that are already eligible, and re-checks everything when you assign.
  askAi(): void {

    if (!this.request || this.aiLoading()) {
      return;
    }

    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiResult.set(null);

    this.aiService
      .suggestTechnician(this.request.requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: response => {

          this.aiLoading.set(false);

          if (!response.success || !response.data) {
            this.aiError.set(response.message || 'The AI suggestion is not available right now.');
            return;
          }

          this.aiResult.set(response.data);
        },

        error: error => {

          this.aiLoading.set(false);

          this.aiError.set(
            error?.status === 429
              ? 'Too many AI requests. Please wait a minute and try again.'
              : error?.error?.message || 'The AI suggestion is not available right now.'
          );
        }
      });
  }

  // ---------- Assignment ----------

  // Cancelled and Closed requests cannot get a technician any more
  get isAssignmentLocked(): boolean {
    return !!this.request && LOCKED_STATUSES.includes(this.request.status);
  }

  get lockedMessage(): string {

    return this.request?.status === 'Cancelled'
      ? 'This request was cancelled, so a technician cannot be assigned.'
      : 'This request is closed, so a technician cannot be assigned.';
  }

  // First line of the dropdown
  get selectPlaceholder(): string {
    return this.request?.technicianName ? 'Reassign to...' : 'Select technician';
  }

  // Technicians who can take this request. Someone at the limit is hidden,
  // unless this request is already theirs, or the request is no longer
  // active work (Resolved, Closed, Cancelled), which adds no workload.
  get availableTechnicians(): Technician[] {

    if (!this.requestCountsAsWorkload) {
      return this.technicians;
    }

    return this.technicians.filter(
      t => !t.isAtCapacity || t.technicianId === this.request.technicianId
    );
  }

  // Names of the technicians hidden because they are at the limit
  get hiddenTechnicianNames(): string[] {

    return this.technicians
      .filter(t => !this.availableTechnicians.includes(t))
      .map(t => t.technicianName);
  }

  // One short grey line. Empty when nobody is hidden, or when nobody is available at all
  // (that case has its own warning).
  get hiddenMessage(): string {

    const names = this.hiddenTechnicianNames;

    if (names.length === 0 || this.availableTechnicians.length === 0) {
      return '';
    }

    const limit = this.maxActiveRequests;

    return names.length === 1
      ? `${names[0]} is at full capacity (${limit}/${limit}) and not shown.`
      : `${names.join(', ')} are at full capacity (${limit}/${limit}) and not shown.`;
  }

  get maxActiveRequests(): number {
    return this.technicians[0]?.maxActiveRequests ?? 0;
  }

  private get requestCountsAsWorkload(): boolean {
    return !!this.request && ACTIVE_STATUSES.includes(this.request.status);
  }

  // "tech.sanjay · 1/3"  (active requests / limit)
  label(technician: Technician): string {
    return `${technician.technicianName} · ${technician.activeRequests}/${technician.maxActiveRequests}`;
  }

  assignTechnician(): void {

    if (this.isAssignmentLocked || !this.selectedTechnicianId) {
      return;
    }

    this.technicianAssigned.emit(
      this.selectedTechnicianId
    );
  }
}