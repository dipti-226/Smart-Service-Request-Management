import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';

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

  // Signals so the form's loading/success/error state re-renders
  // reliably (this app runs zoneless).
  isSubmitting = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  isEditMode = signal(false);
  requestId: number | null = null;

  requestForm = this.fb.nonNullable.group({
    requestType: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],

    requestDescription: [
      '',
      [
        Validators.required,
        Validators.maxLength(1000)
      ]
    ],

    priority: [
      '',
      Validators.required
    ],

    status: ['']
  });

  ngOnInit(): void {

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

        this.requestForm.reset({
          requestType: '',
          requestDescription: '',
          priority: '',
          status: ''
        });
      }
    });
  }

  loadRequest(id: number): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getRequestById(id).subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(
            response.message || 'Unable to load request.'
          );
          return;
        }

        this.requestForm.patchValue({
          requestType: response.data.requestType,
          requestDescription: response.data.requestDescription,
          priority: response.data.priority,
          status: response.data.status
        });
      },

      error: error => {

        this.isLoading.set(false);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to load request.'
        );
      }
    });
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
      .createRequest(this.requestForm.getRawValue())
      .subscribe({
        next: response => {

          this.isSubmitting.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to create request.'
            );
            return;
          }

          this.successMessage.set(
            `Request ${response.data.requestCode} created successfully.`
          );

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

          this.errorMessage.set(
            error?.error?.message || 'Unable to connect to the server.'
          );
        }
      });
  }

  private updateExistingRequest(id: number): void {

    this.requestService
      .updateRequest(id, this.requestForm.getRawValue())
      .subscribe({
        next: response => {

          this.isSubmitting.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to update request.'
            );
            return;
          }

          this.successMessage.set(
            `Request ${response.data.requestCode} updated successfully.`
          );

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
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
