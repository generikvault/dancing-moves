import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { MoveDto } from 'src/app/model/move-dto';
import { RelationParams } from 'src/app/model/relation-params';
import { DataManagerService } from 'src/app/services/data-manager.service';
import { NavService } from 'src/app/services/nav.service';

import { MoveCardComponent } from './move-card.component';

describe('MovecardComponent', () => {
  let component: MoveCardComponent;
  let fixture: ComponentFixture<MoveCardComponent>;
  const navService: jasmine.SpyObj<NavService> = jasmine.createSpyObj<NavService>('NavService',
    ['navigate', 'openWebsiteIfEasterEggFound'], { headlineObservable: new BehaviorSubject<string>("Dancing Moves") });
  const dataManagerService: jasmine.SpyObj<DataManagerService> = jasmine.createSpyObj<DataManagerService>('DataManagerService',
    {
      start: undefined, loading: undefined, getMove: undefined, getGroupedMoveNames: of(), getMovesNamesOf: undefined, getMovesNames: undefined,
      getDanceNames: undefined, getCourseNames: undefined, getTypes: undefined, getRelationPairs: of(), saveOrCreate: undefined
    }, { relationsSelectionObservable: new BehaviorSubject<RelationParams>({} as RelationParams) });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveCardComponent],
      providers: [{
        provide: NavService,
        useValue: navService,
      }, {
        provide: DataManagerService,
        useValue: dataManagerService,
      }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveCardComponent);
    component = fixture.componentInstance;
    component.moveDto = { name: 'foo' } as MoveDto;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
