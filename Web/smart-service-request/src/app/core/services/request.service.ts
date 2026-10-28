import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Request, CreateRequest,UpdateRequest,AdvancedRequest,Technician,UpdateRequestStatus,AssignTechnician} from '../models/request.model';import { Dashboard } from '../models/dashboard.model';

import { ListQuery, PagedResult } from '../models/paged.model';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Request`;

  private readonly advancedApiUrl = `${environment.apiUrl}/AdvancedRequest`;

  private readonly technicianApiUrl = `${environment.apiUrl}/Technician`;

  private readonly employeeApiUrl = `${environment.apiUrl}/Employee`;

  // Goes up by one after every successful status change, so the status timeline
  // on the open request page knows to load the new step.
  readonly statusChanged = signal(0);

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

    getMyRequests(): Observable<ApiResponse<Request[]>> {
    return this.http.get<ApiResponse<Request[]>>(
      `${this.apiUrl}/my`
    );
  }

    getRequestsPaged(query: ListQuery): Observable<ApiResponse<PagedResult<Request>>> {
    return this.http.get<ApiResponse<PagedResult<Request>>>(
      `${this.apiUrl}/paged`,
      { params: this.buildListParams(query) }
    );
  }

  getMyRequestsPaged(query: ListQuery): Observable<ApiResponse<PagedResult<Request>>> {
    return this.http.get<ApiResponse<PagedResult<Request>>>(
      `${this.apiUrl}/my/paged`,
      { params: this.buildListParams(query) }
    );
  }

    // Requests assigned to the logged-in technician
  getAssignedRequestsPaged(query: ListQuery): Observable<ApiResponse<PagedResult<Request>>> {
    return this.http.get<ApiResponse<PagedResult<Request>>>(
      `${this.technicianApiUrl}/requests/paged`,
      { params: this.buildListParams(query) }
    );
  }

  // One assigned request (404 if it is not assigned to this technician)
  getAssignedRequestById(id: number): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.get<ApiResponse<AdvancedRequest>>(
      `${this.technicianApiUrl}/requests/${id}`
    );
  }

    // One own request (404 if it was not created by this employee)
  getOwnRequestById(id: number): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.get<ApiResponse<AdvancedRequest>>(
      `${this.employeeApiUrl}/requests/${id}`
    );
  }

  // Edit own request (only while Open)
  updateOwnRequest(id: number, request: CreateRequest): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.put<ApiResponse<AdvancedRequest>>(
      `${this.employeeApiUrl}/requests/${id}`,
      request
    );
  }

  // Cancel own request (only while Open)
  cancelOwnRequest(id: number): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.put<ApiResponse<AdvancedRequest>>(
      `${this.employeeApiUrl}/requests/${id}/cancel`,
      {}
    ).pipe(tap(response => this.notifyStatusChanged(response.success)));
  }

    // Close own request (only while Resolved)
  closeOwnRequest(id: number): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.put<ApiResponse<AdvancedRequest>>(
      `${this.employeeApiUrl}/requests/${id}/close`,
      {}
    ).pipe(tap(response => this.notifyStatusChanged(response.success)));
  }

  // Reopen own request (only while Resolved)
  reopenOwnRequest(id: number): Observable<ApiResponse<AdvancedRequest>> {
    return this.http.put<ApiResponse<AdvancedRequest>>(
      `${this.employeeApiUrl}/requests/${id}/reopen`,
      {}
    ).pipe(tap(response => this.notifyStatusChanged(response.success)));
  }

  private notifyStatusChanged(success: boolean): void {
    if (success) {
      this.statusChanged.update(count => count + 1);
    }
  }

  // Empty filters are not sent
  private buildListParams(query: ListQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.priority) {
      params = params.set('priority', query.priority);
    }

    return params;
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

  getAdvancedRequestById(
  id: number
): Observable<ApiResponse<AdvancedRequest>> {

  return this.http.get<ApiResponse<AdvancedRequest>>(
    `${this.advancedApiUrl}/${id}`
  );
}


getTechnicians(): Observable<ApiResponse<Technician[]>> {

  return this.http.get<ApiResponse<Technician[]>>(
    `${this.advancedApiUrl}/technicians`
  );
}


updateRequestStatus(
  id: number,
  request: UpdateRequestStatus
): Observable<ApiResponse<AdvancedRequest>> {

  return this.http.put<ApiResponse<AdvancedRequest>>(
    `${this.advancedApiUrl}/${id}/status`,
    request
  ).pipe(tap(response => this.notifyStatusChanged(response.success)));
}


assignTechnician(
  id: number,
  request: AssignTechnician
): Observable<ApiResponse<AdvancedRequest>> {

  return this.http.put<ApiResponse<AdvancedRequest>>(
    `${this.advancedApiUrl}/${id}/technician`,
    request
  );
}
  
  getAllowedStatuses(
    id: number
  ): Observable<ApiResponse<string[]>> {

    return this.http.get<ApiResponse<string[]>>(
      `${this.advancedApiUrl}/${id}/allowed-statuses`
    );
  }
}