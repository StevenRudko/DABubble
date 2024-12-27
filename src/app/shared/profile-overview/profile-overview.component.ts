import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

interface UserData {
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'away' | 'offline';
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
    @Inject(MAT_DIALOG_DATA) public data: UserData
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
    console.log('Sending message to:', this.data.name);
  }
}
