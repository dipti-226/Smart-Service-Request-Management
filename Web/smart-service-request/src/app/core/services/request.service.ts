import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Request, CreateRequest, UpdateRequest } from '../models/request.model';
import { Dashboard } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Request`;

  createRequest(request: CreateRequest): Observable<ApiResponse<Request>> {
    return this.http.post<ApiResponse<Request>>(
      this.apiUrl,
      request
    );
  }

  getAllRequests(): Observable<ApiResponse<Request[]>> {
    return this.http.get<ApiResponse<Request[]>>(
      this.apiUrl
    );
  }

  getRequestById(id: number): Observable<ApiResponse<Request>> {
    return this.http.get<ApiResponse<Request>>(
      `${this.apiUrl}/${id}`
    );
  }

  updateRequest(id: number, request: UpdateRequest): Observable<ApiResponse<Request>> {
    return this.http.put<ApiResponse<Request>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  deleteRequest(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.apiUrl}/${id}`
    );
  }

  getDashboard(): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(
      `${this.apiUrl}/dashboard`
    );
  }
}