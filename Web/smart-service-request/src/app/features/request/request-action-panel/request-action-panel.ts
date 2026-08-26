import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import { RequestDetailsComponent } from '../dynamic-actions/request-details/request-details';
import { UpdateStatusComponent } from '../dynamic-actions/update-status/update-status';
import { TechnicianActionComponent } from '../dynamic-actions/technician-action/technician-action';
import { RequestCardComponent } from '../../../shared/components/request-card/request-card';
import { RequestDetails } from '../models/request-details.model';

@Component({
  selector: 'app-request-action-panel',
  standalone: true,
  imports: [RequestCardComponent],
  templateUrl: './request-action-panel.html',
  styleUrl: './request-action-panel.css'
})
export class RequestActionPanelComponent {

  @Input()
request!: RequestDetails;

@Output()
actionSelected = new EventEmitter<string>();

@ViewChild('dynamicComponent', {
  read: ViewContainerRef
})
dynamicComponent!: ViewContainerRef;

selectedAction = '';

assignedTechnician = '';

  onActionChange(action: string): void {

  this.selectedAction = action;

  this.dynamicComponent.clear();

  this.actionSelected.emit(action);

  if (action === 'details') {
    this.loadRequestDetails();
  }

  if (action === 'status') {
    this.loadUpdateStatus();
  }

  if (action === 'technician') {
    this.loadTechnicianAction();
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

      this.request = {
        ...this.request,
        status: newStatus
      };

      console.log(
        'Status changed:',
        newStatus
      );
    }
  );
}

  private loadTechnicianAction(): void {

  const componentRef =
    this.dynamicComponent.createComponent(
      TechnicianActionComponent
    );

  componentRef.setInput(
    'request',
    this.request
  );

  componentRef.instance.technicianAssigned.subscribe(
    (technician: string) => {

      this.assignedTechnician = technician;

      console.log(
        'Technician assigned:',
        technician
      );
    }
  );
}
}