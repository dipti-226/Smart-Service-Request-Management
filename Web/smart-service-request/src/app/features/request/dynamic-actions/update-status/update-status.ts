import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AdvancedRequest } from '../../../../core/models/request.model';
@Component({
  selector: 'app-update-status',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './update-status.html',
  styleUrl: './update-status.css'
})

export class UpdateStatusComponent {

  @Input() request!: AdvancedRequest;

  @Output() statusChanged = new EventEmitter<string>();

  selectedStatus = '';

  updateStatus(): void {
    if (!this.selectedStatus) {
      return;
    }

    this.statusChanged.emit(this.selectedStatus);
  }
}