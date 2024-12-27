import { Component, ViewChild, ElementRef } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { MemberOverviewComponent } from './member-overview/member-overview.component';
import { AddPeopleComponent } from './add-people/add-people.component';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent {
  constructor(private dialog: MatDialog) {}
  @ViewChild('memberListBtn') memberListBtn!: ElementRef;
  @ViewChild('addPeopleBtn') addPeopleBtn!: ElementRef;

  openMemberDialog() {
    const btnRect = this.memberListBtn.nativeElement.getBoundingClientRect();
    this.dialog.open(MemberOverviewComponent, {
      position: {
        top: '160px',
        left: `${btnRect.right - 340}px`,
      },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }

  openAddPeopleDialog() {
    const btnRect = this.addPeopleBtn.nativeElement.getBoundingClientRect();
    this.dialog.open(AddPeopleComponent, {
      position: {
        top: '160px',
        left: `${btnRect.right - 420}px`,
      },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }
}
