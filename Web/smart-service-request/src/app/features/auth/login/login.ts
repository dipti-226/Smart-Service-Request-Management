import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { VALIDATION } from '../../../core/validation/validation-rules';
import { getFieldError, requiredText } from '../../../core/validation/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly fieldError = getFieldError;

  isSubmitting = signal(false);
  errorMessage = signal('');

  // Login only checks that both values are filled (and not too long),
  // so every existing account can still sign in.
  loginForm = this.fb.nonNullable.group({
    username: [
      '',
      [requiredText, Validators.maxLength(VALIDATION.username.max)]
    ],
    password: [
      '',
      [Validators.required, Validators.maxLength(VALIDATION.password.max)]
    ]
  });

  submitLogin(): void {

    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const value = this.loginForm.getRawValue();

    this.authService.login({
      username: value.username.trim(),
      password: value.password
    }).subscribe({

      next: response => {

        this.isSubmitting.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(response.message || 'Invalid username or password.');
          return;
        }

        this.router.navigate([this.authService.getHomeRoute()]);
      },

      error: error => {

        this.isSubmitting.set(false);
        console.error(error);
        this.errorMessage.set(error?.error?.message || 'Unable to login. Please try again.');
      }
    });
  }
}