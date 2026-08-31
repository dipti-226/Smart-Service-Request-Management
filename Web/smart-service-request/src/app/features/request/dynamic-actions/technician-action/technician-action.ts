import {Component,EventEmitter,Input,Output} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  AdvancedRequest,
  Technician
} from '../../../../core/models/request.model';

@Component({
  selector: 'app-technician-action',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './technician-action.html',
  styleUrl: './technician-action.css'
})
export class TechnicianActionComponent {

  @Input()
  request!: AdvancedRequest;

  @Input()
  technicians: Technician[] = [];

  @Output()
  technicianAssigned =
    new EventEmitter<number>();

  selectedTechnicianId: number | null = null;

  assignTechnician(): void {

    if (!this.selectedTechnicianId) {
      return;
    }

    this.technicianAssigned.emit(
      this.selectedTechnicianId
    );
  }
}