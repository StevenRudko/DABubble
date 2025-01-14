import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { ChatService } from '../../service/chat.service';

interface UserData {
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'away' | 'offline';
  uid: string;
}

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
})
export class ProfileOverviewComponent {
  /**
   * Initializes the profile overview component
   */
  constructor(
    public dialogRef: MatDialogRef<ProfileOverviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserData,
    private chatService: ChatService,
    private dialog: MatDialog
  ) {}

  /**
   * Closes the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Gets localized status text
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'Aktiv',
      away: 'Abwesend',
      offline: 'Offline',
    };
    return statusMap[status] || '';
  }

  /**
   * Opens direct message with user
   */
  sendDirectMessage(): void {
    this.dialogRef.close();
    this.dialog.closeAll();

    if (this.data.uid) {
      this.chatService.selectDirectMessage(this.data.uid);
    }
  }
}
