import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RequestComment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Request`;

  getComments(requestId: number): Observable<ApiResponse<RequestComment[]>> {
    return this.http.get<ApiResponse<RequestComment[]>>(
      `${this.apiUrl}/${requestId}/comments`
    );
  }

  addComment(requestId: number, commentText: string): Observable<ApiResponse<RequestComment>> {
    return this.http.post<ApiResponse<RequestComment>>(
      `${this.apiUrl}/${requestId}/comments`,
      { commentText }
    );
  }
}