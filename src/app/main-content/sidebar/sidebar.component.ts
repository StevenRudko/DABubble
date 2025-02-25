import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ChannelDialogComponent } from './create-channel-dialog/create-channel-dialog.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { User } from 'firebase/auth';
import { ChatService } from '../../service/chat.service';
import { FormsModule } from '@angular/forms';
import { PresenceService } from '../../service/presence.service';
import { ShowHiddeResultsService } from '../../service/show-hidde-results.service';
import { SearchBarComponent } from '../../header/search-bar/search-bar.component';
import { MainContentComponent } from '../main-content.component';

/**
 * Interface for channel data structure
 */
interface Channel {
  id: string;
  name: string;
  description: string;
  members?: { [key: string]: boolean };
}

/**
 * Interface for user profile data structure
 */
interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  online?: boolean;
  username?: string;
}

/**
 * Component managing sidebar navigation and user/channel selection
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    FormsModule,
    SearchBarComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss', './../../header/header.component.scss', './../../header/search-bar/search-bar.component.scss'],
})
export class SidebarComponent implements OnInit {
  channels$!: Observable<Channel[]>;
  currentUser$!: Observable<User | null>;
  allUsers$!: Observable<UserProfile[]>;
  isChannelSectionExpanded = true;
  isDirectMessageSectionExpanded = true;
  showNewMessage = false;
  newMessageInput = '';
  isNewMessage$: Observable<boolean> = new Observable<boolean>();
  searchQuery: string = '';
  isMobile: boolean = window.innerWidth <= 1024;

  /**
   * Initializes the sidebar component and its data streams
   */
  constructor(
    private dialog: MatDialog,
    private firestore: Firestore,
    private authService: AuthService,
    private presenceService: PresenceService,
    public chatService: ChatService,
    public showHiddeService: ShowHiddeResultsService,
    private mainContent: MainContentComponent
  ) {
    this.initializeUserStreams();
    this.initializeChannelStream();
    this.initializeUserList();
    this.checkScreenSize();
  }

  /**
   * Monitors window resize events and updates mobile status
   */
  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  /**
   * Initializes user list data stream
   */
  private initializeUserList(): void {
    const usersCollection = collection(this.firestore, 'users');
    this.allUsers$ = combineLatest([
      collectionData(usersCollection, { idField: 'uid' }) as Observable<
        UserProfile[]
      >,
      this.presenceService.getOnlineUsers(),
    ]).pipe(
      map(([users, onlineUserIds]) => {
        return users.map((user) => ({
          ...user,
          online: onlineUserIds.includes(user.uid),
        }));
      })
    );
  }

  /**
   * Initializes user-related streams
   */
  private initializeUserStreams(): void {
    this.currentUser$ = this.authService.user$;
    this.isNewMessage$ = this.chatService.isNewMessage$;
  }

  /**
   * Initializes channel data stream with member filtering
   */
  private initializeChannelStream(): void {
    const channelsCollection = collection(this.firestore, 'channels');
    this.channels$ = combineLatest([
      collectionData(channelsCollection, { idField: 'id' }) as Observable<
        Channel[]
      >,
      this.currentUser$,
    ]).pipe(map(([channels, user]) => this.filterUserChannels(channels, user)));
  }

  /**
   * Filters channels to show only those where user is a member
   */
  private filterUserChannels(
    channels: Channel[],
    user: User | null
  ): Channel[] {
    if (!user) return [];
    return channels.filter((channel) => {
      const members = channel.members || {};
      return members[user.uid] === true;
    });
  }

  ngOnInit(): void {}

  /**
   * Opens channel creation dialog
   */
  openChannelDialog(): void {
    this.dialog.open(ChannelDialogComponent);
  }

  /**
   * Toggles channel section visibility
   */
  toggleChannelSection(): void {
    this.isChannelSectionExpanded = !this.isChannelSectionExpanded;
  }

  /**
   * Toggles direct message section visibility
   */
  toggleDirectMessageSection(): void {
    this.isDirectMessageSectionExpanded = !this.isDirectMessageSectionExpanded;
  }

  /**
   * Checks if provided userId matches current user
   */
  isCurrentUser(userId: string): Observable<boolean> {
    return this.currentUser$.pipe(map((user) => user?.uid === userId));
  }

  /**
   * Gets user's photo URL or default avatar
   */
  getPhotoURL(user: UserProfile | User): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }

  /**
   * Gets user's display name or default text
   */
  getDisplayName(user: UserProfile | User): string {
    if ('username' in user && user.username) return user.username;
    return user.displayName || 'Unnamed User';
  }

  /**
   * Selects a channel if different from current
   */
  selectChannel(channelId: string): void {
    this.chatService.currentChannel$
      .pipe(take(1))
      .subscribe((currentChannel) => {
        if (!currentChannel || currentChannel.id !== channelId) {
          this.chatService.selectChannel(channelId);
          this.mainContent.showChat(true);
        }
      });
  }

  /**
   * Initiates direct messaging with selected user
   */
  selectDirectMessage(userId: string): void {
    this.chatService.selectDirectMessage(userId);
    this.mainContent.showChat(true);
  }

  /**
   * Opens new message interface and shows chat view.
   */
  openNewMessage(): void {
    this.chatService.toggleNewMessage();
    this.mainContent.showChat(true);
  }
}
