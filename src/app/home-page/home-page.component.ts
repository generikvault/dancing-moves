import { Component, OnInit } from '@angular/core';
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

}
