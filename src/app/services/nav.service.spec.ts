import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { NavService } from './nav.service';
import { SettingsService } from './settings.service';

describe('NavService', () => {
  let service: NavService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        MatSnackBar,
        {
          provide: Router,
          useValue: {},
        }, {
          provide: ActivatedRoute,
          useValue: {},
        }, {
          provide: HttpClient,
          useValue: {},
        }
      ]
    });
    service = TestBed.inject(NavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
