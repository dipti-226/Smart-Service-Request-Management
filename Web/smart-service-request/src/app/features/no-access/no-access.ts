import { Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-no-access',
  standalone: true,
  template: `
    <div class="box">
      <h2>No screen available yet</h2>
      <p>
        Your role ({{ role }}) does not have a screen in this application yet.
        Please contact the administrator.
      </p>
    </div>
  `,
  styles: [`
    .box { max-width: 520px; margin: 60px auto; padding: 32px; text-align: center; background: #fff; border: 1px solid #eef0f3; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    h2 { margin: 0 0 12px; color: #111827; }
    p { margin: 0; color: #6b7280; line-height: 1.5; }
  `]
})
export class NoAccessComponent {
  role = inject(AuthService).getRole();
}