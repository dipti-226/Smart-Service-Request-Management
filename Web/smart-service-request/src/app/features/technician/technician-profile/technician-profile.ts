import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TechnicianProfileService } from '../../../core/services/technician-profile.service';
import { TechnicianProfile } from '../../../core/models/technician-profile.model';

// Same rules as the API (SaveTechnicianProfileDto)
const FULL_NAME_MIN = 2;
const FULL_NAME_MAX = 100;
const PHONE_MAX = 20;
const PHONE_PATTERN = /^[0-9+()\-\s]*$/;

@Component({
  selector: 'app-technician-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './technician-profile.html',
  styleUrl: './technician-profile.css'
})
export class TechnicianProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(TechnicianProfileService);
  private readonly router = inject(Router);

  profile = signal<TechnicianProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Ids of the specializations ticked in the form
  selectedIds = signal<number[]>([]);
  specializationsTouched = signal(false);

  profileForm = this.fb.nonNullable.group({
    fullName: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.minLength(FULL_NAME_MIN),
        Validators.maxLength(FULL_NAME_MAX)
      ]
    ],
    phone: [
      '',
      [
        Validators.maxLength(PHONE_MAX),
        Validators.pattern(PHONE_PATTERN)
      ]
    ]
  });

  get fullName() { return this.profileForm.controls.fullName; }
  get phone() { return this.profileForm.controls.phone; }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.profileService.getMyProfile().subscribe({

      next: response => {

        this.isLoading.set(false);

        if (!response.success || !response.data) {
          this.errorMessage.set(response.message || 'Unable to load your profile.');
          return;
        }

        this.applyProfile(response.data);
      },

      error: error => {

        this.isLoading.set(false);
        console.error(error);

        this.errorMessage.set(error?.error?.message || 'Unable to load your profile.');
      }
    });
  }

  private applyProfile(profile: TechnicianProfile): void {

    this.profile.set(profile);

    this.profileForm.patchValue({
      fullName: profile.fullName,
      phone: profile.phone
    });

    this.selectedIds.set(
      profile.specializations
        .filter(s => s.isSelected)
        .map(s => s.specializationId)
    );
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  onSpecializationChange(id: number, event: Event): void {

    const checked = (event.target as HTMLInputElement).checked;

    this.specializationsTouched.set(true);

    this.selectedIds.update(ids => {
      if (checked) {
        return ids.includes(id) ? ids : [...ids, id];
      }

      return ids.filter(x => x !== id);
    });
  }

  fullNameError(): string {

    if (this.fullName.hasError('required') || this.fullName.hasError('pattern')) {
      return 'Full name is required.';
    }

    if (this.fullName.hasError('minlength')) {
      return `Full name must be at least ${FULL_NAME_MIN} characters.`;
    }

    return `Full name cannot be more than ${FULL_NAME_MAX} characters.`;
  }

  phoneError(): string {

    if (this.phone.hasError('maxlength')) {
      return `Phone number cannot be more than ${PHONE_MAX} characters.`;
    }

    return 'Phone number can contain digits, spaces, +, - and brackets only.';
  }

  save(): void {

    this.errorMessage.set('');
    this.successMessage.set('');
    this.specializationsTouched.set(true);

    if (this.profileForm.invalid || this.selectedIds().length === 0) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const value = this.profileForm.getRawValue();

    this.profileService
      .saveMyProfile({
        fullName: value.fullName.trim(),
        phone: value.phone.trim(),
        specializationIds: this.selectedIds()
      })
      .subscribe({

        next: response => {

          this.isSaving.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(response.message || 'Unable to save your profile.');
            return;
          }

          this.applyProfile(response.data);
          this.successMessage.set('Profile saved successfully.');

          setTimeout(() => {
            this.router.navigate(['/assigned-requests']);
          }, 1000);
        },

        error: error => {

          this.isSaving.set(false);
          console.error(error);

          this.errorMessage.set(error?.error?.message || 'Unable to save your profile.');
        }
      });
  }
}