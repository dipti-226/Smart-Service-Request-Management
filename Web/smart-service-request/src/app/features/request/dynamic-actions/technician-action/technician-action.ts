import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RequestDetails } from '../../models/request-details.model';
@Component({
  selector: 'app-technician-action',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './technician-action.html',
  styleUrl: './technician-action.css'
})

export class TechnicianActionComponent {

  @Input() request!: RequestDetails;

  @Output() technicianAssigned =
    new EventEmitter<string>();

  selectedTechnician = '';

  assignTechnician(): void {
    if (!this.selectedTechnician) {
      return;
    }

    this.technicianAssigned.emit(
      this.selectedTechnician
    );
  }
}