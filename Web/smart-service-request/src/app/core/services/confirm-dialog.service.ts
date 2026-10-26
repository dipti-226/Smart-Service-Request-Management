import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
  signal
} from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  // true = red confirm button (delete, deactivate, cancel...)
  danger?: boolean;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

/**
 * Styled replacement for the browser's confirm().
 * confirm() resolves to true when the user clicks the confirm button,
 * and to false for Cancel, Escape or a click outside the dialog.
 *
 * The dialog component is created automatically the first time confirm() is
 * called, so it works even if <app-confirm-dialog> was not added to app.html.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {

  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private resolver: ((result: boolean) => void) | null = null;
  private previousFocus: HTMLElement | null = null;

  // How many <app-confirm-dialog> components are currently on screen
  private hostCount = 0;
  private autoHost: ComponentRef<unknown> | null = null;

  // The dialog component shows itself whenever this has a value
  readonly options = signal<ConfirmDialogState | null>(null);

  // Called by the dialog component when it is created / destroyed
  registerHost(): () => void {
    this.hostCount++;
    return () => { this.hostCount--; };
  }

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {

    await this.ensureHost();

    // If one is already open, treat it as "No" before showing the new one
    this.finish(false);

    this.previousFocus = this.document.activeElement as HTMLElement | null;

    this.options.set({
      title: options.title,
      message: options.message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      danger: options.danger ?? false
    });

    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  respond(result: boolean): void {
    this.finish(result);
  }

  private finish(result: boolean): void {

    const resolve = this.resolver;
    this.resolver = null;

    if (this.options()) {
      this.options.set(null);
      // Give focus back to the button that opened the dialog
      this.previousFocus?.focus();
    }

    resolve?.(result);
  }

  // Make sure a dialog component exists on the page
  private async ensureHost(): Promise<void> {

    if (this.hostCount > 0 || this.autoHost) {
      return;
    }

    const { ConfirmDialogComponent } = await import(
      '../../shared/components/confirm-dialog/confirm-dialog'
    );

    // Re-check: another call may have created it while the file was loading
    if (this.hostCount > 0 || this.autoHost) {
      return;
    }

    const ref = createComponent(ConfirmDialogComponent, {
      environmentInjector: this.injector
    });

    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);

    this.autoHost = ref;
  }
}