import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { RequestService } from '../../../core/services/request.service';
import {AdvancedRequest,REQUEST_TYPES} from '../../../core/models/request.model';
import { REQUEST_PRIORITIES } from '../../../core/models/paged.model';
import { VALIDATION } from '../../../core/validation/validation-rules';
import { getFieldError, requiredText } from '../../../core/validation/validators';

@Component({
  selector: 'app-my-request-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './my-request-edit.html',
  styleUrl: './my-request-edit.css'
})
export class MyRequestEditComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestService = inject(RequestService);

  readonly priorities = REQUEST_PRIORITIES;
  readonly fieldError = getFieldError;

  request = signal<AdvancedRequest | null>(null);

  // Same types as the Create form (a type the request already has is kept as an extra option)
  requestTypes = signal<string[]>(REQUEST_TYPES);

  isLoading = signal(true);
  isSubmitting = signal(false);
  isSaved = signal(false);

  loadError = signal('');
  errorMessage = signal('');
  successMessage = signal('');

  // The form is shown only while the request is Open
  isEditable = computed(() => this.request()?.status === 'Open');

  // "Back" goes to the request, or to the list if the request could not be loaded
  backLink = computed(() => {
    const current = this.request();

    return current ? ['/my-requests', current.requestId] : ['/my-requests'];
  });

   requestForm = this.fb.nonNullable.group({
    requestType: ['', [Validators.required, Validators.maxLength(VALIDATION.requestType.max)]],
    requestDescription: ['', [requiredText, Validators.maxLength(VALIDATION.description.max)]],
    priority: ['', Validators.required]
  });

  // Live character count for the description (the limit is the same as the API's)
  readonly descriptionMax = VALIDATION.description.max;
  readonly descriptionLength = toSignal(
    this.requestForm.controls.requestDescription.valueChanges.pipe(map(value => value.length)),
    { initialValue: 0 }
  );

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.isLoading.set(false);
      this.loadError.set('Invalid request.');
      return;
    }

    this.loadRequest(id);
  }

  private loadRequest(id: number): void {

    this.requestService.getOwnRequestById(id).subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.loadError.set(response.message || 'Request not found.');
          return;
        }

        const data = response.data;

        this.request.set(data);

        if (!REQUEST_TYPES.includes(data.requestType)) {
          this.requestTypes.set([...REQUEST_TYPES, data.requestType]);
        }

        this.requestForm.patchValue({
          requestType: data.requestType,
          requestDescription: data.requestDescription,
          priority: data.priority
        });
      },

      error: error => {

        this.isLoading.set(false);

        console.error(error);

        this.loadError.set(
          error?.error?.message || 'Unable to load the request.'
        );
      }
    });
  }

  submitRequest(): void {

    const current = this.request();

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!current || this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const value = this.requestForm.getRawValue();

    this.requestService
      .updateOwnRequest(current.requestId, {
        requestType: value.requestType,
        requestDescription: value.requestDescription.trim(),
        priority: value.priority
      })
      .subscribe({

        next: response => {

          this.isSubmitting.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to update the request.'
            );
            return;
          }

          this.isSaved.set(true);
          this.successMessage.set('Request updated successfully.');

          setTimeout(() => {
            this.router.navigate(['/my-requests', current.requestId]);
          }, 1000);
        },

        error: error => {

          this.isSubmitting.set(false);

          console.error(error);

          this.errorMessage.set(
            error?.error?.message || 'Unable to connect to the server.'
          );
        }
      });
  }
}