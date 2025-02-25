import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarPickerOverlayComponent } from './avatar-picker-overlay.component';

describe('AvatarPickerOverlayComponent', () => {
  let component: AvatarPickerOverlayComponent;
  let fixture: ComponentFixture<AvatarPickerOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarPickerOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarPickerOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
