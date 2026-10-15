import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  );
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