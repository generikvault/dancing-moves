import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { buildDataManagerService, buildSettingsService } from 'src/test-helper';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

import { MovePageComponent } from './move-page.component';

describe('MovePageComponent', () => {
  let component: MovePageComponent;
  let fixture: ComponentFixture<MovePageComponent>;
  const navService: jasmine.SpyObj<NavService> = jasmine.createSpyObj<NavService>('NavService',
    ['navigate', 'openWebsiteIfEasterEggFound'], { headlineObservable: new BehaviorSubject<string>("Dancing Moves") });
  const activatedRoute: jasmine.SpyObj<ActivatedRoute> = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', [],
    { params: of(), queryParams: of(), paramMap: of() });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatAutocompleteModule],
      declarations: [MovePageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        }, {
          provide: DataManagerService,
          useValue: buildDataManagerService(),
        }, {
          provide: SettingsService,
          useValue: buildSettingsService(),
        }, {
          provide: NavService,
          useValue: navService,
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
