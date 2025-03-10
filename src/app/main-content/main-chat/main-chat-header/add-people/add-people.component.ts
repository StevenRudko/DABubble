import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  updateDoc,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChatService } from '../../../../service/chat.service';
import { UserInterface } from '../../../../models/user-interface';
import { ChannelInterface } from '../../../../models/channel-interface';

/**
 * Component for adding users to a channel
 */
@Component({
  selector: 'app-add-people',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './add-people.component.html',
  styleUrl: './add-people.component.scss',
})
export class AddPeopleComponent implements OnInit {
  @ViewChild('searchInputEl') searchInputEl!: ElementRef;

  channelName = '';
  currentChannelId = '';
  searchInput = '';
  searchTerm = new BehaviorSubject<string>('');
  users$!: Observable<UserInterface[]>;
  filteredUsers$!: Observable<UserInterface[]>;
  selectedUsers: UserInterface[] = [];
  showDropdown = false;
  allUsers: UserInterface[] = [];
  currentMembers: Set<string> = new Set();

  /**
   * Initializes the component and sets up user filtering
   */
  constructor(
    public dialogRef: MatDialogRef<AddPeopleComponent>,
    private firestore: Firestore,
    private chatService: ChatService
  ) {
    this.initializeUserObservables();
  }

  /**
   * Sets up user observables and filtering logic
   */
  private initializeUserObservables(): void {
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, {
      idField: 'uid',
    }) as Observable<UserInterface[]>;
    this.setupUserSubscriptions();
  }

  /**
   * Sets up user subscriptions and filtered users observable
   */
  private setupUserSubscriptions(): void {
    this.users$
      .pipe(
        tap((users) => {
          this.allUsers = users;
        })
      )
      .subscribe();
    this.setupFilteredUsers();
  }

  /**
   * Configures the filtered users observable based on search term
   */
  private setupFilteredUsers(): void {
    this.filteredUsers$ = this.searchTerm.pipe(
      map((term) => this.filterUsers(term))
    );
  }

  /**
   * Filters users based on search term and current selection
   */
  private filterUsers(term: string): UserInterface[] {
    if (!term.trim()) return [];
    const searchTerm = term.toLowerCase();
    return this.allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm) &&
        !this.selectedUsers.some((selected) => selected.uid === user.uid) &&
        !this.currentMembers.has(user.uid as string)
    );
  }

  /**
   * Initializes channel data and current members
   */
  async ngOnInit(): Promise<void> {
    this.chatService.currentChannel$.subscribe(async (channel) => {
      if (channel) {
        await this.initializeChannelData(channel);
      }
    });
  }

  /**
   * Initializes channel data and members
   */
  private async initializeChannelData(channel: any): Promise<void> {
    this.currentChannelId = channel.id;
    this.channelName = channel.name;
    await this.loadChannelMembers(channel.id);
  }

  /**
   * Loads current channel members
   */
  private async loadChannelMembers(channelId: string): Promise<void> {
    const channelDoc = await getDoc(doc(this.firestore, 'channels', channelId));
    if (channelDoc.exists()) {
      const data = channelDoc.data() as ChannelInterface;
      this.setCurrentMembers(data);
    }
  }

  /**
   * Sets current members from channel data
   */
  private setCurrentMembers(data: ChannelInterface): void {
    this.currentMembers = new Set(
      Object.entries(data['members'] || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => key)
    );
  }

  /**
   * Handles document click events for dropdown
   */
  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  /**
   * Handles search input changes
   */
  onSearchInput(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.updateSearch(input.value);
  }

  /**
   * Updates search term and shows dropdown
   */
  private updateSearch(value: string): void {
    this.searchInput = value;
    this.searchTerm.next(value);
    this.showDropdown = true;
  }

  /**
   * Selects a user from the dropdown
   */
  selectUser(user: UserInterface): void {
    if (this.selectedUsers.some((selected) => selected.uid === user.uid))
      return;
    this.addUserToSelection(user);
  }

  /**
   * Adds a user to the selection
   */
  private addUserToSelection(user: UserInterface): void {
    this.selectedUsers.push(user);
    this.resetSearch();
    this.focusSearchInput();
  }

  /**
   * Resets search state
   */
  private resetSearch(): void {
    this.searchInput = '';
    this.searchTerm.next('');
    this.showDropdown = false;
  }

  /**
   * Focuses the search input
   */
  private focusSearchInput(): void {
    setTimeout(() => {
      this.searchInputEl.nativeElement.focus();
    });
  }

  /**
   * Removes a user from selection
   */
  removeUser(user: UserInterface, event: Event): void {
    event.stopPropagation();
    this.selectedUsers = this.selectedUsers.filter(
      (selected) => selected.uid !== user.uid
    );
  }

  /**
   * Adds selected users to the channel
   */
  async addUsers(): Promise<void> {
    if (!this.selectedUsers.length) return;
    try {
      await this.updateChannelMembers();
      this.dialogRef.close({ updated: true });
    } catch (error) {
      console.error('Error adding users to channel:', error);
      this.dialogRef.close({ updated: false });
    }
  }

  /**
   * Updates channel members in Firestore
   */
  private async updateChannelMembers(): Promise<void> {
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    const channelDoc = await getDoc(channelRef);

    if (channelDoc.exists()) {
      await this.performMemberUpdate(channelRef, channelDoc);
    }
  }

  /**
   * Performs the member update operation
   */
  private async performMemberUpdate(
    channelRef: any,
    channelDoc: any
  ): Promise<void> {
    const currentData = channelDoc.data() as ChannelInterface;
    const updatedMembers = this.getUpdatedMembers(currentData);

    await updateDoc(channelRef, {
      members: updatedMembers,
      updatedAt: new Date().toISOString(),
    });

    await this.chatService.getChannelMembers(this.currentChannelId);
  }

  /**
   * Gets updated members object
   */
  private getUpdatedMembers(currentData: ChannelInterface): {
    [key: string]: boolean;
  } {
    const currentMembers = currentData['members'] || {};
    return {
      ...currentMembers,
      ...Object.fromEntries(this.selectedUsers.map((user) => [user.uid, true])),
    };
  }

  /**
   * Closes the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Gets user's photo URL or default avatar
   */
  getPhotoURL(user: UserInterface): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }
}
