import {Component,DestroyRef,ElementRef,afterRenderEffect,inject,viewChild} from '@angular/core';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {

  protected readonly dialog = inject(ConfirmDialogService);

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');
  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  constructor() {
    // Tell the service a dialog is on the page
    inject(DestroyRef).onDestroy(this.dialog.registerHost());

    // When the dialog appears, put focus on the safe choice (Cancel)
    afterRenderEffect(() => {
      this.cancelBtn()?.nativeElement.focus();
    });
  }

  onKeydown(event: KeyboardEvent): void {

    if (event.key === 'Escape') {
      event.preventDefault();
      this.dialog.respond(false);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    // Keep Tab inside the dialog
    const first = this.cancelBtn()?.nativeElement;
    const last = this.confirmBtn()?.nativeElement;

    if (!first || !last) {
      return;
    }

    const active = document.activeElement;

    if (active !== first && active !== last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}