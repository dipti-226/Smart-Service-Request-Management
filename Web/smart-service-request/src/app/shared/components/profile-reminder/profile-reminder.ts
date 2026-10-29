import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { TechnicianProfileService } from '../../../core/services/technician-profile.service';

// A small banner for technicians whose profile is not complete yet.
// It shows nothing when the profile is complete or cannot be loaded.
@Component({
  selector: 'app-profile-reminder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile-reminder.html',
  styleUrl: './profile-reminder.css'
})
export class ProfileReminderComponent implements OnInit {

  private readonly profileService = inject(TechnicianProfileService);
  private readonly destroyRef = inject(DestroyRef);

  isIncomplete = signal(false);

  ngOnInit(): void {

    this.profileService
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: response => {
          this.isIncomplete.set(
            response.success && !!response.data && !response.data.isProfileComplete
          );
        },

        error: () => {
          this.isIncomplete.set(false);
        }
      });
  }
}