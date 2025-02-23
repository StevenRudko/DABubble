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
import { ThreadService } from '../../service/open-thread.service';

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

  constructor(
    private userData: UserData,
    private channelData: ChannelService,
    private dialog: MatDialog,
    private presenceService: PresenceService,
    private chatService: ChatService,
    public showHiddeService: ShowHiddeResultsService,
    public userInfo: UserInfosService,
    private threadService: ThreadService
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
    const respondent = threadMessage
      ? this.users.find((user) => user.localID === threadMessage.authorId) : undefined;
    const threadChannel = this.channels.find((channel) => threadMessage?.channelId === channel.channelId)
    const threadDirectUser = threadMessage
      ? this.users.find((user) => user.localID === threadMessage.directUserId) : undefined;

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
      channelName: channel?.name || threadChannel?.name || 'Gelöscht',
      directUserName: directMessageName?.username || threadDirectUser?.username || 'Gelöscht',
      nameOfTheRespondent: respondent?.username || 'Gelöscht',
      idOfTheRespondentMessage: threadMessage?.userMessageId || 'Gelöscht',
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

    // Prüfe, ob der Benutzer Teil des Channels ist 
    if (msg.authorId) {
      return this.isUserInChannelThread(msg);
    }
    return false;
  }

  isUserInChannel(channelId: string): boolean {
    return this.channels.some(
      ch => ch.channelId === channelId && ch.members?.[this.userInfo.uId] === true
    );
  }

  isUserInChannelThread(message: UserMessageInterface): boolean {
    const mainMessage = this.userMessages.find(msg => msg.comments.includes(message.userMessageId));
    if (!mainMessage) {
      return false;
    } else if (this.isUserInChannel(mainMessage.channelId)) {
      return true;
    } else {
      if (this.userMessages.find(msg => msg.directUserId === message.authorId && message.authorId === this.userInfo.uId
        || msg.directUserId === message.authorId && mainMessage.directUserId === this.userInfo.uId)) {       
        return true
      } else {
        return false
      }
    }
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

  async openMessage(channelId: string, messageId: string) {
    this.switchAutoScroll(false);
    await this.showChannel(channelId);
    this.scrollWhenAvailable(messageId, 'chatContainer');
    this.switchAutoScroll(true);
  }

  async showChannel(channelId: string): Promise<void> {
    const currentChannel = await lastValueFrom(this.chatService.currentChannel$.pipe(take(1)));
    if (!currentChannel || currentChannel.id !== channelId) {
      this.chatService.selectChannel(channelId);
    }
    this.showHiddeService.setShowResult(false);
  }

  async openDirectMessage(result: any) {
    this.switchAutoScroll(false);
    await this.showDirectMessage(result);
    this.scrollWhenAvailable(result.userMessageId, 'chatContainer');
    this.switchAutoScroll(true);
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
    this.switchAutoScroll(false);
    if (result.channelId) {
      await this.showChannel(result.channelId);
      this.scrollWhenAvailable(result.idOfTheRespondentMessage, 'chatContainer');
      await this.threadService.openThread(result.idOfTheRespondentMessage)
      this.scrollWhenAvailable(result.userMessageId, 'messagesContainer');
    } else if (result.directUserId) {
      await this.showDirectMessage(result);
      this.scrollWhenAvailable(result.idOfTheRespondentMessage, 'chatContainer');
      await this.threadService.openThread(result.idOfTheRespondentMessage)
      this.scrollWhenAvailable(result.userMessageId, 'messagesContainer');
    }

    this.scrollWhenAvailable(result.messageId, 'chatContainer');
    this.switchAutoScroll(true);
  }

  scrollWhenAvailable(messageId: string, domId: string) {
    const observer = new MutationObserver((mutations, obs) => {
      let checkCounter = 0;
      const maxChecks = 20; // Maximale Versuche
      const scrollOffset = 250; // Offset für z. B. Navbar

      const interval = setInterval(() => {
        const element = document.getElementById(messageId);
        const container = document.querySelector(`#${domId}`); // ID korrekt als Selector nutzen

        // console.log(`Versuch ${checkCounter + 1}:`, element, container);

        if (element && container) {
          const targetScroll = element.offsetTop - scrollOffset;
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
          console.log('Scrolling erfolgreich mit Offset:', scrollOffset);

          clearInterval(interval);
          observer.disconnect(); // MutationObserver deaktivieren
          this.highlightMessage(element);
        }

        if (++checkCounter >= maxChecks) {
          console.warn('Scroll-Element oder Container nicht gefunden.');
          clearInterval(interval);
          observer.disconnect(); // Sicherheitshalber auch hier beenden
        }
      }, 200);

      obs.disconnect(); // Observer nach dem ersten Trigger direkt deaktivieren
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  highlightMessage(element: HTMLElement | null) {
    if (element) {
      element.classList.add('highlight');

      setTimeout(() => {
        element.classList.remove('highlight');
      }, 3000);
    }
  }

  switchAutoScroll(status: boolean) {
    if (!status) {
      this.chatService.autoScroll = status;
    } else {
      setTimeout(() => this.chatService.autoScroll = status, 3000)
    }
  }
}