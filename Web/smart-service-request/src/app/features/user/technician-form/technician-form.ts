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

import { UserService } from '../../../core/services/user.service';

// Password and Confirm Password must be the same
const passwordsMatch: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {

  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

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

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  technicianForm = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^\S+$/)
        ]
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(150)]
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(100)]
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
            this.errorMessage.set(
              response.message || 'Unable to create technician.'
            );
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

          this.errorMessage.set(
            error?.error?.message || 'Unable to connect to the server.'
          );
        }
      });
  }
}