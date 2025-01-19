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
import { Observable, BehaviorSubject } from 'rxjs';
import { ProfileOverviewComponent } from '../../../shared/profile-overview/profile-overview.component';
import { ChannelInfoDialogComponent } from './channel-info-dialog/channel-info-dialog.component';
import { take, distinctUntilChanged, filter } from 'rxjs/operators';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  DocumentData,
} from '@angular/fire/firestore';

/**
 * Interface for Firestore channel documents
 */
interface ChannelDocument extends DocumentData {
  name: string;
  description?: string;
  type: string;
  members?: Record<string, boolean>;
}

/**
 * Interface for Firestore user documents
 */
interface UserDocument extends DocumentData {
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  online?: boolean;
}

/**
 * Interface for search result items
 */
interface SearchResult {
  id: string;
  type: 'channel' | 'user';
  name: string;
  email?: string;
  photoURL?: string;
  description?: string;
  online?: boolean;
}

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

  constructor(
    private dialog: MatDialog,
    private chatService: ChatService,
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) {
    this.currentChannel$ = this.chatService.currentChannel$;
    this.currentDirectUser$ = this.chatService.currentDirectUser$;
    this.channelMembers$ = new Observable<ChatMember[]>();
    this.isNewMessage$ = this.chatService.isNewMessage$;

    // Listen for message sent events
    this.chatService.messageSent$.subscribe(() => {
      this.selectedResult = null;
      this.resetSearch();
    });

    this.setupInitialSubscriptions();
    this.setupSearchSubscription();
  }

  /**
   * Initializes component subscriptions
   */
  private setupInitialSubscriptions(): void {
    this.currentChannel$
      .pipe(
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        filter((channel) => !!channel)
      )
      .subscribe((channel) => {
        this.channelMembers$ = this.chatService.getChannelMembers(channel!.id);
      });

    this.currentDirectUser$.subscribe();
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
   * @param term Search term to query
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
        return [...usernameResults, ...emailResults].filter(
          (result, index, self) =>
            index === self.findIndex((r) => r.id === result.id)
        );
      } else {
        const emailResults = await this.searchUsers(term, 'email');
        const usernameResults = await this.searchUsers(term, 'username');
        return [...emailResults, ...usernameResults].filter(
          (result, index, self) =>
            index === self.findIndex((r) => r.id === result.id)
        );
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    return [];
  }

  /**
   * Searches channels collection
   * @param term Channel name to search for
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
      const data = doc.data() as ChannelDocument;
      return {
        id: doc.id,
        type: 'channel' as const,
        name: data.name || '',
        description: data.description,
      };
    });
  }

  /**
   * Searches users collection
   * @param term Search term for user
   * @param field Field to search (username or email)
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
      const data = doc.data() as UserDocument;
      return {
        id: doc.id,
        type: 'user' as const,
        name: data.username || data.displayName || data.email || '',
        email: data.email,
        photoURL: data.photoURL,
        online: data.online,
      };
    });
  }

  /**
   * Handles search input changes
   * @param event Input event from search field
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
   * Selects a search result and saves it to the service
   * @param result Selected search result
   */
  selectSearchResult(result: SearchResult): void {
    this.selectedResult = result;
    this.resetSearch();
    this.chatService.setSelectedSearchResult(result);
  }

  /**
   * Gets the currently selected recipient for messaging
   */
  getSelectedRecipient(): { id: string; type: 'channel' | 'user' } | null {
    if (!this.selectedResult) return null;
    return {
      id: this.selectedResult.id,
      type: this.selectedResult.type,
    };
  }

  /**
   * Removes the selected result and enables search
   */
  removeSelectedResult(): void {
    this.selectedResult = null;
    this.chatService.setSelectedSearchResult(null);
    this.resetSearch();

    setTimeout(() => {
      this.searchInputEl?.nativeElement?.focus();
    });
  }

  /**
   * Resets search state
   */
  private resetSearch(): void {
    this.searchInput = '';
    this.searchTerm.next('');
    this.showSearchDropdown = false;
    this.searchResults = [];
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

    const memberWithUsername = member as { username?: string | undefined };
    if (memberWithUsername?.username) {
      return memberWithUsername.username;
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
