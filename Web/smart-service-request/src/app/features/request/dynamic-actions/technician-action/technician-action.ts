import {Component,DestroyRef,EventEmitter,Input,OnInit,Output,inject,signal} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import {AdvancedRequest,Technician} from '../../../../core/models/request.model';

import { TechnicianRecommendation } from '../../../../core/models/technician-recommendation.model';
import { TechnicianRecommendationService } from '../../../../core/services/technician-recommendation.service';

// Statuses that count as a technician's active workload (same list as the API)
const ACTIVE_STATUSES = ['Open', 'In Progress', 'On Hold'];

// Final statuses: a technician can no longer be assigned
const LOCKED_STATUSES = ['Cancelled', 'Closed'];

@Component({
  selector: 'app-technician-action',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './technician-action.html',
  styleUrl: './technician-action.css'
})
export class TechnicianActionComponent implements OnInit {

  private readonly recommendationService = inject(TechnicianRecommendationService);
  private readonly destroyRef = inject(DestroyRef);

  @Input()
  request!: AdvancedRequest;

  @Input()
  technicians: Technician[] = [];

  @Output()
  technicianAssigned =
    new EventEmitter<number>();

  selectedTechnicianId: number | null = null;

  // The technician the server suggests for this request (null until loaded, or on error)
  recommendation = signal<TechnicianRecommendation | null>(null);

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
  }

  // true when the request already has the recommended technician
  get recommendationIsCurrent(): boolean {

    const rec = this.recommendation();

    return !!rec && rec.technicianId === this.request?.technicianId;
  }

  // Selects the recommended technician in the dropdown (nothing is assigned yet)
  useRecommended(): void {

    const rec = this.recommendation();

    if (rec?.technicianId) {
      this.selectedTechnicianId = rec.technicianId;
    }
  }

  // Cancelled and Closed requests cannot get a technician any more
  get isAssignmentLocked(): boolean {
    return !!this.request && LOCKED_STATUSES.includes(this.request.status);
  }

  get lockedMessage(): string {

    return this.request?.status === 'Cancelled'
      ? 'This request was cancelled, so a technician cannot be assigned.'
      : 'This request is closed, so a technician cannot be assigned.';
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