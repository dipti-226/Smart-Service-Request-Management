import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'ssr_token';
const USERNAME_KEY = 'ssr_username';
const ROLE_KEY = 'ssr_role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem(TOKEN_KEY, response.data.token);
            localStorage.setItem(USERNAME_KEY, response.data.username);
            localStorage.setItem(ROLE_KEY, response.data.roleName);
          }
        })
      );
  }

    // Creates an Employee account. No token is saved here.
  register(request: RegisterRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(
      `${this.apiUrl}/register`,
      request
    );
  }
  
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // true if the logged-in user has any of the given roles
  hasRole(roles: string[]): boolean {
    const role = this.getRole();

    return !!role &&
      roles.some(r => r.toLowerCase() === role.toLowerCase());
  }

  isAdmin(): boolean {
    return this.hasRole(['Admin']);
  }

  isEmployee(): boolean {
    return this.hasRole(['Employee']);
  }

    isTechnician(): boolean {
    return this.hasRole(['Technician']);
  }

  // First page for each role after login
    // First page for each role after login
  getHomeRoute(): string {
    if (this.isAdmin()) {
      return '/dashboard';
    }

    if (this.isEmployee()) {
      return '/my-requests';
    }

    if (this.isTechnician()) {
      return '/assigned-requests';
    }

    return '/no-access';
  }
}