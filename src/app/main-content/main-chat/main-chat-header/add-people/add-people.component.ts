// add-people.component.ts
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
  DocumentData,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChatService } from '../../../../service/chat.service';

interface UserProfile {
  uid: string;
  email: string;
  photoURL: string | null;
  username: string;
  online?: boolean;
}

interface ChannelData extends DocumentData {
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  members: { [key: string]: boolean };
}

@Component({
  selector: 'app-add-people',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './add-people.component.html',
  styleUrl: './add-people.component.scss',
})
export class AddPeopleComponent implements OnInit {
  @ViewChild('searchInputEl') searchInputEl!: ElementRef;

  channelName: string = '';
  currentChannelId: string = '';
  searchInput = '';
  searchTerm = new BehaviorSubject<string>('');
  users$: Observable<UserProfile[]>;
  filteredUsers$: Observable<UserProfile[]>;
  selectedUsers: UserProfile[] = [];
  showDropdown = false;
  allUsers: UserProfile[] = [];
  currentMembers: Set<string> = new Set();

  constructor(
    public dialogRef: MatDialogRef<AddPeopleComponent>,
    private firestore: Firestore,
    private chatService: ChatService
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
            !this.selectedUsers.some((selected) => selected.uid === user.uid) &&
            !this.currentMembers.has(user.uid)
        );
      })
    );
  }

  ngOnInit() {
    this.chatService.currentChannel$.subscribe(async (channel) => {
      if (channel) {
        this.currentChannelId = channel.id;
        this.channelName = channel.name;

        // Lade aktuelle Mitglieder
        const channelDoc = await getDoc(
          doc(this.firestore, 'channels', channel.id)
        );
        if (channelDoc.exists()) {
          const data = channelDoc.data() as ChannelData;
          this.currentMembers = new Set(
            Object.entries(data['members'] || {})
              .filter(([_, value]) => value === true)
              .map(([key]) => key)
          );
        }
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  onSearchInput(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.searchInput = input.value;
    this.searchTerm.next(input.value);
    this.showDropdown = true;
  }

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

  removeUser(user: UserProfile, event: Event): void {
    event.stopPropagation();
    this.selectedUsers = this.selectedUsers.filter(
      (selected) => selected.uid !== user.uid
    );
  }

  async addUsers(): Promise<void> {
    if (!this.selectedUsers.length) return;

    try {
      const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
      const channelDoc = await getDoc(channelRef);

      if (channelDoc.exists()) {
        const currentData = channelDoc.data() as ChannelData;
        const currentMembers = currentData['members'] || {};

        const updatedMembers = {
          ...currentMembers,
          ...Object.fromEntries(
            this.selectedUsers.map((user) => [user.uid, true])
          ),
        };

        await updateDoc(channelRef, {
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        });

        // Trigger a refresh of the channel members
        await this.chatService.getChannelMembers(this.currentChannelId);

        this.dialogRef.close();
      }
    } catch (error) {
      console.error('Error adding users to channel:', error);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  getPhotoURL(user: UserProfile): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }
}
