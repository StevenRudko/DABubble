import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../../../shared/profile-overview/profile-overview.component';
import { ChatService } from '../../../../service/chat.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Firestore, doc, getDoc, collection } from '@angular/fire/firestore';
import { AddPeopleComponent } from '../add-people/add-people.component';

interface MemberData {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  online?: boolean;
}

interface ChannelData {
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  members: { [key: string]: boolean };
}

@Component({
  selector: 'app-member-overview',
  standalone: true,
  imports: [CommonModule, MatIcon, MatProgressSpinner],
  templateUrl: './member-overview.component.html',
  styleUrl: './member-overview.component.scss',
})
export class MemberOverviewComponent implements OnInit {
  members: MemberData[] = [];
  currentChannelId: string = '';
  isLoading: boolean = true;
  memberCache = new Map<string, MemberData>();

  /**
   * Initializes member overview component
   */
  constructor(
    private dialogRef: MatDialogRef<MemberOverviewComponent>,
    private dialog: MatDialog,
    private chatService: ChatService,
    private firestore: Firestore
  ) {}

  /**
   * Subscribes to channel changes and loads members
   */
  ngOnInit() {
    this.subscribeToChannel();
  }

  /**
   * Sets up channel subscription
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
   * Gets member IDs from channel data
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
   * Creates member data object
   */
  private createMemberData(memberId: string, userData: any): MemberData {
    return {
      uid: memberId,
      email: userData.email || '',
      username: userData.username || '',
      photoURL: userData.photoURL || 'img-placeholder/default-avatar.svg',
      online: userData.online || false,
    };
  }

  /**
   * Loads single member data
   */
  private async loadMemberData(memberId: string): Promise<MemberData | null> {
    if (this.memberCache.has(memberId)) {
      return this.memberCache.get(memberId)!;
    }

    const userDoc = await getDoc(doc(this.firestore, 'users', memberId));
    if (!userDoc.exists()) return null;

    const memberData = this.createMemberData(memberId, userDoc.data());
    this.memberCache.set(memberId, memberData);
    return memberData;
  }

  /**
   * Loads all members for a channel
   */
  async loadMembers(channelId: string): Promise<void> {
    try {
      const memberIds = await this.getMemberIds(channelId);
      const memberPromises = memberIds.map((id) => this.loadMemberData(id));
      const members = (await Promise.all(memberPromises)).filter(
        (member): member is MemberData => member !== null
      );
      this.members = members;
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  /**
   * Closes the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Opens profile dialog for member
   */
  openProfileDialog(member: MemberData): void {
    const userData = {
      name: member.username,
      email: member.email,
      avatar: member.photoURL,
      status: member.online ? 'active' : 'offline',
      uid: member.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: 'profile-dialog-container',
    });
  }

  /**
   * Opens add people dialog
   */
  openAddPeopleDialog(): void {
    this.dialogRef.close();

    this.dialog.open(AddPeopleComponent, {
      position: { top: '160px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }
}
