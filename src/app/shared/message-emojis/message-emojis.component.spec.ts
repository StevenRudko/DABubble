import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageEmojisComponent } from './message-emojis.component';

describe('MessageEmojisComponent', () => {
  let component: MessageEmojisComponent;
  let fixture: ComponentFixture<MessageEmojisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageEmojisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageEmojisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
