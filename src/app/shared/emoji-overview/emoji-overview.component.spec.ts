import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiOverviewComponent } from './emoji-overview.component';

describe('EmojiOverviewComponent', () => {
  let component: EmojiOverviewComponent;
  let fixture: ComponentFixture<EmojiOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmojiOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
