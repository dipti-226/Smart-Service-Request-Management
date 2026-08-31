import {Component,EventEmitter,Input,Output,ViewChild,ViewContainerRef,inject} from '@angular/core';

import { RequestDetailsComponent } from '../dynamic-actions/request-details/request-details';
import { UpdateStatusComponent } from '../dynamic-actions/update-status/update-status';
import { TechnicianActionComponent } from '../dynamic-actions/technician-action/technician-action';

import { RequestCardComponent } from '../../../shared/components/request-card/request-card';

import {
  AdvancedRequest,
  Technician
} from '../../../core/models/request.model';

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

  @Input()
  request!: AdvancedRequest;

  @Output()
  actionSelected =
    new EventEmitter<string>();

  @ViewChild('dynamicComponent', {
    read: ViewContainerRef
  })
  dynamicComponent!: ViewContainerRef;

  selectedAction = '';

  technicians: Technician[] = [];

  loadingTechnicians = false;

  actionError = '';

  actionSuccess = '';


  onActionChange(action: string): void {

    this.selectedAction = action;

    this.actionError = '';
    this.actionSuccess = '';

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
      this.request
    );
  }


  private loadUpdateStatus(): void {

    const componentRef =
      this.dynamicComponent.createComponent(
        UpdateStatusComponent
      );

    componentRef.setInput(
      'request',
      this.request
    );

    componentRef.instance.statusChanged.subscribe(
      (newStatus: string) => {

        this.updateStatus(newStatus);

      }
    );
  }


  private loadTechnicians(): void {

    this.loadingTechnicians = true;

    this.requestService
      .getTechnicians()
      .subscribe({

        next: (response) => {

          this.loadingTechnicians = false;

          if (
            !response.success ||
            !response.data
          ) {

            this.actionError =
              response.message ||
              'Unable to load technicians.';

            return;
          }

          this.technicians = response.data;

          const componentRef =
            this.dynamicComponent.createComponent(
              TechnicianActionComponent
            );

          componentRef.setInput(
            'request',
            this.request
          );

          componentRef.setInput(
            'technicians',
            this.technicians
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

          this.loadingTechnicians = false;

          console.error(
            'Error loading technicians:',
            error
          );

          this.actionError =
            'Unable to load technicians.';
        }
      });
  }


  private updateStatus(
    newStatus: string
  ): void {

    this.actionError = '';
    this.actionSuccess = '';

    this.requestService
      .updateRequestStatus(
        this.request.requestId,
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

            this.request =
              response.data;

            this.actionSuccess =
              'Request status updated successfully.';

            /*
             * Recreate the selected component
             * with the updated request.
             */
            this.dynamicComponent.clear();

            this.loadUpdateStatus();

          } else {

            this.actionError =
              response.message ||
              'Unable to update request status.';
          }
        },

        error: (error) => {

          console.error(
            'Error updating status:',
            error
          );

          this.actionError =
            error?.error?.message ||
            'Unable to update request status.';
        }
      });
  }


  private assignTechnician(
    technicianId: number
  ): void {

    this.actionError = '';
    this.actionSuccess = '';

    this.requestService
      .assignTechnician(
        this.request.requestId,
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

            this.request =
              response.data;

            this.actionSuccess =
              'Technician assigned successfully.';

            /*
             * Recreate the technician component
             * using the updated request.
             */
            this.dynamicComponent.clear();

            this.loadTechnicians();

          } else {

            this.actionError =
              response.message ||
              'Unable to assign technician.';
          }
        },

        error: (error) => {

          console.error(
            'Error assigning technician:',
            error
          );

          this.actionError =
            error?.error?.message ||
            'Unable to assign technician.';
        }
      });
  }
}