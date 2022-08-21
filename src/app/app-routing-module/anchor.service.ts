import { LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

/**
 * Service to handle links generated through markdown parsing.
 * The following `RouterModule` configuration is required to enabled anchors
 * to be scrolled to when URL has a fragment via the Angular router:
 * ```
 * RouterModule.forRoot(routes, {
 *  anchorScrolling: 'enabled',           // scrolls to the anchor element when the URL has a fragment
 *  scrollOffset: [0, 64],                // scroll offset when scrolling to an element (optional)
 *  scrollPositionRestoration: 'enabled', // restores the previous scroll position on backward navigation
 * })
 * ```
 * _Refer to [Angular Router documentation](https://angular.io/api/router/ExtraOptions#anchorScrolling) for more details._
 */
@Injectable({ providedIn: 'root' })
export class AnchorService {

    constructor(
        private router: NavService, private settings: SettingsService
    ) { }

    /**
     * Intercept clicks on `HTMLAnchorElement` to use `Router.navigate()`
     * when `href` is an internal URL not handled by `routerLink` directive.
     * @param event The event to evaluated for link click.
     */
    interceptClick(event: Event) {
        this.settings.log('click event:', event);
        const element = event.target;
        if (!(element instanceof HTMLAnchorElement)) {
            return;
        }
        const href = element.getAttribute('href') ?? '';
        if (this.isExternalUrl(href) || this.isRouterLink(element)) {
            return;
        }
        this.navigate(href);
        event.preventDefault();
    }

    /**
     * Navigate to URL using angular `Router`.
     * @param url Destination path to navigate to.
     */
    navigate(url: string) {
        this.settings.log('navigate:', url);
        this.router.navigate([url]);
    }

    private isExternalUrl(url: string): boolean {
        return /^(?!http(s?):\/\/).+$/.exec(url) == null;
    }

    private isRouterLink(element: HTMLAnchorElement): boolean {
        return element.getAttributeNames().some(n => n.startsWith('_ngcontent'));
    }
}