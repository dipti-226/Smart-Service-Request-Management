import { Component, inject, input, signal } from '@angular/core';

import { RequestExportService } from '../../../core/services/request-export.service';
import { PagedListState } from '../../../core/utils/paged-list-state';

// "Export CSV" button for a request list. It exports every request that matches the
// list's current search, filters and sort order (all pages, not only the visible one).
@Component({
  selector: 'app-export-csv-button',
  standalone: true,
  templateUrl: './export-csv-button.html',
  styleUrl: './export-csv-button.css'
})
export class ExportCsvButtonComponent {

  private readonly exportService = inject(RequestExportService);

  // The list's filter / sort values
  state = input.required<PagedListState>();

  disabled = input(false);

  isExporting = signal(false);
  errorMessage = signal('');

  export(): void {

    if (this.isExporting()) {
      return;
    }

    this.isExporting.set(true);
    this.errorMessage.set('');

    this.exportService.exportCsv(this.state().toQuery()).subscribe({

      next: () => this.isExporting.set(false),

      error: (error: Error) => {
        this.isExporting.set(false);
        this.errorMessage.set(error.message || 'Unable to export requests.');
      }
    });
  }
}