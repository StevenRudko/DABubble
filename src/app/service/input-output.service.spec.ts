import { TestBed } from '@angular/core/testing';

import { InputOutput } from './input-output.service';

describe('ServiceService', () => {
  let service: InputOutput;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputOutput);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
