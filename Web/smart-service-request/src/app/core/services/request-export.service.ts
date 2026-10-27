import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListQuery } from '../models/paged.model';

// CSV export of the request list (Admin). The API returns every request that matches
// the filters, not only the page on screen, and this service saves it as a file.
@Injectable({
  providedIn: 'root'
})
export class RequestExportService {

  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private readonly apiUrl = `${environment.apiUrl}/Request`;

  exportCsv(query: ListQuery): Observable<void> {

    // Filters and sort only; the API does its own paging
    let params = new HttpParams()
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

    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' }).pipe(
      map(blob => this.saveFile(blob)),
      catchError(error => this.toReadableError(error))
    );
  }

  private saveFile(blob: Blob): void {

    const url = URL.createObjectURL(blob);

    const link = this.document.createElement('a');
    link.href = url;
    link.download = `service-requests-${this.todayText()}.csv`;
    link.style.display = 'none';

    this.document.body.appendChild(link);
    link.click();
    link.remove();

    // Give the browser a moment to start the download before the address is released
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private todayText(): string {

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
  }

  // An error that comes back as a file is still JSON text: read the API's message from it
  private toReadableError(error: unknown): Observable<never> {

    if (error instanceof HttpErrorResponse && error.error instanceof Blob) {

      return from(error.error.text()).pipe(
        map(text => {
          try {
            return (JSON.parse(text) as { message?: string }).message;
          } catch {
            return undefined;
          }
        }),
        switchMap(message => throwError(() => new Error(message || 'Unable to export requests.')))
      );
    }

    return throwError(() => new Error('Unable to export requests.'));
  }
}