import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { TechnicianRecommendation } from '../models/technician-recommendation.model';

@Injectable({
  providedIn: 'root'
})
export class TechnicianRecommendationService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/TechnicianRecommendation`;

  // The technician to consider for a request (a suggestion only, nothing is assigned)
  getForRequest(requestId: number): Observable<ApiResponse<TechnicianRecommendation>> {
    return this.http.get<ApiResponse<TechnicianRecommendation>>(
      `${this.apiUrl}/${requestId}`
    );
  }
}