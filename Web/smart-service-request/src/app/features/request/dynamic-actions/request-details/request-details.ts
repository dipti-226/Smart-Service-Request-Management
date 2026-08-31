import { Component, Input } from '@angular/core';

import { AdvancedRequest } from '../../../../core/models/request.model';

@Component({
  selector: 'app-request-details',
  standalone: true,
  templateUrl: './request-details.html',
  styleUrl: './request-details.css'
})
export class RequestDetailsComponent {

  @Input() request!: AdvancedRequest;

}