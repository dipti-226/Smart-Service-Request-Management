import {Component,EventEmitter,Output,ViewChild,ViewContainerRef,inject,input,linkedSignal,signal} from '@angular/core';

import { RequestDetailsComponent } from '../dynamic-actions/request-details/request-details';
import { UpdateStatusComponent } from '../dynamic-actions/update-status/update-status';
import { TechnicianActionComponent } from '../dynamic-actions/technician-action/technician-action';

import { RequestCardComponent } from '../../../shared/components/request-card/request-card';

import {AdvancedRequest,Technician} from '../../../core/models/request.model';

import { RequestService } from '../../../core/services/request.service';

@Component({
  selector: 'app-request-action-panel',
  standalone: true,
  imports: [RequestCardComponent],
  templateUrl: './request-action-panel.html',
  styleUrl: './request-action-panel.css'
})
export class RequestActionPanelComponent {

  private readonly requestService =
    inject(RequestService);

  // Request received from the parent page
  request = input.required<AdvancedRequest>();

  // Working copy: starts from the input and is replaced
  // after a status update or technician assignment
  currentRequest = linkedSignal(() => this.request());

  @Output()
  actionSelected =
    new EventEmitter<string>();

  @ViewChild('dynamicComponent', {
    read: ViewContainerRef
  })
  dynamicComponent!: ViewContainerRef;

  selectedAction = signal('');

  technicians = signal<Technician[]>([]);

  loadingTechnicians = signal(false);

  actionError = signal('');

  actionSuccess = signal('');


  onActionChange(action: string): void {

    this.selectedAction.set(action);

    this.actionError.set('');
    this.actionSuccess.set('');

    this.dynamicComponent.clear();

    this.actionSelected.emit(action);

    switch (action) {

      case 'details':
        this.loadRequestDetails();
        break;

      case 'status':
        this.loadUpdateStatus();
        break;

      case 'technician':
        this.loadTechnicians();
        break;
    }
  }


  private loadRequestDetails(): void {

    const componentRef =
      this.dynamicComponent.createComponent(
        RequestDetailsComponent
      );

    componentRef.setInput(
      'request',
      this.currentRequest()
    );
  }


    private loadUpdateStatus(): void {

    this.requestService
      .getAllowedStatuses(this.currentRequest().requestId)
      .subscribe({

        next: (response) => {

          // The user may have picked another action while
          // this call was running.
          if (this.selectedAction() !== 'status') {
            return;
          }

          // Avoid two copies if the button was clicked twice.
          this.dynamicComponent.clear();

          const componentRef =
            this.dynamicComponent.createComponent(
              UpdateStatusComponent
            );

          componentRef.setInput(
            'request',
            this.currentRequest()
          );

          componentRef.setInput(
            'allowedStatuses',
            response.data ?? []
          );

          componentRef.instance.statusChanged.subscribe(
            (newStatus: string) => {

              this.updateStatus(newStatus);

            }
          );
        },

        error: (error) => {

          console.error(
            'Error loading allowed statuses:',
            error
          );

          this.actionError.set(
            error?.error?.message ||
            'Unable to load allowed statuses.'
          );
        }
      });
  }

  private loadTechnicians(): void {

    this.loadingTechnicians.set(true);

    this.requestService
      .getTechnicians()
      .subscribe({

        next: (response) => {

          this.loadingTechnicians.set(false);

          if (
            !response.success ||
            !response.data
          ) {

            this.actionError.set(
              response.message ||
              'Unable to load technicians.'
            );

            return;
          }

          this.technicians.set(response.data);

          const componentRef =
            this.dynamicComponent.createComponent(
              TechnicianActionComponent
            );

          componentRef.setInput(
            'request',
            this.currentRequest()
          );

          componentRef.setInput(
            'technicians',
            this.technicians()
          );

          componentRef.instance.technicianAssigned.subscribe(
            (technicianId: number) => {

              this.assignTechnician(
                technicianId
              );

            }
          );
        },

        error: (error) => {

          this.loadingTechnicians.set(false);

          console.error(
            'Error loading technicians:',
            error
          );

          this.actionError.set(
            'Unable to load technicians.'
          );
        }
      });
  }


  private updateStatus(
    newStatus: string
  ): void {

    this.actionError.set('');
    this.actionSuccess.set('');

    this.requestService
      .updateRequestStatus(
        this.currentRequest().requestId,
        {
          status: newStatus
        }
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            response.data
          ) {

            this.currentRequest.set(
              response.data
            );

            this.actionSuccess.set(
              'Request status updated successfully.'
            );

            /*
             * Recreate the selected component
             * with the updated request.
             */
            this.dynamicComponent.clear();

            this.loadUpdateStatus();

          } else {

            this.actionError.set(
              response.message ||
              'Unable to update request status.'
            );
          }
        },

        error: (error) => {

          console.error(
            'Error updating status:',
            error
          );

          this.actionError.set(
            error?.error?.message ||
            'Unable to update request status.'
          );
        }
      });
  }


  private assignTechnician(
    technicianId: number
  ): void {

    this.actionError.set('');
    this.actionSuccess.set('');

    this.requestService
      .assignTechnician(
        this.currentRequest().requestId,
        {
          technicianId: technicianId
        }
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            response.data
          ) {

            this.currentRequest.set(
              response.data
            );

            this.actionSuccess.set(
              'Technician assigned successfully.'
            );

            /*
             * Recreate the technician component
             * using the updated request.
             */
            this.dynamicComponent.clear();

            this.loadTechnicians();

          } else {

            this.actionError.set(
              response.message ||
              'Unable to assign technician.'
            );
          }
        },

        error: (error) => {

          console.error(
            'Error assigning technician:',
            error
          );

          this.actionError.set(
            error?.error?.message ||
            'Unable to assign technician.'
          );
        }
      });
  }
}