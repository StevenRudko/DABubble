import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../../../shared/profile-overview/profile-overview.component';
import { ChatService } from '../../../../service/chat.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AddPeopleComponent } from '../add-people/add-people.component';
import { PresenceService } from '../../../../service/presence.service';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

interface MemberData {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  online?: boolean;
}

interface ChannelData {
  username: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  members: { [key: string]: boolean };
}

interface UserDocData {
  [key: string]: any;
  email?: string;
  username?: string;
  photoURL?: string;
}

@Component({
  selector: 'app-member-overview',
  standalone: true,
  imports: [CommonModule, MatIcon, MatProgressSpinner],
  templateUrl: './member-overview.component.html',
  styleUrl: './member-overview.component.scss',
})
export class MemberOverviewComponent implements OnInit, OnDestroy {
  members: MemberData[] = [];
  currentChannelId: string = '';
  isLoading: boolean = true;
  memberCache = new Map<string, MemberData>();
  private presenceSubscription: Subscription | null = null;
  private onlineUsers: Set<string> = new Set();

  constructor(
    private dialogRef: MatDialogRef<MemberOverviewComponent>,
    private dialog: MatDialog,
    private chatService: ChatService,
    private firestore: Firestore,
    private presenceService: PresenceService,
    private auth: Auth
  ) {}

  /**
   * Initializes component by setting up channel and presence subscriptions
   * @returns {void}
   */
  ngOnInit(): void {
    this.subscribeToChannel();
    this.setupPresenceSubscription();
  }

  /**
   * Cleans up subscriptions on component destruction
   * @returns {void}
   */
  ngOnDestroy(): void {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }
  }

  /**
   * Sets up subscription to online users
   * @returns {void}
   */
  private setupPresenceSubscription(): void {
    this.presenceSubscription = this.presenceService
      .getOnlineUsers()
      .subscribe((onlineUserIds: string[]) => {
        this.onlineUsers = new Set(onlineUserIds);
        this.updateMembersOnlineStatus();
      });
  }

  /**
   * Checks if a specific user is online
   * @param {string} userId - The ID of the user to check
   * @returns {boolean} Whether the user is online
   */
  private isUserOnline(userId: string): boolean {
    // If the user is the current logged-in user, always show as online
    if (userId === this.auth.currentUser?.uid) {
      return true;
    }
    return this.onlineUsers.has(userId);
  }

  /**
   * Updates online status for all members
   * @returns {void}
   */
  private updateMembersOnlineStatus(): void {
    this.members = this.members.map((member) => ({
      ...member,
      online: this.isUserOnline(member.uid),
    }));
  }

  /**
   * Subscribes to the current channel and loads its members
   * @returns {void}
   */
  private subscribeToChannel(): void {
    this.chatService.currentChannel$.subscribe(async (channel) => {
      if (channel) {
        this.currentChannelId = channel.id;
        this.isLoading = true;
        await this.loadMembers(channel.id);
        this.isLoading = false;
      }
    });
  }

  /**
   * Retrieves member IDs for a specific channel
   * @param {string} channelId - The ID of the channel
   * @returns {Promise<string[]>} Array of member IDs
   */
  private async getMemberIds(channelId: string): Promise<string[]> {
    const channelDoc = await getDoc(doc(this.firestore, 'channels', channelId));
    if (!channelDoc.exists()) return [];

    const channelData = channelDoc.data() as ChannelData;
    return Object.entries(channelData.members || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }

  /**
   * Loads data for a specific member
   * @param {string} memberId - The ID of the member
   * @returns {Promise<MemberData | null>} Member data or null
   */
  private async loadMemberData(memberId: string): Promise<MemberData | null> {
    const cachedMember = this.memberCache.get(memberId);
    if (cachedMember) return cachedMember;

    const userDoc = await getDoc(doc(this.firestore, 'users', memberId));
    if (!userDoc.exists()) return null;

    return this.createMemberData(memberId, userDoc.data() as UserDocData);
  }

  /**
   * Creates member data object
   * @param {string} memberId - The ID of the member
   * @param {UserDocData} userData - User data from Firestore
   * @returns {MemberData} Processed member data
   */
  private createMemberData(
    memberId: string,
    userData: UserDocData
  ): MemberData {
    const memberData = {
      uid: memberId,
      email: userData['email'] || '',
      username: userData['username'] || '',
      photoURL: userData['photoURL'] || 'img-placeholder/default-avatar.svg',
      online: this.isUserOnline(memberId),
    };

    this.memberCache.set(memberId, memberData);
    return memberData;
  }

  /**
   * Loads members for a specific channel
   * @param {string} channelId - The ID of the channel
   * @returns {Promise<void>}
   */
  async loadMembers(channelId: string): Promise<void> {
    try {
      const memberIds = await this.getMemberIds(channelId);
      const memberPromises = memberIds.map((id) => this.loadMemberData(id));

      const members = (await Promise.all(memberPromises)).filter(
        (member): member is MemberData => member !== null
      );

      this.members = members;
      this.updateMembersOnlineStatus();
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  /**
   * Closes the dialog
   * @returns {void}
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Opens profile dialog for a specific member
   * @param {MemberData} member - The member whose profile to open
   * @returns {void}
   */
  openProfileDialog(member: MemberData): void {
    const userData = {
      username: member.username,
      email: member.email,
      photoURL: member.photoURL,
      status: this.isUserOnline(member.uid) ? 'active' : 'offline',
      uid: member.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: 'profile-dialog-container',
    });
  }

  /**
   * Opens dialog to add people to the channel
   */
  openAddPeopleDialog(): void {
    const dialogRef = this.getAddPeopleDialogConfig();
    this.handleAddPeopleDialogClose(dialogRef);
  }

  /**
   * Creates dialog configuration
   */
  private getAddPeopleDialogConfig(): MatDialogRef<AddPeopleComponent> {
    return this.dialog.open(AddPeopleComponent, {
      position: { top: '160px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }

  /**
   * Handles dialog close event
   */
  private handleAddPeopleDialogClose(
    dialogRef: MatDialogRef<AddPeopleComponent>
  ): void {
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.updated) {
        this.chatService.refreshChannelMembers(this.currentChannelId);
      }
      this.dialogRef.close();
    });
  }
}
