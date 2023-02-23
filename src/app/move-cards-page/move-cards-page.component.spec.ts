import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { buildDataManagerService } from 'src/test-helper';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';

import { MoveCardsPageComponent } from './move-cards-page.component';

describe('MoveCardsPageComponent', () => {
  let component: MoveCardsPageComponent;
  let fixture: ComponentFixture<MoveCardsPageComponent>;
  const navService: jasmine.SpyObj<NavService> = jasmine.createSpyObj<NavService>('NavService',
    ['navigate', 'openWebsiteIfEasterEggFound'], { headlineObservable: new BehaviorSubject<string>("Dancing Moves") });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveCardsPageComponent],
      providers: [{
        provide: DataManagerService,
        useValue: buildDataManagerService(),
      }, {
        provide: NavService,
        useValue: navService,
      }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveCardsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
