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

/**
 * Interface for user data in profile overview
 */
interface UserData {
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'away' | 'offline';
  uid: string;
}

/**
 * Component for displaying user profile information
 */
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
    away: 'Abwesend',
    offline: 'Offline',
  };

  /**
   * Initializes the profile overview component
   */
  constructor(
    public dialogRef: MatDialogRef<ProfileOverviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserData,
    private chatService: ChatService,
    private presenceService: PresenceService,
    private dialog: MatDialog,
    private auth: Auth
  ) {}

  /**
   * Sets up presence subscription to update user status
   */
  ngOnInit(): void {
    this.presenceSubscription = this.presenceService
      .getOnlineUsers()
      .subscribe((onlineUsers) => {
        this.data.status =
          this.data.uid === this.auth.currentUser?.uid
            ? 'active'
            : onlineUsers.includes(this.data.uid)
            ? 'active'
            : 'offline';
      });
  }

  /**
   * Updates user status based on online users list
   * @param {string[]} onlineUsers - List of online user IDs
   */
  private updateUserStatus(onlineUsers: string[]): void {
    // Update status, with special handling for the current user
    this.data.status = this.isUserOnline(onlineUsers) ? 'active' : 'offline';
  }

  /**
   * Checks if the user is online
   * @param {string[]} onlineUsers - List of online user IDs
   * @returns {boolean} Whether the user is online
   */
  private isUserOnline(onlineUsers: string[]): boolean {
    return onlineUsers.includes(this.data.uid);
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

    if (this.data.uid) {
      this.chatService.selectDirectMessage(this.data.uid);
    }
  }
}
