import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ListQuery, PagedResult } from '../models/paged.model';
import { CreateTechnician, UserListItem } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/User`;

  private readonly authUrl = `${environment.apiUrl}/Auth`;

  // The shared list query is reused: "status" holds Active / Inactive
  // and "priority" holds the role filter (the filter bar is shared with the request lists).
  getUsersPaged(query: ListQuery): Observable<ApiResponse<PagedResult<UserListItem>>> {

    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.priority) {
      params = params.set('role', query.priority);
    }

    if (query.status) {
      params = params.set('isActive', query.status === 'Active');
    }

    return this.http.get<ApiResponse<PagedResult<UserListItem>>>(
      `${this.apiUrl}/paged`,
      { params }
    );
  }

  setUserActive(id: number, isActive: boolean): Observable<ApiResponse<UserListItem>> {
    return this.http.put<ApiResponse<UserListItem>>(
      `${this.apiUrl}/${id}/active`,
      { isActive }
    );
  }

  // Existing API: POST api/Auth/technician (Admin only)
  createTechnician(request: CreateTechnician): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(
      `${this.authUrl}/technician`,
      request
    );
  }
}