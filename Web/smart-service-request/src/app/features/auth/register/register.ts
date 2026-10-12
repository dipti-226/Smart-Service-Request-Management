import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

// Form level check: password and confirm password must be the same
const passwordsMatch: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Rules match the API (RegisterRequestDto)
  registerForm = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z0-9._-]+$/)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(150)
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(100)
        ]
      ],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  submitRegister(): void {

    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const value = this.registerForm.getRawValue();

    this.isSubmitting.set(true);

    this.authService.register({
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password,
      confirmPassword: value.confirmPassword
    }).subscribe({

      next: response => {

        if (!response.success) {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            response.message || 'Registration failed. Please try again.'
          );
          return;
        }

        // keep the button disabled until we move to the login page
        this.successMessage.set(
          'Registration successful. Redirecting to login...'
        );
        this.registerForm.reset();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },

      error: error => {
        this.isSubmitting.set(false);
        console.error(error);
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {

    // Business errors from the API: { success: false, message: "..." }
    if (error?.error?.message) {
      return error.error.message;
    }

    // Validation errors from ASP.NET: { errors: { Field: ["..."] } }
    const validationErrors = error?.error?.errors;

    if (validationErrors) {
      const first = (Object.values(validationErrors) as string[][]).flat()[0];

      if (typeof first === 'string') {
        return first;
      }
    }

    return 'Unable to register. Please try again.';
  }
}