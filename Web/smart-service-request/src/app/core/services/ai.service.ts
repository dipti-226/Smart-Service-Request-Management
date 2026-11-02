import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AiDescriptionHelp,
  AiReplyDraft,
  AiRequestClassification,
  AiRequestSummary,
  AiStatus,
  AiTechnicianSuggestion,
  ReplyDraftIntent
} from '../models/ai.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private readonly http = inject(HttpClient);

  private enabled$?: Observable<boolean>;

  // true when the AI features are switched on in the API settings.
  // Asked once per page load. Any error means "off", so the screens stay as they were.
  isEnabled(): Observable<boolean> {

    if (!this.enabled$) {
      this.enabled$ = this.http
        .get<ApiResponse<AiStatus>>(`${environment.apiUrl}/Ai/status`)
        .pipe(
          map(response => response.success && !!response.data?.enabled),
          catchError(() => of(false)),
          shareReplay(1)
        );
    }

    return this.enabled$;
  }

  // An AI second opinion on the technicians the server already considers eligible
  suggestTechnician(requestId: number): Observable<ApiResponse<AiTechnicianSuggestion>> {
    return this.http.post<ApiResponse<AiTechnicianSuggestion>>(
      `${environment.apiUrl}/TechnicianRecommendation/${requestId}/ai`,
      {}
    );
  }

  // A suggested request type and priority for a description (a suggestion only)
  classifyRequest(description: string): Observable<ApiResponse<AiRequestClassification>> {
    return this.http.post<ApiResponse<AiRequestClassification>>(
      `${environment.apiUrl}/Ai/classify-request`,
      { description }
    );
  }

  // Questions about missing details and clearer wording for a description (a suggestion only)
  improveDescription(
    description: string,
    requestType: string | null
  ): Observable<ApiResponse<AiDescriptionHelp>> {
    return this.http.post<ApiResponse<AiDescriptionHelp>>(
      `${environment.apiUrl}/Ai/improve-description`,
      { description, requestType }
    );
  }

  // A short summary of one request (Admin, or the Technician it is assigned to)
  summarizeRequest(requestId: number): Observable<ApiResponse<AiRequestSummary>> {
    return this.http.post<ApiResponse<AiRequestSummary>>(
      `${environment.apiUrl}/Ai/summarize-request/${requestId}`,
      {}
    );
  }

  // A draft comment for the person to edit and post (nothing is posted by this call)
  draftReply(requestId: number, intent: ReplyDraftIntent): Observable<ApiResponse<AiReplyDraft>> {
    return this.http.post<ApiResponse<AiReplyDraft>>(
      `${environment.apiUrl}/Ai/draft-reply/${requestId}`,
      { intent }
    );
  }
}