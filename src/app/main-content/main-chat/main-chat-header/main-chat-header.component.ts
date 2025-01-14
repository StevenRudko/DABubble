import { Component, ViewChild, ElementRef } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MemberOverviewComponent } from './member-overview/member-overview.component';
import { AddPeopleComponent } from './add-people/add-people.component';
import { ChatService } from '../../../service/chat.service';
import { CommonModule } from '@angular/common';
import {
  Channel,
  ChatMember,
  DirectUser,
} from '../../../models/chat.interfaces';
import { Observable } from 'rxjs';
import { ProfileOverviewComponent } from '../../../shared/profile-overview/profile-overview.component';
import { ChannelInfoDialogComponent } from './channel-info-dialog/channel-info-dialog.component';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent {
  @ViewChild('memberListBtn') memberListBtn!: ElementRef;
  @ViewChild('addPeopleBtn') addPeopleBtn!: ElementRef;

  currentChannel$: Observable<Channel | null>;
  currentDirectUser$: Observable<DirectUser | null>;
  channelMembers$: Observable<ChatMember[]>;

  /**
   * Initializes component and sets up observables
   */
  constructor(
    private dialog: MatDialog,
    private chatService: ChatService,
    private auth: Auth,
    private router: Router
  ) {
    this.currentChannel$ = this.chatService.currentChannel$;
    this.currentDirectUser$ = this.chatService.currentDirectUser$;
    this.channelMembers$ = new Observable<ChatMember[]>();

    this.currentChannel$.subscribe((channel) => {
      if (channel) {
        this.channelMembers$ = this.chatService.getChannelMembers(channel.id);
      }
    });

    this.currentDirectUser$.subscribe();
  }

  /**
   * Opens channel info dialog with channel data
   */
  openChannelInfoDialog(channel: Channel): void {
    const dialogRef = this.dialog.open(ChannelInfoDialogComponent, {
      data: {
        channelId: channel.id,
        name: channel.name,
        description: channel.description,
        userId: this.auth.currentUser?.uid,
      },
      maxWidth: '100vw',
      width: '800px',
      panelClass: ['channel-dialog', 'wide-dialog'],
    });

    dialogRef.afterClosed().subscribe();
  }

  /**
   * Gets photo URL for member or default avatar
   */
  getPhotoURL(member: ChatMember | DirectUser | null): string {
    return member?.photoURL || 'img-placeholder/default-avatar.svg';
  }

  /**
   * Gets display name for member from available fields
   */
  getDisplayName(member: ChatMember | DirectUser | null): string {
    if (!member) return 'Unbenannter Benutzer';

    const userWithUsername = member as { username?: string };
    if (userWithUsername.username) {
      return userWithUsername.username;
    }
    if (member.displayName) {
      return member.displayName;
    }
    if (member.email) {
      return member.email;
    }
    return 'Unbenannter Benutzer';
  }

  /**
   * Opens member overview dialog positioned relative to button
   */
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

  /**
   * Opens add people dialog positioned relative to button
   */
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

  /**
   * Opens profile dialog for user
   */
  openProfileDialog(user: DirectUser) {
    const userData = {
      name: this.getDisplayName(user),
      email: user.email || '',
      avatar: this.getPhotoURL(user),
      status: user.online ? 'active' : 'offline',
      uid: user.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      position: {
        top: '160px',
      },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'profile-dialog',
    });
  }
}
