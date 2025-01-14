// In member-overview.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../../../shared/profile-overview/profile-overview.component';
import { ChatService } from '../../../../service/chat.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  getDocs,
} from '@angular/fire/firestore';
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

  constructor(
    private dialogRef: MatDialogRef<MemberOverviewComponent>,
    private dialog: MatDialog,
    private chatService: ChatService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.chatService.currentChannel$.subscribe(async (channel) => {
      if (channel) {
        this.currentChannelId = channel.id;
        this.isLoading = true;
        await this.loadMembers(channel.id);
        this.isLoading = false;
      }
    });
  }

  async loadMembers(channelId: string) {
    try {
      const channelDoc = await getDoc(
        doc(this.firestore, 'channels', channelId)
      );
      if (!channelDoc.exists()) return;

      const channelData = channelDoc.data() as ChannelData;
      const memberIds = Object.entries(channelData['members'] || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      // Parallel loading of all member data
      const memberPromises = memberIds.map(async (memberId) => {
        // Check cache first
        if (this.memberCache.has(memberId)) {
          return this.memberCache.get(memberId)!;
        }

        const userDoc = await getDoc(doc(this.firestore, 'users', memberId));
        if (!userDoc.exists()) return null;

        const userData = userDoc.data() as MemberData;
        const memberData = {
          uid: memberId,
          email: userData.email || '',
          username: userData.username || '',
          photoURL: userData.photoURL || 'img-placeholder/default-avatar.svg',
          online: userData.online || false,
        };

        // Cache the member data
        this.memberCache.set(memberId, memberData);
        return memberData;
      });

      // Wait for all promises to resolve
      const members = (await Promise.all(memberPromises)).filter(
        (member): member is MemberData => member !== null
      );
      this.members = members;
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  close() {
    this.dialogRef.close();
  }

  openProfileDialog(member: MemberData) {
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

  openAddPeopleDialog() {
    this.dialogRef.close(); // Schließe das aktuelle Dialog-Fenster

    this.dialog.open(AddPeopleComponent, {
      position: {
        top: '160px',
      },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });
  }
}
