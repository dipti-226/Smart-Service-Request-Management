import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AiService } from '../../../core/services/ai.service';
import { RequestService } from '../../../core/services/request.service';
import {AiDescriptionHelp,AiQuickTips,AiRequestClassification} from '../../../core/models/ai.model';
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

  // ---------- AI help for the description ----------
  // Only used when the AI is switched on in the API settings. It never changes the form
  // by itself: the user clicks Apply or "Use this wording", and can still change everything
  // afterwards.

  readonly aiHint =
    'The AI reads your description and suggests a type and priority. ' +
    'It is only a suggestion: you can change both before you submit.';

  readonly helpHint =
    'The AI points out details a technician may need and offers clearer wording of your own text. ' +
    'Nothing changes until you click "Use this wording".';

  readonly tipsHint =
    'The AI suggests a few safe, simple things you can try yourself in a few minutes. ' +
    'If they do not help, just submit your request.';

  // The description must have at least this many characters before the AI is asked
  readonly aiMinLength = 15;

  readonly descriptionTrimmedLength = toSignal(
    this.requestForm.controls.requestDescription.valueChanges.pipe(map(value => value.trim().length)),
    { initialValue: 0 }
  );

  aiEnabled = signal(false);

  // The "Need help?" card: expanded or collapsed (only shows the three AI actions)
  helpOpen = signal(false);

  // Suggested type and priority
  aiLoading = signal(false);
  aiResult = signal<AiRequestClassification | null>(null);
  aiError = signal('');
  aiApplied = signal(false);

  // Missing details and clearer wording
  helpLoading = signal(false);
  helpResult = signal<AiDescriptionHelp | null>(null);
  helpError = signal('');

  // The description as it was before "Use this wording", so the change can be undone
  previousDescription = signal<string | null>(null);

  // Safe things to try before submitting
  tipsLoading = signal(false);
  tipsResult = signal<AiQuickTips | null>(null);
  tipsError = signal('');
  tipsSolved = signal(false);

    // True when the results section has anything to show (a result, a message or an error)
  get hasAiOutput(): boolean {
    return !!(this.aiResult() || this.helpResult() || this.tipsResult()
      || this.aiError() || this.helpError() || this.tipsError()
      || this.aiApplied() || this.tipsSolved() || this.previousDescription() !== null);
  }

  toggleHelp(): void {
    this.helpOpen.update(open => !open);
  }

  get hasEnoughText(): boolean {
    return this.descriptionTrimmedLength() >= this.aiMinLength;
  }
  
  // One AI call at a time
  get aiBusy(): boolean {
    return this.aiLoading() || this.helpLoading() || this.tipsLoading();
  }

  get canSuggest(): boolean {
    return this.hasEnoughText && !this.aiBusy;
  }

  get canImprove(): boolean {
    return this.hasEnoughText && !this.aiBusy;
  }

  // Tips are for before a request is submitted, so they are not offered when editing
  get canShowTips(): boolean {
    return !this.isEditMode() && this.hasEnoughText && !this.aiBusy;
  }

  ngOnInit(): void {

    // Any problem here simply means "AI off": the form stays exactly as it was
    this.aiService
      .isEnabled()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => this.aiEnabled.set(enabled));

    // Changing the description makes earlier suggestions out of date
    this.requestForm.controls.requestDescription.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.aiResult.set(null);
        this.aiError.set('');
        this.aiApplied.set(false);
        this.helpResult.set(null);
        this.helpError.set('');
        this.previousDescription.set(null);
        this.tipsResult.set(null);
        this.tipsError.set('');
        this.tipsSolved.set(false);
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

  // Asks the AI which details are missing and for clearer wording of the description
  improveDescription(): void {

    if (!this.canImprove) {
      return;
    }

    this.helpLoading.set(true);
    this.helpError.set('');
    this.helpResult.set(null);
    this.previousDescription.set(null);

    const value = this.requestForm.getRawValue();

    this.aiService
      .improveDescription(value.requestDescription.trim(), value.requestType || null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: response => {

          this.helpLoading.set(false);

          if (!response.success || !response.data) {
            this.helpError.set(response.message || 'The AI help is not available right now.');
            return;
          }

          this.helpResult.set(response.data);
        },

        error: error => {

          this.helpLoading.set(false);

          this.helpError.set(
            error?.status === 429
              ? 'Too many AI requests. Please wait a minute and try again.'
              : error?.error?.message || 'The AI help is not available right now.'
          );
        }
      });
  }

  // Replaces the description with the clearer wording. The old text is kept so it can be undone.
  useImprovedWording(): void {

    const improved = this.helpResult()?.improvedDescription;

    if (!improved || improved.length > this.descriptionMax) {
      return;
    }

    const control = this.requestForm.controls.requestDescription;
    const before = control.value;

    // Changing the description clears the old suggestions (see ngOnInit)
    control.setValue(improved);
    control.markAsDirty();

    this.previousDescription.set(before);
  }

  undoWording(): void {

    const before = this.previousDescription();

    if (before === null) {
      return;
    }

    this.requestForm.controls.requestDescription.setValue(before);
  }

  dismissHelp(): void {
    this.helpResult.set(null);
  }

  // Asks the AI for a few safe things to try before submitting
  showQuickTips(): void {

    if (!this.canShowTips) {
      return;
    }

    this.tipsLoading.set(true);
    this.tipsError.set('');
    this.tipsSolved.set(false);
    this.tipsResult.set(null);

    const value = this.requestForm.getRawValue();

    this.aiService
      .getQuickTips(value.requestDescription.trim(), value.requestType || null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: response => {

          this.tipsLoading.set(false);

          if (!response.success || !response.data) {
            this.tipsError.set(response.message || 'The tips are not available right now.');
            return;
          }

          this.tipsResult.set(response.data);
        },

        error: error => {

          this.tipsLoading.set(false);

          this.tipsError.set(
            error?.status === 429
              ? 'Too many AI requests. Please wait a minute and try again.'
              : error?.error?.message || 'The tips are not available right now.'
          );
        }
      });
  }

  dismissTips(): void {
    this.tipsResult.set(null);
  }

  // The tips solved the problem: clear the form, no request is needed
  solvedByTips(): void {

    this.requestForm.reset({ requestType: '', requestDescription: '', priority: '', status: '' });

    // reset() clears the old suggestions, so the message is set afterwards
    this.tipsSolved.set(true);
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