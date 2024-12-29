import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPeopleDialogSidebarComponent } from './add-people-dialog-sidebar.component';

describe('AddPeopleDialogSidebarComponent', () => {
  let component: AddPeopleDialogSidebarComponent;
  let fixture: ComponentFixture<AddPeopleDialogSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPeopleDialogSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPeopleDialogSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
