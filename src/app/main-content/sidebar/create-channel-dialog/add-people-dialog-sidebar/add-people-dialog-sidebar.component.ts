import {
  Component,
  Input,
  Output,
  EventEmitter,
  Optional,
  Inject,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Firestore,
  collection,
  collectionData,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

interface UserProfile {
  uid: string;
  email: string;
  photoURL: string | null;
  username: string;
  online?: boolean;
}

@Component({
  selector: 'app-add-people-dialog-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './add-people-dialog-sidebar.component.html',
  styleUrl: './add-people-dialog-sidebar.component.scss',
})
export class AddPeopleDialogSidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();
  @ViewChild('searchInputEl') searchInputEl!: ElementRef;

  selectedOption: 'all' | 'specific' = 'all';
  searchInput = '';
  searchTerm = new BehaviorSubject<string>('');
  users$: Observable<UserProfile[]>;
  filteredUsers$: Observable<UserProfile[]>;
  selectedUsers: UserProfile[] = [];
  showDropdown = false;
  allUsers: UserProfile[] = [];

  /**
   * Initializes component with user data streams
   */
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddPeopleDialogSidebarComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { channelId: string; creatorId: string },
    private firestore: Firestore
  ) {
    this.users$ = this.initializeUserStream();
    this.filteredUsers$ = this.initializeFilteredUsers();
  }

  /**
   * Sets up initial user stream
   */
  private initializeUserStream(): Observable<UserProfile[]> {
    const usersCollection = collection(this.firestore, 'users');
    const users$ = collectionData(usersCollection, {
      idField: 'uid',
    }) as Observable<UserProfile[]>;

    users$.pipe(tap((users) => this.handleUsersUpdate(users))).subscribe();
    return users$;
  }

  /**
   * Handles users data update
   */
  private handleUsersUpdate(users: UserProfile[]): void {
    this.allUsers = users;
    const creator = users.find((user) => user.uid === this.data.creatorId);
    if (creator && !this.selectedUsers.some((u) => u.uid === creator.uid)) {
      this.selectedUsers.push(creator);
    }
  }

  /**
   * Sets up filtered users stream
   */
  private initializeFilteredUsers(): Observable<UserProfile[]> {
    return this.searchTerm.pipe(map((term) => this.filterUsers(term)));
  }

  /**
   * Filters users based on search term
   */
  private filterUsers(term: string): UserProfile[] {
    if (!term.trim()) return [];
    const searchTerm = term.toLowerCase();
    return this.allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm) &&
        !this.selectedUsers.some((selected) => selected.uid === user.uid)
    );
  }

  /**
   * Initializes component
   */
  ngOnInit(): void {
    this.users$.pipe(tap()).subscribe();
  }

  /**
   * Handles document click events
   */
  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  /**
   * Handles search input events
   */
  onSearchInput(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.searchInput = input.value;
    this.searchTerm.next(input.value);
    this.showDropdown = true;
  }

  /**
   * Selects a user from search results
   */
  selectUser(user: UserProfile): void {
    if (this.isUserNotSelected(user)) {
      this.addUserToSelection(user);
      this.resetSearch();
    }
  }

  /**
   * Checks if user is not already selected
   */
  private isUserNotSelected(user: UserProfile): boolean {
    return !this.selectedUsers.some((selected) => selected.uid === user.uid);
  }

  /**
   * Adds user to selected users list
   */
  private addUserToSelection(user: UserProfile): void {
    this.selectedUsers.push(user);
  }

  /**
   * Resets search state
   */
  private resetSearch(): void {
    this.searchInput = '';
    this.searchTerm.next('');
    this.showDropdown = false;
    setTimeout(() => this.searchInputEl.nativeElement.focus());
  }

  /**
   * Removes user from selection
   */
  removeUser(user: UserProfile, event: Event): void {
    event.stopPropagation();
    if (user.uid !== this.data.creatorId) {
      this.selectedUsers = this.selectedUsers.filter(
        (selected) => selected.uid !== user.uid
      );
    }
  }

  /**
   * Adds users to channel
   */
  async addUsers(users: UserProfile[]): Promise<void> {
    if (!users.length) return;
    try {
      await this.updateChannelMembers(users);
      this.dialogRef?.close();
    } catch (error) {
      console.error('Error adding users to channel:', error);
    }
  }

  /**
   * Updates channel members in Firestore
   */
  private async updateChannelMembers(users: UserProfile[]): Promise<void> {
    const channelRef = doc(this.firestore, 'channels', this.data.channelId);
    const members = Object.fromEntries(users.map((user) => [user.uid, true]));
    await updateDoc(channelRef, {
      members,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Adds all users to channel
   */
  async addAllUsers(): Promise<void> {
    if (this.allUsers.length > 0) {
      await this.addUsers(this.allUsers);
    }
  }

  /**
   * Handles form submission
   */
  async onSubmit(): Promise<void> {
    if (this.selectedOption === 'all') {
      await this.addAllUsers();
    } else if (this.selectedUsers.length > 0) {
      await this.addUsers(this.selectedUsers);
    }
  }

  /**
   * Gets user's photo URL
   */
  getPhotoURL(user: UserProfile): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }

  /**
   * Handles backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Closes the dialog
   */
  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
