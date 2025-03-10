import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material-imports';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MemberOverviewComponent } from './member-overview/member-overview.component';
import { AddPeopleComponent } from './add-people/add-people.component';
import { ChatService } from '../../../service/chat.service';
import { PresenceService } from '../../../service/presence.service';
import { CommonModule } from '@angular/common';
import {
  Channel,
  ChatMember,
  DirectUser,
} from '../../../models/chat.interfaces';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { ProfileOverviewComponent } from '../../../shared/profile-overview/profile-overview.component';
import { ChannelInfoDialogComponent } from './channel-info-dialog/channel-info-dialog.component';
import { take, distinctUntilChanged, filter } from 'rxjs/operators';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { UserOverviewComponent } from '../../../shared/user-overview/user-overview.component';
import { MainContentComponent } from '../../main-content.component';
import { ChannelInterface } from '../../../models/channel-interface';
import { UserInterface } from '../../../models/user-interface';
import { SearchResult } from '../../../models/search-result';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('memberListBtn') memberListBtn!: ElementRef;
  @ViewChild('addPeopleBtn') addPeopleBtn!: ElementRef;
  @ViewChild('searchInputEl') searchInputEl!: ElementRef;

  currentChannel$: Observable<Channel | null>;
  currentDirectUser$: Observable<DirectUser | null>;
  channelMembers$: Observable<ChatMember[]>;
  isNewMessage$: Observable<boolean>;

  searchInput = '';
  private searchTerm = new BehaviorSubject<string>('');
  searchResults: SearchResult[] = [];
  selectedResult: SearchResult | null = null;
  showSearchDropdown = false;
  isMobile: boolean = window.innerWidth <= 1024;

  private onlineUsers: string[] = [];
  private presenceSubscription: Subscription | null = null;

  /**
   * Initializes component services and subscriptions
   * @param {MatDialog} dialog - Material dialog service
   * @param {ChatService} chatService - Chat service
   * @param {Auth} auth - Firebase authentication service
   * @param {Router} router - Angular router
   * @param {Firestore} firestore - Firestore service
   * @param {PresenceService} presenceService - Presence tracking service
   */
  constructor(
    private dialog: MatDialog,
    private chatService: ChatService,
    private auth: Auth,
    private router: Router,
    private firestore: Firestore,
    private presenceService: PresenceService,
    public mainContent: MainContentComponent
  ) {
    this.currentChannel$ = this.chatService.currentChannel$;
    this.currentDirectUser$ = this.chatService.currentDirectUser$;
    this.channelMembers$ = new Observable<ChatMember[]>();
    this.isNewMessage$ = this.chatService.isNewMessage$;
    this.checkScreenSize();

    this.chatService.messageSent$.subscribe(() => {
      this.selectedResult = null;
      this.resetSearch();
    });

    this.setupInitialSubscriptions();
    this.setupSearchSubscription();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  /**
   * Sets up online status and tracks online users
   */
  ngOnInit(): void {
    this.presenceService.setOnlineStatus();
    this.presenceSubscription = this.presenceService
      .getOnlineUsers()
      .subscribe((users) => {
        this.onlineUsers = users;
      });
  }

  /**
   * Cleans up presence subscription on component destruction
   */
  ngOnDestroy(): void {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }
  }

  /**
   * Sets up channel subscriptions
   */
  private setupInitialSubscriptions(): void {
    this.setupChannelSubscription();
    this.setupMemberUpdates();
    this.currentDirectUser$.subscribe();
  }

  /**
   * Handles channel subscription
   */
  private setupChannelSubscription(): void {
    this.currentChannel$
      .pipe(
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        filter((channel) => !!channel)
      )
      .subscribe((channel) => {
        this.channelMembers$ = this.chatService.getChannelMembers(channel!.id);
      });
  }

  /**
   * Handles member update subscription
   */
  private setupMemberUpdates(): void {
    this.chatService.channelMembersUpdated$.subscribe((channelId) => {
      this.currentChannel$.pipe(take(1)).subscribe((channel) => {
        if (channel && channel.id === channelId) {
          this.channelMembers$ = this.chatService.getChannelMembers(channelId);
        }
      });
    });
  }

  /**
   * Sets up search term subscription
   */
  private setupSearchSubscription(): void {
    this.searchTerm.subscribe(async (term) => {
      this.searchResults = await this.searchDatabase(term);
    });
  }

  /**
   * Searches database for channels and users
   * @param {string} term - Search term
   * @returns {Promise<SearchResult[]>} Search results
   */
  private async searchDatabase(term: string): Promise<SearchResult[]> {
    if (!term.trim()) return [];

    try {
      if (term.startsWith('#')) {
        return await this.searchChannels(term.substring(1));
      } else if (term.startsWith('@')) {
        const usernameResults = await this.searchUsers(
          term.substring(1),
          'username'
        );
        const emailResults = await this.searchUsers(term.substring(1), 'email');
        return this.deduplicateResults([...usernameResults, ...emailResults]);
      } else {
        const emailResults = await this.searchUsers(term, 'email');
        const usernameResults = await this.searchUsers(term, 'username');
        return this.deduplicateResults([...emailResults, ...usernameResults]);
      }
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Removes duplicate search results
   * @param {SearchResult[]} results - Array of search results
   * @returns {SearchResult[]} Deduplicated search results
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    return results.filter(
      (result, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            (r.type === 'channel' &&
              result.type === 'channel' &&
              r.channelId === result.channelId) ||
            (r.type === 'user' &&
              result.type === 'user' &&
              r.localID === result.localID)
        )
    );
  }

  /**
   * Searches for channels matching the search term
   * @param {string} term - Search term
   * @returns {Promise<SearchResult[]>} Channel search results
   */
  private async searchChannels(term: string): Promise<SearchResult[]> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(
      channelsRef,
      where('name', '>=', term),
      where('name', '<=', term + '\uf8ff')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ChannelInterface;
      return {
        type: 'channel',
        channelId: doc.id,
        channelName: data.name || '',
        channelDescription: data.description || '',
        channelMembers: data.members || {},
        authorId: '',
        authorPhoto: null,
        comments: [],
        directUserId: '',
        directUserName: '',
        email: '',
        emojis: [],
        idOfTheRespondentMessage: '',
        localID: doc.id,
        message: '',
        nameOfTheRespondent: '',
        photoURL: '',
        time: Date.now(),
        userMessageId: doc.id,
        username: data.name || '',
      };
    });
  }

  /**
   * Searches for users matching the search term
   * @param {string} term - Search term
   * @param {string} field - Field to search (username or email)
   * @returns {Promise<SearchResult[]>} User search results
   */
  private async searchUsers(
    term: string,
    field: string
  ): Promise<SearchResult[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef,
      where(field, '>=', term),
      where(field, '<=', term + '\uf8ff')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data() as UserInterface;
      return {
        type: 'user',
        username: data.username || '',
        email: data.email || '',
        photoURL: data.photoURL || '',
        localID: doc.id,
        authorId: doc.id,
        authorPhoto: data.photoURL || null,
        channelDescription: '',
        channelId: '',
        channelMembers: {},
        channelName: '',
        comments: [],
        directUserId: doc.id,
        directUserName: data.username || '',
        emojis: [],
        idOfTheRespondentMessage: '',
        message: '',
        nameOfTheRespondent: '',
        time: Date.now(),
        userMessageId: doc.id,
      };
    });
  }

  /**
   * Handles search input event
   * @param {Event} event - Input event
   */
  onSearchInput(event: Event): void {
    if (this.selectedResult) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.searchInput = input.value;
    this.searchTerm.next(input.value);
    this.showSearchDropdown = true;
  }

  /**
   * Selects a search result
   * @param {SearchResult} result - Selected search result
   */
  selectSearchResult(result: SearchResult): void {
    this.selectedResult = result;
    this.resetSearch();
    this.chatService.setSelectedSearchResult(result);
  }

  /**
   * Removes the selected search result
   */
  removeSelectedResult(): void {
    this.selectedResult = null;
    this.chatService.setSelectedSearchResult(null);
    this.resetSearch();

    setTimeout(() => this.searchInputEl?.nativeElement?.focus());
  }

  /**
   * Resets search input and results
   */
  private resetSearch(): void {
    this.searchInput = '';
    this.searchTerm.next('');
    this.showSearchDropdown = false;
    this.searchResults = [];
  }

  /**
   * Opens channel info dialog
   * @param {Channel} channel - Channel to show info for
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
   * Gets photo URL for a member or user
   * @param {ChatMember | DirectUser | null} member - Member or user
   * @returns {string} Photo URL
   */
  getPhotoURL(member: ChatMember | DirectUser | null): string {
    return member?.photoURL || 'img-placeholder/default-avatar.svg';
  }

  /**
   * Gets display name for a member or user
   * @param {ChatMember | DirectUser | null} member - Member or user
   * @returns {string} Display name
   */
  getDisplayName(member: ChatMember | DirectUser | null): string {
    if (!member) return 'Unbenannter Benutzer';

    const memberWithUsername = member as { username?: string | undefined };
    if (memberWithUsername?.username) return memberWithUsername.username;
    if (member.displayName) return member.displayName;
    if (member.email) return member.email;
    return 'Unbenannter Benutzer';
  }

  /**
   * Opens member dialog
   */
  openMemberDialog(): void {
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
   * Opens add people dialog with positioning
   */
  openAddPeopleDialog(): void {
    const btnRect = this.addPeopleBtn.nativeElement.getBoundingClientRect();
    const dialogRef = this.getAddPeopleDialogConfig(btnRect);
    this.handleAddPeopleDialogClose(dialogRef);
  }

  /**
   * Creates dialog configuration
   * @param {DOMRect} btnRect - Button rectangle
   * @returns {MatDialogRef<AddPeopleComponent>} Dialog reference
   */
  private getAddPeopleDialogConfig(
    btnRect: DOMRect
  ): MatDialogRef<AddPeopleComponent> {
    const isMobileView = window.innerWidth <= 550;

    const dialogConfig = {
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: ['member-dialog'],
      position: isMobileView
        ? undefined
        : {
            top: '160px',
            left: `${btnRect.right - 420}px`,
          },
    };

    return this.dialog.open(AddPeopleComponent, dialogConfig);
  }

  /**
   * Handles dialog close event
   * @param {MatDialogRef<AddPeopleComponent>} dialogRef - Dialog reference
   */
  private handleAddPeopleDialogClose(
    dialogRef: MatDialogRef<AddPeopleComponent>
  ): void {
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.updated) {
        this.refreshMembers();
      }
    });
  }

  /**
   * Refreshes member list
   */
  private refreshMembers(): void {
    this.currentChannel$.pipe(take(1)).subscribe((channel) => {
      if (channel) {
        this.channelMembers$ = this.chatService.getChannelMembers(channel.id);
      }
    });
  }

  /**
   * Opens profile dialog for a user
   * @param {DirectUser} user - User to show profile for
   */
  openProfileDialog(user: DirectUser): void {
    const isOwnProfile = user.uid === this.auth.currentUser?.uid;

    if (isOwnProfile) {
      this.dialog.open(UserOverviewComponent, {
        panelClass: ['profile-dialog', 'right-aligned'],
        width: '400px',
      });
      return;
    }

    const userData = {
      username: this.getDisplayName(user),
      email: user.email || '',
      photoURL: this.getPhotoURL(user),
      status: this.onlineUsers.includes(user.uid) ? 'active' : 'offline',
      uid: user.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      position: { top: '160px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'profile-dialog',
    });
  }

  /**
   * Checks if a user is online
   * @param {string} userId - User ID to check
   * @returns {boolean} Whether the user is online
   */
  isUserOnline(userId: string): boolean {
    if (userId === this.auth.currentUser?.uid) {
      return true;
    }
    return this.onlineUsers.includes(userId);
  }

  /**
   * Gets the name of a search result
   * @param {SearchResult | null} result - Search result
   * @returns {string} Result name
   */
  getResultName(result: SearchResult | null): string {
    if (!result) return '';
    return result.type === 'channel' ? result.channelName : result.username;
  }

  /**
   * Gets the description of a channel search result
   * @param {SearchResult} result - Search result
   * @returns {string} Channel description
   */
  getResultDescription(result: SearchResult): string {
    return result.type === 'channel' ? result.channelDescription || '' : '';
  }

  /**
   * Checks if a user search result is online
   * @param {SearchResult} result - Search result
   * @returns {boolean} User online status
   */
  isResultUserOnline(result: SearchResult): boolean {
    return result.type === 'user' && this.onlineUsers.includes(result.localID);
  }
}
