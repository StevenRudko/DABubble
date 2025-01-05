import { TestBed } from '@angular/core/testing';

import { UserAccountInfoService } from './user-account-info.service';

describe('UserAccountInfoService', () => {
  let service: UserAccountInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserAccountInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
