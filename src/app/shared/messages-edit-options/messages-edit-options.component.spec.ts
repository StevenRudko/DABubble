import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesEditOptionsComponent } from './messages-edit-options.component';

describe('MessagesEditOptionsComponent', () => {
  let component: MessagesEditOptionsComponent;
  let fixture: ComponentFixture<MessagesEditOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesEditOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesEditOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
