// sidebar.component.ts
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
  channels$: Observable<Channel[]>;
  currentUser$: Observable<User | null>;
  allUsers$: Observable<UserProfile[]>;
  isChannelSectionExpanded: boolean = true;
  isDirectMessageSectionExpanded: boolean = true;

  constructor(
    private dialog: MatDialog,
    private firestore: Firestore,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    // Channels laden
    const channelsCollection = collection(this.firestore, 'channels');
    this.channels$ = collectionData(channelsCollection, {
      idField: 'id',
    }) as Observable<Channel[]>;

    // Aktuellen Benutzer laden
    this.currentUser$ = this.authService.user$;

    // Alle Benutzer aus Firestore laden
    const usersCollection = collection(this.firestore, 'users');
    this.allUsers$ = collectionData(usersCollection) as Observable<
      UserProfile[]
    >;
  }

  ngOnInit() {
    // Weitere Initialisierungen falls nötig
  }

  openChannelDialog() {
    const dialogRef = this.dialog.open(ChannelDialogComponent);
  }

  toggleChannelSection() {
    this.isChannelSectionExpanded = !this.isChannelSectionExpanded;
  }

  toggleDirectMessageSection() {
    this.isDirectMessageSectionExpanded = !this.isDirectMessageSectionExpanded;
  }

  isCurrentUser(userId: string): Observable<boolean> {
    return this.currentUser$.pipe(map((user) => user?.uid === userId));
  }

  getPhotoURL(user: User | UserProfile): string {
    return user.photoURL || 'img-placeholder/default-avatar.svg';
  }

  getDisplayName(user: User | UserProfile): string {
    if ('username' in user && user.username) {
      return user.username;
    }
    return user.displayName || 'Unbenannter Benutzer';
  }

  selectChannel(channelId: string) {
    this.chatService.selectChannel(channelId);
  }

  selectDirectMessage(userId: string) {
    this.chatService.selectDirectMessage(userId);
  }
}
