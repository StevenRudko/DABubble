// In profile-overview.component.ts

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
  constructor(
    public dialogRef: MatDialogRef<ProfileOverviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserData,
    private chatService: ChatService,
    private dialog: MatDialog // MatDialog Service hinzugefügt
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'away':
        return 'Abwesend';
      case 'offline':
        return 'Offline';
      default:
        return '';
    }
  }

  sendDirectMessage(): void {
    // Dialog schließen
    this.dialogRef.close();

    // Alle offenen Dialoge schließen
    this.dialog.closeAll();

    // Direktnachricht öffnen mit der userId
    if (this.data.uid) {
      this.chatService.selectDirectMessage(this.data.uid);
    } else {
      console.error('No user ID available for direct message');
    }
  }
}
