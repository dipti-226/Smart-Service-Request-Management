import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {PASSWORD_MISMATCH_MESSAGE,VALIDATION} from '../../../core/validation/validation-rules';
import { getFieldError, passwordsMatch } from '../../../core/validation/validators';

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

  readonly fieldError = getFieldError;
  readonly passwordMismatchMessage = PASSWORD_MISMATCH_MESSAGE;

  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Same rules and messages as the API (RegisterRequestDto)
  registerForm = this.fb.nonNullable.group(
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
          this.errorMessage.set(response.message || 'Registration failed. Please try again.');
          return;
        }

        // keep the button disabled until we move to the login page
        this.successMessage.set('Registration successful. Redirecting to login...');
        this.registerForm.reset();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },

      error: error => {
        this.isSubmitting.set(false);
        console.error(error);
        this.errorMessage.set(error?.error?.message || 'Unable to register. Please try again.');
      }
    });
  }
}