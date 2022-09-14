import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class NavService {
  headlineObservable = new BehaviorSubject<string>("Dancing Moves");
  fragment?: string;
  constructor(private router: Router, private settings: SettingsService) {

    if (environment.isAndroid) {
      // @ts-ignore
      universalLinks.subscribe('eventName', (eventData: any) => {
        this.settings.log('Did launch application from the link', eventData.url);
        this.router.navigateByUrl(eventData.url);
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
