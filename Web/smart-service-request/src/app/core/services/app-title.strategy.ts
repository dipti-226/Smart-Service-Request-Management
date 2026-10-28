import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'DeskPilot';

/**
 * Builds the browser tab title from the "title" set on each route:
 * "My Requests | DeskPilot". Routes without a title show the app name only.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {

  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {

    const pageTitle = this.buildTitle(snapshot);

    this.title.setTitle(
      pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME
    );
  }
}