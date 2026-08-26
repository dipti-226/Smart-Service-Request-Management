import { Component, Input } from '@angular/core';

import { RequestDetails } from '../../models/request-details.model';

@Component({
  selector: 'app-request-details',
  standalone: true,
  templateUrl: './request-details.html',
  styleUrl: './request-details.css'
})
export class RequestDetailsComponent {

  @Input() request!: RequestDetails;
}