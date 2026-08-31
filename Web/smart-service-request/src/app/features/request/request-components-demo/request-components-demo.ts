import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { RequestActionPanelComponent }
  from '../request-action-panel/request-action-panel';

import { RequestService }
  from '../../../core/services/request.service';

import { AdvancedRequest }
  from '../../../core/models/request.model';

@Component({
  selector: 'app-request-components-demo',
  standalone: true,
  imports: [RequestActionPanelComponent],
  templateUrl: './request-components-demo.html',
  styleUrl: './request-components-demo.css'
})
export class RequestComponentsDemoComponent
  implements OnInit {

  private readonly requestService =
    inject(RequestService);

  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);

  request: AdvancedRequest | null = null;

  loading = false;

  errorMessage = '';

  ngOnInit(): void {
    this.loadRequest();
  }

  private loadRequest(): void {

    const requestId = 4;

    this.loading = true;
    this.errorMessage = '';

    this.requestService
      .getAdvancedRequestById(requestId)
      .subscribe({

        next: (response) => {

          console.log(
            'Advanced request response:',
            response
          );

          if (
            response?.success &&
            response.data
          ) {

            this.request =
              response.data;

            this.errorMessage = '';

          } else {

            this.errorMessage =
              response?.message ||
              'Request could not be loaded.';
          }

          this.loading = false;

          /*
           * Notify Angular that component state
           * has changed after the async HTTP response.
           */
          this.changeDetectorRef.markForCheck();
        },

        error: (error) => {

          console.error(
            'Error loading request:',
            error
          );

          this.loading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load request from server.';

          /*
           * Notify Angular about the state change
           * in the error path as well.
           */
          this.changeDetectorRef.markForCheck();
        }
      });
  }
}