import { Injectable, NgZone } from '@angular/core';
import { Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SettingsService } from './settings.service';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class NavService {
  headlineObservable = new BehaviorSubject<string>("Dancing Moves");
  fragment?: string;
  constructor(private router: Router, private settings: SettingsService, private zone: NgZone) {

    if (environment.isAndroid) {
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.zone.run(() => {
          // Example url: https://beerswift.app/tabs/tab2
          // slug = /tabs/tab2
          const slug = event.url.split(".app").pop();
          if (slug) {
            this.settings.log('Did launch application from the link', slug);
            this.router.navigateByUrl(slug.replace('https://mvolkert.github.io/dancing-moves', ''));
          }
          // If no match, do nothing - let regular routing
          // logic take over
        });
      });
    }
  }

  navigate(route: string[] = [], queryParams: Params | undefined = undefined, fragment?: string): Promise<boolean> {
    if (route.length == 0 && environment.isAndroid) {
      return Promise.resolve(true);
    }
    if (queryParams) {
      return this.router.navigate(route, { queryParams: queryParams, queryParamsHandling: 'merge', fragment: fragment });
    }
    return this.router.navigate(route, { queryParamsHandling: 'merge', fragment: fragment });
  }

  getPath(): string {
    return document.location.pathname;
  }



  openWebsiteIfEasterEggFound(name: string) {
    const nameNormalized = name?.toLocaleLowerCase().replace(/\s/g, '').replace(/-/g, '');
    if (nameNormalized === "supersecretmoves") {
      document.location.href = 'https://www.super-secret-moves.com/';
    } else if (nameNormalized === "tanzstudioschlegl") {
      document.location.href = 'https://tanzstudio-schlegl.de/';
    }
  }

}
