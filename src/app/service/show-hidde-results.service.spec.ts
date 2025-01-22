import { TestBed } from '@angular/core/testing';

import { ShowHiddeResultsService } from './show-hidde-results.service';

describe('ShowHiddeResultsService', () => {
  let service: ShowHiddeResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShowHiddeResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
