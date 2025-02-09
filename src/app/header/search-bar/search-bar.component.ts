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
import { lastValueFrom } from 'rxjs';

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
    const channel = this.channels.find((channel) => channel.channelId === msg.channelId)
    const directMessageName = this.users.find((user) => user.localID === msg.directUserId);
    const threadMessage = this.userMessages.find((message) => {
      return message.comments.includes(msg.userMessageId);
    });
    const nameOfTheRespondent = threadMessage
      ? this.users.find((user) => user.localID === threadMessage.authorId)?.username || 'Unbekannt'
      : 'Unbekannt';

    const threadChannel = this.channels.find((channel) => threadMessage?.channelId === channel.channelId)

    return {
      type: type || '',
      authorId: msg.authorId || '',
      username: author!.username || 'Gelöscht',
      photoURL: author!.photoURL || 'img-placeholder/default-avatar.svg',
      channelId: msg.channelId || threadChannel?.channelId || '',
      directUserId: msg.directUserId || threadMessage?.directUserId || '',
      comments: msg.comments || [],
      emojis: msg.emojis || [],
      message: msg.message || '',
      time: msg.time || 0,
      userMessageId: msg.userMessageId || '',
      channelName: channel?.name || threadChannel?.name || 'not found',
      directUserName: directMessageName?.username || '',
      nameOfTheRespondent: nameOfTheRespondent || '',
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

  async openChannel(channelId: string, messageId: string) {
    await this.showChannel(channelId);
    this.scrollWhenAvailable(messageId, '#chatContainer');
  }

  async showChannel(channelId: string): Promise<void> {
    const currentChannel = await lastValueFrom(this.chatService.currentChannel$.pipe(take(1)));
    if (!currentChannel || currentChannel.id !== channelId) {
      this.chatService.selectChannel(channelId);
    }
    this.showHiddeService.setShowResult(false);
  }

  async openDirectMessage(result: any) {
    await this.showDirectMessage(result);
    this.scrollWhenAvailable(result.userMessageId, '#chatContainer');
  }

  async showDirectMessage(result: any) {
    if (this.userInfo.uId === result.directUserId) {
      const currentDirectUser = await lastValueFrom(this.chatService.currentDirectUser$.pipe(take(1)));
      if (!currentDirectUser || currentDirectUser !== result.authorId) {
        this.chatService.selectDirectMessage(result.authorId);
      }
    } else {
      this.chatService.selectDirectMessage(result.directUserId);
    }
    this.showHiddeService.setShowResult(false);
  }

  async openThread(result: any) {
    console.log(result);
    
  }

  scrollWhenAvailable(messageId: string, domId: string) {
    const observer = new MutationObserver(() => {
      let checkCounter = 0;
      const maxChecks = 20; // Maximale Versuche, um zu verhindern, dass es ewig läuft
      const scrollOffset = 250; // Offset in Pixel (z. B. für eine fixe Navbar)

      const interval = setInterval(() => {
        const element = document.getElementById(messageId);
        const container = document.querySelector(domId);

        console.log(`Versuch ${checkCounter + 1}:`, element, container);

        if (element && container) {
          const targetScroll = element.offsetTop - scrollOffset; // Offset einberechnen
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
          console.log('Scrolling erfolgreich mit Offset:', scrollOffset);

          clearInterval(interval);
          observer.disconnect();
        }

        if (++checkCounter >= maxChecks) {
          console.warn('Scroll-Element oder Container nicht gefunden.');
          clearInterval(interval);
          observer.disconnect();
        }
      }, 200);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }



  logSomething(i: string) {
    console.log('something', i);
  }
}
