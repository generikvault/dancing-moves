import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NavService } from './nav.service';

import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  const activatedRoute: jasmine.SpyObj<ActivatedRoute> = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', [], { params: of() });
  const navService: jasmine.SpyObj<NavService> = jasmine.createSpyObj<NavService>('NavService',
    ['navigate']);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MatSnackBar,
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        }, {
          provide: HttpClient,
          useValue: {},
        }, {
          provide: NavService,
          useValue: navService,
        },
      ]
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
