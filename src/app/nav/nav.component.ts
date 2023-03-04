import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  devMode = !environment.production;
  headline = "Dancing Moves"

  isHandset$: Observable<boolean> = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet])
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver,
    private dataManager: DataManagerService,
    private settingsService: SettingsService, private navService: NavService) {

  }
  async ngOnInit() {
    this.navService.headlineObservable.subscribe(headline => this.headline = headline);
    await this.settingsService.loading();
  }

  normalize() {
    this.dataManager.normalize();
  }

  createNew(): Promise<boolean> {
    if (this.navService.getPath().includes('course')) {
      return this.navService.navigate(['course/new']);
    }
    if (this.navService.getPath().includes('dance')) {
      return this.navService.navigate(['dance/new']);
    }
    return this.navService.navigate(['move/new']);
  }

  navigate(path: string): Promise<boolean> {
    return this.navService.navigate([path]);
  }

  syncData() {
    this.dataManager.api_get();
  }
}
