import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals so the button/error state re-renders reliably
  // (this app runs zoneless).
  isSubmitting = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.nonNullable.group({
    adminName: ['', Validators.required],
    password: ['', Validators.required]
  });

  submitLogin(): void {

    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({

      next: response => {

        this.isSubmitting.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(
            response.message || 'Invalid username or password.'
          );
          return;
        }

        this.router.navigate(['/dashboard']);
      },

      error: error => {

        this.isSubmitting.set(false);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to login. Please try again.'
        );
      }
    });
  }
}
