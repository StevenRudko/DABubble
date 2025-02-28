import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { ChatService } from '../../service/chat.service';
import { PresenceService } from '../../service/presence.service';
import { Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { UserInterface } from '../../models/user-interface';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
})
export class ProfileOverviewComponent implements OnInit, OnDestroy {
  private presenceSubscription: Subscription | null = null;

  private readonly statusMap: Record<string, string> = {
    active: 'Online',
    offline: 'Offline',
  };

  /**
   * Initializes the profile overview component
   */
  constructor(
    public dialogRef: MatDialogRef<ProfileOverviewComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: UserInterface & { status: 'active' | 'offline' },
    private chatService: ChatService,
    private presenceService: PresenceService,
    private dialog: MatDialog,
    private auth: Auth
  ) {
    this.data.status = this.data.online ? 'active' : 'offline';
  }

  /**
   * Sets up presence subscription to update user status
   */
  ngOnInit(): void {
    this.presenceSubscription = this.presenceService
      .getOnlineUsers()
      .subscribe((onlineUsers) => {
        const userId = this.data.uid || this.data.localID;
        this.data.status =
          userId === this.auth.currentUser?.uid
            ? 'active'
            : onlineUsers.includes(userId)
            ? 'active'
            : 'offline';
        this.data.online = this.data.status === 'active';
      });
  }

  /**
   * Cleans up subscriptions
   */
  ngOnDestroy(): void {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }
  }

  /**
   * Closes the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Gets localized status text
   * @param {string} status - Current user status
   * @returns {string} Localized status text
   */
  getStatusText(status: string): string {
    return this.statusMap[status] || this.statusMap['offline'];
  }

  /**
   * Opens direct message with user
   */
  sendDirectMessage(): void {
    this.dialogRef.close();
    this.dialog.closeAll();

    const userId = this.data.uid || this.data.localID;
    if (userId) {
      this.chatService.selectDirectMessage(userId);
    }
  }
}
