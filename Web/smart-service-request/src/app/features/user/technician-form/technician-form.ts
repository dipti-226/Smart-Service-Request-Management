import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import {PASSWORD_MISMATCH_MESSAGE,VALIDATION} from '../../../core/validation/validation-rules';
import { getFieldError, passwordsMatch } from '../../../core/validation/validators';

@Component({
  selector: 'app-technician-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './technician-form.html',
  styleUrl: './technician-form.css'
})
export class TechnicianFormComponent {

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly fieldError = getFieldError;
  readonly passwordMismatchMessage = PASSWORD_MISMATCH_MESSAGE;

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Same rules and messages as the API (CreateTechnicianRequestDto) and the Register form
  technicianForm = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(VALIDATION.username.min),
          Validators.maxLength(VALIDATION.username.max),
          Validators.pattern(VALIDATION.username.pattern)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.maxLength(VALIDATION.email.max),
          Validators.pattern(VALIDATION.email.pattern)
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(VALIDATION.password.min),
          Validators.maxLength(VALIDATION.password.max)
        ]
      ],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  get username() { return this.technicianForm.controls.username; }
  get email() { return this.technicianForm.controls.email; }
  get password() { return this.technicianForm.controls.password; }
  get confirmPassword() { return this.technicianForm.controls.confirmPassword; }

  submitTechnician(): void {

    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.technicianForm.invalid) {
      this.technicianForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const value = this.technicianForm.getRawValue();

    this.userService
      .createTechnician({
        username: value.username.trim(),
        email: value.email.trim(),
        password: value.password,
        confirmPassword: value.confirmPassword
      })
      .subscribe({

        next: response => {

          this.isSubmitting.set(false);

          if (!response.success) {
            this.errorMessage.set(response.message || 'Unable to create technician.');
            return;
          }

          this.successMessage.set('Technician created successfully.');
          this.technicianForm.reset();

          setTimeout(() => {
            this.router.navigate(['/users']);
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