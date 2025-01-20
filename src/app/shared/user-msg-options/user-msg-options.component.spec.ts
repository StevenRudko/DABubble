import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMsgOptionsComponent } from './user-msg-options.component';

describe('UserMsgOptionsComponent', () => {
  let component: UserMsgOptionsComponent;
  let fixture: ComponentFixture<UserMsgOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMsgOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMsgOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
