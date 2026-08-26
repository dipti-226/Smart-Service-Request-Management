import { Component } from '@angular/core';

import { RequestActionPanelComponent } from '../request-action-panel/request-action-panel';

import { RequestDetails } from '../models/request-details.model';

@Component({
  selector: 'app-request-components-demo',
  standalone: true,
  imports: [RequestActionPanelComponent],
  templateUrl: './request-components-demo.html',
  styleUrl: './request-components-demo.css'
})
export class RequestComponentsDemoComponent {

  request: RequestDetails = {
    id: 101,
    title: 'Printer not working',
    description: 'The office printer is not responding.',
    status: 'Pending'
  };

}