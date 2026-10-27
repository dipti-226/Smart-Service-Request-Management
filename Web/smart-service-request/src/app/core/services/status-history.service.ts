import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { StatusHistoryEntry } from '../models/status-history.model';

@Injectable({
  providedIn: 'root'
})
export class StatusHistoryService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Request`;

  getStatusHistory(requestId: number): Observable<ApiResponse<StatusHistoryEntry[]>> {
    return this.http.get<ApiResponse<StatusHistoryEntry[]>>(
      `${this.apiUrl}/${requestId}/status-history`
    );
  }
}