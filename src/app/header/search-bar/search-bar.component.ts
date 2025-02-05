import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { ChannelService } from '../../service/channel.service';
import { UserMessageInterface } from '../../models/user-message';
import { UserInterface } from '../../models/user-interface';
import { SearchResult } from '../../models/search-result';
import { MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../shared/profile-overview/profile-overview.component';
import { PresenceService } from '../../service/presence.service';
import { ChatService } from '../../service/chat.service';
import { take } from 'rxjs';
import { ShowHiddeResultsService } from '../../service/show-hidde-results.service';
import { UserInfosService } from '../../service/user-infos.service';
import { ChannelInterface } from '../../models/channel-interface';

@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit {
  @Input() searchQuery: string = '';
  showResult: boolean = false;
  borderTrigger: boolean = false;
  searchResults: SearchResult[] = [];

  private userMessages: UserMessageInterface[] = [];
  private users: UserInterface[] = [];
  private channels: ChannelInterface[] = [];

  // objectKeys = Object.keys;

  constructor(
    private userData: UserData,
    private channelData: ChannelService,
    private dialog: MatDialog,
    private presenceService: PresenceService,
    private chatService: ChatService,
    public showHiddeService: ShowHiddeResultsService,
    public userInfo: UserInfosService,
  ) { }

  ngOnInit(): void {
    this.userData.userMessages$.subscribe(
      (messages) => (this.userMessages = messages)
    );

    this.userData.users$.subscribe((users) => (this.users = users));

    this.channelData.channels$.subscribe(
      (channel) => (this.channels = channel)
    );

    this.showHiddeService.showResult$.subscribe(
      (value) => (this.showResult = value)
    );
    this.showHiddeService.borderTrigger$.subscribe(
      (value) => (this.borderTrigger = value)
    );
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
        // if  msg.message?.toLowerCase().includes(query) == true _> map || if this.isAuthorMatching(msg, query) == true -> map
        msg.message?.toLowerCase().includes(query) && this.canCurrentUserSeeMessage(msg) ||
        // zum filter der nachrichten wenn nach einem user gesucht wird
        // mit der bedingung das nur nachrichten angezeigt werden die in verbindung stehen mit currentUser
        this.isAuthorMatching(msg, query) && this.canCurrentUserSeeMessage(msg)
      ).map((msg) => {
        if (msg.channelId) {
          return this.filterMessage(msg, 'message');
        } else if (msg.directUserId) {
          return this.filterMessage(msg, 'directMessage');
        } else if (!msg.channelId && !msg.directUserId) {          
          return this.filterMessage(msg, 'thread');
        } else {
          return;
        }
      })
      .filter((msg): msg is SearchResult => msg !== undefined);

    const filteredUsers = this.filterUser(query);
    const filteredChannel = this.filterChannel(query);
    if (this.searchQuery) {
      this.searchResults = [...filteredMessages, ...filteredUsers, ...filteredChannel];
    } else {
      this.searchResults = [];
    }
    this.updateBorderTrigger();
  }

  filterMessage(msg: UserMessageInterface, type: string) {
    const author = this.users.find((user) => user.localID === msg.authorId);
    return {
      type: type || '',
      authorId: msg.authorId || '',
      username: author!.username || 'Gelöscht',
      photoURL: author!.photoURL || 'img-placeholder/default-avatar.svg',
      channelId: msg.channelId || '',
      directUserId: msg.directUserId || '',
      comments: msg.comments || [],
      emojis: msg.emojis || [],
      message: msg.message || '',
      time: msg.time || 0,
      userMessageId: msg.userMessageId || '',
    };
  }

  filterUser(query: string) {
    return this.users
      .filter(
        (user) =>
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

  private isAuthorMatching(msg: UserMessageInterface, query: string): boolean {
    const author = this.users.find((user) => user.localID === msg.authorId);
    return author ? author.username.toLowerCase().includes(query) : false;
  }

  private canCurrentUserSeeMessage(msg: UserMessageInterface): boolean {
    // Prüfe, ob die Nachricht an den angemeldeten Benutzer direkt gerichtet ist
    if (msg.directUserId === this.userInfo.uId) {
      return true;
    }
    if (msg.authorId === this.userInfo.uId) {
      return true;
    }

    // Prüfe, ob der Benutzer Teil des Channels ist (falls `channelId` verwendet wird)
    if (msg.channelId) {
      return this.isUserInChannel(msg.channelId);
    }
    // Weitere Regeln hinzufügen, falls nötig
    return false;
  }

  isUserInChannel(channelId: any) {
    const channel = this.channels.find((ch) => ch.channelId === channelId);
    if (channel && channel.members && typeof channel.members === 'object') {
      return channel.members[this.userInfo.uId] === true;
    }
    return false;
  }

  private updateBorderTrigger(): void {
    const isEmpty = this.searchResults.length !== 0;
    if (this.showHiddeService.getBorderTrigger() !== isEmpty) {
      this.showHiddeService.setBorderTrigger(isEmpty);
    }
  }

  showChannel(channelId: string) {
    this.chatService.currentChannel$
      .pipe(take(1))
      .subscribe((currentChannel) => {
        if (!currentChannel || currentChannel.id !== channelId) {
          this.chatService.selectChannel(channelId);
        }
      });
    this.showHiddeService.setShowResult(false);
  }

  showChannelMessage(channelId: string) {
    this.chatService.currentChannel$
      .pipe(take(1))
      .subscribe((currentChannel) => {
        if (!currentChannel || currentChannel.id !== channelId) {
          this.chatService.selectChannel(channelId);
        }
      });
    this.showHiddeService.setShowResult(false);
  }

  showDirectMessage(result: any) {
    if (this.userInfo.uId === result.directUserId) {
      this.chatService.selectDirectMessage(result.authorId);
    } else {
      this.chatService.selectDirectMessage(result.directUserId);
    }
    this.showHiddeService.setShowResult(false);
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
    this.showHiddeService.setShowResult(false);
  }

  getPresenceStatus(id: string): boolean {
    let isOnline = false;
    this.presenceService.onlineUsers$
      .subscribe((onlineUsers) => {
        isOnline = onlineUsers[id] === 'online';
      })
      .unsubscribe();

    return isOnline;
  }

  filterChannel(query: string) {
    return this.channels
      .filter(
        (channel) =>
          channel.name?.toLowerCase().includes(query)
      )
      .map((channel) => {
        return this.channelResultData(channel);
      })
      .filter((channel): channel is SearchResult => channel !== undefined);
  }

  channelResultData(channel: any) {
    if (this.isUserInChannel(channel.channelId)) {
      const members = Object.keys(channel.members).map((uid: string) => {
        const channelMember = this.users.find(user => user.localID === uid);
        return channelMember ? { uid: channelMember.localID, username: channelMember.username, photoURL: channelMember.photoURL } : { uid, username: 'Unknown', photoURL: '' };
      });
      return {
        type: 'channel',
        channelId: channel.channelId,
        channelName: channel.name,
        channelDescription: channel.description,
        channelMembers: members,
      }
    } else {
      return
    }
  }

  logSomething(i: string) {
    console.log('something', i);
  }
}
