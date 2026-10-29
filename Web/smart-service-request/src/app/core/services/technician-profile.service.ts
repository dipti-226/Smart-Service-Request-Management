import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {SaveTechnicianProfileRequest,TechnicianProfile} from '../models/technician-profile.model';

@Injectable({
  providedIn: 'root'
})
export class TechnicianProfileService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/TechnicianProfile`;

  // The logged-in technician's profile and the specializations to choose from
  getMyProfile(): Observable<ApiResponse<TechnicianProfile>> {
    return this.http.get<ApiResponse<TechnicianProfile>>(`${this.apiUrl}/me`);
  }

  saveMyProfile(request: SaveTechnicianProfileRequest): Observable<ApiResponse<TechnicianProfile>> {
    return this.http.put<ApiResponse<TechnicianProfile>>(`${this.apiUrl}/me`, request);
  }
}