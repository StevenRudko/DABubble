import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainChatDailyMessagesComponent } from './main-chat-daily-messages.component';

describe('MainChatDailyMessagesComponent', () => {
  let component: MainChatDailyMessagesComponent;
  let fixture: ComponentFixture<MainChatDailyMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainChatDailyMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainChatDailyMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

  // kommentar