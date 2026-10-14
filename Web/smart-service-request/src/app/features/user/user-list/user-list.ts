import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ListFilters } from '../../../core/models/paged.model';
import {
  USER_ROLES,
  USER_STATUSES,
  UserListItem
} from '../../../core/models/user.model';
import { PagedListState } from '../../../core/utils/paged-list-state';
import { ListFilterBarComponent } from '../../../shared/components/list-filter-bar/list-filter-bar';
import { PagerComponent } from '../../../shared/components/pager/pager';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink, DatePipe, ListFilterBarComponent, PagerComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserListComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // "statuses" = Active / Inactive, "roles" is shown in the second dropdown
  readonly statuses = USER_STATUSES;
  readonly roles = USER_ROLES;

  // Newest users first, so a new technician is on the first page
  readonly state = new PagedListState('CreatedDate', 'DESC');

  users = signal<UserListItem[]>([]);

  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  changingId = signal<number | null>(null);

  private loadSubscription?: Subscription;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.loadSubscription?.unsubscribe());
    this.loadUsers();
  }

  loadUsers(): void {

    // Cancel the previous call, so an old slow response cannot overwrite a newer one
    this.loadSubscription?.unsubscribe();

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.loadSubscription = this.userService
      .getUsersPaged(this.state.toQuery())
      .subscribe({

        next: response => {

          this.isLoading.set(false);

          if (!response.success || !response.data) {
            this.errorMessage.set(
              response.message || 'Unable to load users.'
            );
            return;
          }

          this.users.set(response.data.items);
          this.state.applyResult(response.data);
        },

        error: error => {

          this.isLoading.set(false);

          console.error(error);

          this.errorMessage.set(
            error?.error?.message || 'Unable to load users.'
          );
        }
      });
  }

  onFiltersChanged(filters: ListFilters): void {
    this.state.applyFilters(filters);
    this.loadUsers();
  }

  onSort(column: string): void {
    this.state.toggleSort(column);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.state.goToPage(page);
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.state.setPageSize(size);
    this.loadUsers();
  }

  isSelf(user: UserListItem): boolean {
    const current = this.authService.getUsername() ?? '';

    return user.username.toLowerCase() === current.toLowerCase();
  }

  // Admin accounts and your own account cannot be changed (the API also blocks this)
  canChange(user: UserListItem): boolean {
    return user.roleName !== 'Admin' && !this.isSelf(user);
  }

  toggleActive(user: UserListItem): void {

    const activate = !user.isActive;

    const warning = !activate && user.roleName === 'Technician'
      ? ' They will not be able to log in and cannot be assigned new requests.'
      : !activate
        ? ' They will not be able to log in.'
        : '';

    const confirmed = confirm(
      `${activate ? 'Activate' : 'Deactivate'} user ${user.username}?${warning}`
    );

    if (!confirmed) {
      return;
    }

    this.changingId.set(user.userId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService.setUserActive(user.userId, activate).subscribe({

      next: response => {

        this.changingId.set(null);

        if (!response.success) {
          this.errorMessage.set(
            response.message || 'Unable to update user.'
          );
          return;
        }

        this.successMessage.set(response.message);

        // Reload the current page (the row may leave the list if a status filter is active)
        this.loadUsers();
      },

      error: error => {

        this.changingId.set(null);

        console.error(error);

        this.errorMessage.set(
          error?.error?.message || 'Unable to update user.'
        );
      }
    });
  }
}