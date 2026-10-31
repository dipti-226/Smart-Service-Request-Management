import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AiService } from '../../../core/services/ai.service';
import { RequestService } from '../../../core/services/request.service';
import { AiRequestClassification } from '../../../core/models/ai.model';
import { REQUEST_TYPES } from '../../../core/models/request.model';
import { REQUEST_PRIORITIES } from '../../../core/models/paged.model';
import { VALIDATION } from '../../../core/validation/validation-rules';
import { getFieldError, requiredText } from '../../../core/validation/validators';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './request-form.html',
  styleUrl: './request-form.css'
})
export class RequestFormComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly aiService = inject(AiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly fieldError = getFieldError;
  readonly priorities = REQUEST_PRIORITIES;

  // Signals so the form's loading/success/error state re-renders
  // reliably (this app runs zoneless).
  isSubmitting = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  isEditMode = signal(false);
  requestId: number | null = null;
  statusOptions = signal<string[]>([]);   // Status dropdown (edit mode): current status + allowed next statuses

  // The request types (a type the request already has is kept as an extra option in edit mode)
  requestTypes = signal<string[]>(REQUEST_TYPES);

  // Same rules and messages as the API (CreateRequestDto / UpdateRequestDto)
  requestForm = this.fb.nonNullable.group({

    requestType: ['', [Validators.required, Validators.maxLength(VALIDATION.requestType.max)]],
    requestDescription: ['', [requiredText, Validators.maxLength(VALIDATION.description.max)]],
    priority: ['', Validators.required],
    status: ['']
  });

  // Live character count for the description (the limit is the same as the API's)
  readonly descriptionMax = VALIDATION.description.max;
  readonly descriptionLength = toSignal(
    this.requestForm.controls.requestDescription.valueChanges.pipe(map(value => value.length)),
    { initialValue: 0 }
  );

  // ---------- AI suggestion for the type and priority ----------
  // Only used when the AI is switched on in the API settings. It never changes the form
  // by itself: the user clicks Apply, and can still change both fields afterwards.

  readonly aiHint =
    'The AI reads your description and suggests a type and priority. ' +
    'It is only a suggestion: you can change both before you submit.';

  // The description must have at least this many characters before the AI is asked
  readonly aiMinLength = 15;

  readonly descriptionTrimmedLength = toSignal(
    this.requestForm.controls.requestDescription.valueChanges.pipe(map(value => value.trim().length)),
    { initialValue: 0 }
  );

  aiEnabled = signal(false);
  aiLoading = signal(false);
  aiResult = signal<AiRequestClassification | null>(null);
  aiError = signal('');
  aiApplied = signal(false);

  get canSuggest(): boolean {
    return this.descriptionTrimmedLength() >= this.aiMinLength && !this.aiLoading();
  }

  ngOnInit(): void {

    // Any problem here simply means "AI off": the form stays exactly as it was
    this.aiService
      .isEnabled()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => this.aiEnabled.set(enabled));

    // Changing the description makes an earlier suggestion out of date
    this.requestForm.controls.requestDescription.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.aiResult.set(null);
        this.aiError.set('');
        this.aiApplied.set(false);
      });

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      this.errorMessage.set('');
      this.successMessage.set('');

      if (idParam) {
        this.isEditMode.set(true);
        this.requestId = Number(idParam);

        this.requestForm.controls.status.addValidators(Validators.required);
        this.requestForm.controls.status.updateValueAndValidity();

        this.loadRequest(this.requestId);
      } else {
        this.isEditMode.set(false);
        this.requestId = null;

        this.requestForm.controls.status.clearValidators();
        this.requestForm.controls.status.updateValueAndValidity();

        this.requestForm.reset({ requestType: '', requestDescription: '', priority: '', status: '' });
      }
    });
  }

  // Asks the AI to suggest a request type and priority for the description
  suggestClassification(): void {

    if (!this.canSuggest) {
      return;
    }

    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiApplied.set(false);
    this.aiResult.set(null);

    this.aiService
      .classifyRequest(this.requestForm.controls.requestDescription.value.trim())
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

  // Copies the suggested type and priority into the form (the user can still change them)
  applySuggestion(): void {

    const suggestion = this.aiResult();

    if (!suggestion?.aiUsed) {
      return;
    }

    this.requestForm.patchValue({
      requestType: suggestion.requestType,
      priority: suggestion.priority
    });

    this.requestForm.controls.requestType.markAsDirty();
    this.requestForm.controls.priority.markAsDirty();

    this.aiResult.set(null);
    this.aiApplied.set(true);
  }

  dismissSuggestion(): void {
    this.aiResult.set(null);
  }

    // Leave without saving: go to the user's own home page (the same page they land on after login).
  cancel(): void {
    this.router.navigate([this.authService.getHomeRoute()]);
  }
  
  loadRequest(id: number): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getRequestById(id).subscribe({

      next: response => {
        this.isLoading.set(false);
        if (!response.success || !response.data) {
          this.errorMessage.set(response.message || 'Unable to load request.');
          return;
        }

        if (!REQUEST_TYPES.includes(response.data.requestType)) {
          this.requestTypes.set([...REQUEST_TYPES, response.data.requestType]);
        }

        this.requestForm.patchValue({
          requestType: response.data.requestType,
          requestDescription: response.data.requestDescription,
          priority: response.data.priority,
          status: response.data.status
        });
        this.loadStatusOptions(id, response.data.status);
      },

      error: error => {

        this.isLoading.set(false);
        console.error(error);
        this.errorMessage.set(error?.error?.message || 'Unable to load request.');
      }
    });
  }

  private loadStatusOptions(id: number, currentStatus: string): void {

    // The current status is always selectable, so a request can be
    // edited without changing its status.
    this.statusOptions.set([currentStatus]);

    this.requestService.getAllowedStatuses(id).subscribe({

      next: response => {
        this.statusOptions.set([currentStatus, ...(response.data ?? [])]);
      },

      error: error => { console.error(error); }
    });
  }

  private buildPayload() {
    const value = this.requestForm.getRawValue();

    return {
      ...value,
      requestDescription: value.requestDescription.trim()
    };
  }

  submitRequest(): void {

    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode() && this.requestId !== null) {
      this.updateExistingRequest(this.requestId);
      return;
    }

    this.requestService
      .createRequest(this.buildPayload())
      .subscribe({
        next: response => {

          this.isSubmitting.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(response.message || 'Unable to create request.');
            return;
          }

          this.successMessage.set(`Request ${response.data.requestCode} created successfully.`);

          this.requestForm.reset({
            requestType: '',
            requestDescription: '',
            priority: '',
            status: ''
          });

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },

        error: error => {
          this.isSubmitting.set(false);
          console.error(error);
          this.errorMessage.set(error?.error?.message || 'Unable to connect to the server.');
        }
      });
  }

  private updateExistingRequest(id: number): void {

    this.requestService
      .updateRequest(id, this.buildPayload())
      .subscribe({
        next: response => {

          this.isSubmitting.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(response.message || 'Unable to update request.');
            return;
          }

          this.successMessage.set(`Request ${response.data.requestCode} updated successfully.`);

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },

        error: error => {
          this.isSubmitting.set(false);
          console.error(error);
          this.errorMessage.set(error?.error?.message || 'Unable to connect to the server.');
        }
      });
  }
}