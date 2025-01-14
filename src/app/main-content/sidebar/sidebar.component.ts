import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ChannelDialogComponent } from './create-channel-dialog/create-channel-dialog.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { User } from 'firebase/auth';
import { ChatService } from '../../service/chat.service';

interface Channel {
  id: string;
  name: string;
  description: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  online?: boolean;
  username?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  channels$!: Observable<Channel[]>;
  currentUser$!: Observable<User | null>;
  allUsers$!: Observable<UserProfile[]>;
  isChannelSectionExpanded: boolean = true;
  isDirectMessageSectionExpanded: boolean = true;

  /**
   * Initializes the sidebar component
   */
  constructor(
    private dialog: MatDialog,
    private firestore: Firestore,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    const channelsCollection = collection(this.firestore, 'channels');
    this.channels$ = collectionData(channelsCollection, {
      idField: 'id',
    }) as Observable<Channel[]>;

    this.currentUser$ = this.authService.user$;

    const usersCollection = collection(this.firestore, 'users');
    this.allUsers$ = collectionData(usersCollection, {
      idField: 'uid',
    }) as Observable<UserProfile[]>;
  }

  /**
   * Lifecycle hook for initialization
   */
  ngOnInit(): void {}

  /**
   * Opens the channel creation dialog
   */
  openChannelDialog(): void {
    this.dialog.open(ChannelDialogComponent);
  }

  /**
   * Toggles the channel section visibility
   */
  toggleChannelSection(): void {
    this.isChannelSectionExpanded = !this.isChannelSectionExpanded;
  }

  /**
   * Toggles the direct message section visibility
   */
  toggleDirectMessageSection(): void {
    this.isDirectMessageSectionExpanded = !this.isDirectMessageSectionExpanded;
  }

  /**
   * Checks if given ID matches current user
   */
  isCurrentUser(userId: string): Observable<boolean> {
    return this.currentUser$.pipe(map((user) => user?.uid === userId));
  }

  /**
   * Gets the photo URL for a user
   */
  getPhotoURL(user: User | UserProfile): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }

  /**
   * Gets the display name for a user
   */
  getDisplayName(user: User | UserProfile): string {
    if ('username' in user && user.username) {
      return user.username;
    }
    return user.displayName || 'Unbenannter Benutzer';
  }

  /**
   * Selects a channel
   */
  selectChannel(channelId: string): void {
    this.chatService.selectChannel(channelId);
  }

  /**
   * Selects a user for direct messaging
   */
  selectDirectMessage(userId: string): void {
    this.chatService.selectDirectMessage(userId);
  }
}
