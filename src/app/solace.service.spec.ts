import { TestBed } from '@angular/core/testing';

import { SolaceService } from './solace.service';

describe('SolaceService', () => {
  let service: SolaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
