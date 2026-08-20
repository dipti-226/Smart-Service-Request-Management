import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { RequestService } from '../../../core/services/request.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './request-form.html',
  styleUrl: './request-form.css'
})
export class RequestFormComponent {

  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

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
    ]
  });

  submitRequest(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.requestService
      .createRequest(this.requestForm.getRawValue())
      .subscribe({
        next: response => {

          this.isSubmitting = false;

          if (!response.success || !response.data) {
            this.errorMessage =
              response.message || 'Unable to create request.';
            return;
          }

          this.successMessage =
            `Request ${response.data.requestCode} created successfully.`;

          this.requestForm.reset({
            requestType: '',
            requestDescription: '',
            priority: ''
          });

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },

        error: error => {
          this.isSubmitting = false;

          console.error(error);

          this.errorMessage =
            'Unable to connect to the server.';
        }
      });
  }
}