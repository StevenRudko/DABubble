import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { ChannelService } from '../../service/channel.service';
import { UserMessageInterface } from '../../models/user-message';
import { UserInterface } from '../../models/user-interface';
import { SearchResult } from '../../models/search-result';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../shared/profile-overview/profile-overview.component';
import { PresenceService } from '../../service/presence.service';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit {
  @Input() searchQuery: string = '';
  @Input() showResult: boolean = false;
  @Output() borderTrigger = new EventEmitter<boolean>();
  searchResults: SearchResult[] = [];

  private userMessages: UserMessageInterface[] = [];
  private users: UserInterface[] = [];

  constructor(
    private userData: UserData,
    // private channelData: ChannelService
    private dialog: MatDialog,
    private presenceService: PresenceService,
  ) { }

  ngOnInit(): void {
    this.userData.userMessages$.subscribe((messages) => {
      this.userMessages = messages;
    });

    this.userData.users$.subscribe((users) => {
      this.users = users;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.filterResults();
    }
  }

  private filterResults() {
    const query = this.searchQuery.toLowerCase();

    const filteredMessages = this.userMessages
      .filter((msg) =>
        msg.message?.toLowerCase().includes(query)
      ).map((msg) => {
        if (msg.channelId) {
          return this.filterMessage(msg, 'message');
        } else if (msg.directUserId) {
          return this.filterMessage(msg, 'directMessage');
        } else if (msg.comments) {
          return this.filterMessage(msg, 'thread');
        } else { return }
      }).filter((msg): msg is SearchResult => msg !== undefined);

    const filteredUsers = this.filterUser(query);

    if (this.searchQuery) {
      this.searchResults = [...filteredMessages, ...filteredUsers];
    } else {
      this.searchResults = [];
    }
    this.updateBorderTrigger();
  }

  filterMessage(msg: UserMessageInterface, type: string) {
    const author = this.users.find(user => user.localID === msg.authorId);
    return {
      type: type || '',
      authorId: msg.authorId || '',
      username: author!.username || 'Gelöscht',
      photoURL: author!.photoURL || 'img-placeholder/default-avatar.svg',
      channelId: msg.channelId || 0,
      directUserId: msg.directUserId || '',
      comments: msg.comments || [],
      emojis: msg.emojis || [],
      message: msg.message || '',
      time: msg.time || 0,
      userMessageId: msg.userMessageId || ''
    };
  }

  filterUser(query: string) {
    return this.users
      .filter((user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
      .map((user) => ({
        type: 'user',
        username: user.username,
        localID: user.localID,
        photoURL: user.photoURL,
        email: user.email,
      }))
      .filter((msg): msg is SearchResult => msg !== undefined);
  }

  private updateBorderTrigger(): void {
    const isEmpty = this.searchResults.length !== 0; // Beispiel-Logik
    this.borderTrigger.emit(isEmpty); // Emit den neuen Wert direkt
  }

  logSomething() {
    console.log('works');
  }

  showProfile(result: SearchResult) {
    const dialogConfig = {
      data: result,
      panelClass: false
        ? ['profile-dialog', 'right-aligned']
        : ['profile-dialog', 'center-aligned'],
      width: '400px',
    };

    this.dialog.open(ProfileOverviewComponent, dialogConfig);
  }

  getPresenceStatus(id: string): boolean {
    let isOnline = false;
    this.presenceService.onlineUsers$.subscribe((onlineUsers) => {
      isOnline = onlineUsers[id] === 'online';
    }).unsubscribe();

    return isOnline;
  }
}