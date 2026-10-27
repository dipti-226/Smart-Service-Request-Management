import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdvancedRequest } from '../../../core/models/request.model';
import { OpenAgeComponent } from '../open-age/open-age';

// Read-only request details. Any content placed between the tags
// <app-request-detail-view> ... </app-request-detail-view> is shown
// in the sections area below the details.
@Component({
  selector: 'app-request-detail-view',
  standalone: true,
  imports: [DatePipe, OpenAgeComponent],
  templateUrl: './request-detail-view.html',
  styleUrl: './request-detail-view.css'
})
export class RequestDetailViewComponent {

  request = input.required<AdvancedRequest>();
}