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
   * Initializes the component and sets up user data streams
   */
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddPeopleDialogSidebarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string },
    private firestore: Firestore
  ) {
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, {
      idField: 'uid',
    }) as Observable<UserProfile[]>;

    this.users$
      .pipe(
        tap((users) => {
          this.allUsers = users;
        })
      )
      .subscribe();

    this.filteredUsers$ = this.searchTerm.pipe(
      map((term) => {
        if (!term.trim()) return [];
        const searchTerm = term.toLowerCase();
        return this.allUsers.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchTerm) &&
            !this.selectedUsers.some((selected) => selected.uid === user.uid)
        );
      })
    );
  }

  /**
   * Initializes component data
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
   * Selects a user and updates state
   */
  selectUser(user: UserProfile): void {
    if (!this.selectedUsers.some((selected) => selected.uid === user.uid)) {
      this.selectedUsers.push(user);
      this.searchInput = '';
      this.searchTerm.next('');
      this.showDropdown = false;
      setTimeout(() => {
        this.searchInputEl.nativeElement.focus();
      });
    }
  }

  /**
   * Removes a user from selection
   */
  removeUser(user: UserProfile, event: Event): void {
    event.stopPropagation();
    this.selectedUsers = this.selectedUsers.filter(
      (selected) => selected.uid !== user.uid
    );
  }

  /**
   * Adds users to channel and updates Firestore
   */
  async addUsers(users: UserProfile[]): Promise<void> {
    if (!users.length) return;
    try {
      const channelRef = doc(this.firestore, 'channels', this.data.channelId);
      const members = Object.fromEntries(users.map((user) => [user.uid, true]));
      await updateDoc(channelRef, {
        members,
        updatedAt: new Date().toISOString(),
      });
      this.dialogRef?.close();
    } catch (error) {
      console.error('Error adding users to channel:', error);
    }
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
