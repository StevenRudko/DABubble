import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInfoDialogComponent } from './channel-info-dialog.component';

describe('ChannelInfoDialogComponent', () => {
  let component: ChannelInfoDialogComponent;
  let fixture: ComponentFixture<ChannelInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelInfoDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
