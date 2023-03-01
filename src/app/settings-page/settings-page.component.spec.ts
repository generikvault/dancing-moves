import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ApiclientService } from '../services/apiclient.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let component: SettingsPageComponent;
  let fixture: ComponentFixture<SettingsPageComponent>;
  const settingsService: jasmine.SpyObj<SettingsService> = jasmine.createSpyObj<SettingsService>('SettingsService',
    ['fetchSettings', 'loading', 'initSettings']);
  const navService: jasmine.SpyObj<NavService> = jasmine.createSpyObj<NavService>('NavService',
    ['navigate', 'openWebsiteIfEasterEggFound'], { headlineObservable: new BehaviorSubject<string>("Dancing Moves") });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SettingsPageComponent], providers: [
        {
          provide: SettingsService,
          useValue: settingsService,
        }, {
          provide: NavService,
          useValue: navService,
        }, {
          provide: ApiclientService,
          useValue: {},
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
