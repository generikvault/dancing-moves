import { Component, OnInit } from '@angular/core';
import { delay, firstValueFrom, interval } from 'rxjs';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';

@Component({
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  constructor(private navService: NavService) {
    this.navService.headlineObservable.next("Home");
  }

  ngOnInit(): void {
  }

  async takeTour() {
    await this.navService.navigate(['dances']);
    await firstValueFrom(interval(1000))
    await this.navService.navigate(['courses']);
    await firstValueFrom(interval(1000))
    await this.navService.navigate(['moves']);
    await firstValueFrom(interval(1000))
    await this.navService.navigate(['relations']);
    await firstValueFrom(interval(1000))
    await this.navService.navigate(['settings']);
    await firstValueFrom(interval(1000))
    await this.navService.navigate(['moves']);
  }

}
