import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { MemberOverviewComponent } from './member-overview/member-overview.component';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent {
  constructor(private dialog: MatDialog) {}

  openMemberDialog() {
    this.dialog.open(MemberOverviewComponent, {
      width: '320px',
      position: { top: '160px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }
}
