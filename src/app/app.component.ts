import { Component, OnInit } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { environment } from 'src/environments/environment';
import { DataManagerService } from './services/data-manager.service';
import { NavService } from './services/nav.service';
import { SettingsService } from './services/settings.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'dancing-moves';

  constructor(private settingsService: SettingsService, private dataManagerService: DataManagerService, private navService: NavService) {
  }

  async ngOnInit(): Promise<void> {
    this.settingsService.fetchSettings();
    this.dataManagerService.start();
    if (environment.isAndroid) {
      const currentPath = this.navService.getRelativePath();
      await this.navService.navigate(['dances']);
      await this.navService.navigate(['courses']);
      await this.navService.navigate(['moves']);
      await this.navService.navigate(['relations']);
      await this.navService.navigate(['settings']);
      await this.navService.navigate(['moves']);
      console.log('currentPath', currentPath);
      if (currentPath) await this.navService.navigate([currentPath]);
    }
  }
}
