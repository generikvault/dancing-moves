import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { buildActivatedRoute } from 'src/test-helper';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageComponent], providers: [
        NavService,
        SettingsService,
        MatSnackBar,
        {
          provide: ActivatedRoute,
          useValue: buildActivatedRoute(),
        }, {
          provide: HttpClient,
          useValue: {},
        }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
