import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelDialogComponent } from './create-channel-dialog.component';

describe('ChannelDialogComponent', () => {
  let component: ChannelDialogComponent;
  let fixture: ComponentFixture<ChannelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
