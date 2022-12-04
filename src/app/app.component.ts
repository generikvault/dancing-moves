import { Component, OnInit } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { environment } from 'src/environments/environment';
import { DataManagerService } from './services/data-manager.service';
import { SettingsService } from './services/settings.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'dancing-moves';

  constructor(private settingsService: SettingsService, private dataManagerService: DataManagerService) {
  }

  ngOnInit(): void {
    this.settingsService.fetchSettings();
    this.dataManagerService.start();
  }
}
