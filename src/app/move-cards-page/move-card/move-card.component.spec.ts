import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { AnchorService } from 'src/app/app-routing-module/anchor.service';
import { MoveDto } from 'src/app/model/move-dto';
import { DataManagerService } from 'src/app/services/data-manager.service';
import { NavService } from 'src/app/services/nav.service';
import { SettingsService } from 'src/app/services/settings.service';
import { buildActivatedRoute, buildDataManagerService, buildNavService } from 'src/test-helper';

import { MoveCardComponent } from './move-card.component';

describe('MovecardComponent', () => {
  let component: MoveCardComponent;
  let fixture: ComponentFixture<MoveCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveCardComponent],
      providers: [
        SettingsService,
        AnchorService,
        MatSnackBar,
        {
          provide: ActivatedRoute,
          useValue: buildActivatedRoute(),
        },
        {
          provide: NavService,
          useValue: buildNavService(),
        }, {
          provide: DataManagerService,
          useValue: buildDataManagerService(),
        }, {
          provide: HttpClient,
          useValue: {},
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
