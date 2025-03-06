import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import {
  UserMessageInterface,
  renderMessageInterface,
} from '../../models/user-message';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../models/user-interface';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../shared/profile-overview/profile-overview.component';
import { UserOverviewComponent } from '../../shared/user-overview/user-overview.component';
import { ScrollService } from '../../service/scroll.service';

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent implements OnInit, OnDestroy {
  @Output() openThreadEvent = new EventEmitter<string>();
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  days = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];

  timeDateToday: any;
  msgTime: any;
  msgDateTime: any;
  todayDateTime: any;
  msgTimeHours: any;
  msgTimeMins: any;
  userName: string = '';
  currentUser: string = '';
  ownMessageStyle: boolean = false;
  emojiList: { [key: string]: string } = {};
  userMessages: UserMessageInterface[] = [];
  user: UserInterface[] = [];
  subscription!: Subscription;
  activeEmojiPicker: string | null = null;
  allMessages: renderMessageInterface[] = [];
  groupedMessages: { [date: string]: renderMessageInterface[] } = {};
  currentAuthUser: any;
  currentDirectUser: any;
  authorPhotoURl: any;
  threadMessageId: string | null = null;
  private isUserScrolled = false;
  userMessages$: Observable<any> = new Observable<any>();
  users$: Observable<any> = new Observable<any>();
  currentChannel$!: Observable<any>;
  currentDirectUser$!: Observable<any>;
  isNewMessage$!: Observable<boolean>;
  private totalMessageCount = 0;

  constructor(
    private userData: UserData,
    private cdr: ChangeDetectorRef,
    public chatService: ChatService,
    private authService: AuthService,
    private dialog: MatDialog,
    private scrollService: ScrollService
  ) {
    this.currentChannel$ = this.chatService.currentChannel$;
    this.currentDirectUser$ = this.chatService.currentDirectUser$;
    this.isNewMessage$ = this.chatService.isNewMessage$;
  }

  /**
   * Initializes component subscriptions
   */
  async ngOnInit(): Promise<void> {
    this.setupDataSubscription();
    return Promise.resolve();
  }

  /**
   * Sets up main data subscription
   */
  private setupDataSubscription(): void {
    this.subscription = combineLatest([
      this.userData.users$,
      this.userData.userMessages$,
      this.chatService.currentChannel$,
      this.chatService.currentDirectUser$,
      this.authService.user$,
    ]).subscribe(
      ([users, messages, currentChannel, directUser, currentAuthUser]) => {
        this.handleDataUpdate(
          users,
          messages,
          currentChannel,
          directUser,
          currentAuthUser
        );
      }
    );
  }

  /**
   * Handles data updates from subscription
   */
  private handleDataUpdate(
    users: any[],
    messages: any[],
    currentChannel: any,
    directUser: any,
    currentAuthUser: any
  ): void {
    this.user = users;
    this.currentAuthUser = currentAuthUser;
    this.currentDirectUser = directUser;
    this.userMessages = this.filterMessages(
      messages,
      currentChannel,
      directUser,
      currentAuthUser
    );
    this.allMessages = [];
    this.initChat();
  }

  /**
   * Filters messages based on channel or direct message context
   */
  private filterMessages(
    messages: UserMessageInterface[],
    currentChannel: any,
    directUser: any,
    currentAuthUser: any
  ): UserMessageInterface[] {
    if (currentChannel) {
      return messages.filter(
        (msg) => msg.channelId && msg.channelId.toString() === currentChannel.id
      );
    }
    if (directUser && currentAuthUser) {
      return this.filterDirectMessages(messages, directUser, currentAuthUser);
    }
    return [];
  }

  /**
   * Filters direct messages between users
   */
  private filterDirectMessages(
    messages: UserMessageInterface[],
    directUser: any,
    currentAuthUser: any
  ): UserMessageInterface[] {
    return messages.filter((msg) => {
      return (
        msg.directUserId &&
        ((msg.authorId === currentAuthUser.uid &&
          msg.directUserId === directUser.uid) ||
          (msg.authorId === directUser.uid &&
            msg.directUserId === currentAuthUser.uid))
      );
    });
  }

  /**
   * Initializes chat data
   */
  private initChat(): void {
    this.getTimeToday();
    this.loadMessages();
  }

  /**
   * Gets current date formatted
   */
  private getTimeToday(): void {
    const todayTimeStamp = new Date().getTime();
    this.timeDateToday = this.formatTimeStamp(todayTimeStamp);
  }

  /**
   * Formats timestamp to date string
   */
  private formatTimeStamp(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getDate()} ${
      this.months[date.getMonth()]
    } ${date.getFullYear()}`;
  }

  /**
   * Loads and processes messages
   */
  private loadMessages(): void {
    if (!this.userMessages || this.allMessages.length > 0) return;

    this.resetMessageArrays();
    this.processMessages();
    this.sortMessagesByTime();
    this.groupMessagesByDate();
    this.calculateTotalMessageCount();

    // Scroll nach dem Laden der Nachrichten
    setTimeout(() => {
      this.scrollService.scrollToBottom(this.chatContainer, true);
    }, 0);
  }

  /**
   * Resets message arrays
   */
  private resetMessageArrays(): void {
    this.allMessages = [];
    this.groupedMessages = {};
  }

  /**
   * Processes all messages
   */
  private processMessages(): void {
    this.userMessages.forEach((msg) => {
      this.getMsgTime(msg);
      this.getUserNameAndPhoto(msg);
      this.getAllMessages(msg);
    });
  }

  /**
   * Formats time units
   */
  private formatTimeUnit(unit: number): string {
    return unit < 10 ? `0${unit}` : `${unit}`;
  }

  /**
   * Processes message timestamp
   */
  private getMsgTime(msg: UserMessageInterface): void {
    const timestamp: any = msg.time;
    this.msgTime = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;

    const exactTime = new Date(this.msgTime);
    this.msgTimeHours = this.formatTimeUnit(exactTime.getHours());
    this.msgTimeMins = this.formatTimeUnit(exactTime.getMinutes());

    this.setDateTimes(exactTime);
  }

  /**
   * Sets date time values
   */
  private setDateTimes(exactTime: Date): void {
    this.msgDateTime = new Date(exactTime);
    this.msgDateTime.setHours(0, 0, 0, 0);

    this.todayDateTime = new Date(this.timeDateToday);
    this.todayDateTime.setHours(0, 0, 0, 0);
  }

  /**
   * Gets user data for message
   */
  private getUserNameAndPhoto(msg: UserMessageInterface): void {
    const userFound = this.user.find((user) => user.localID === msg.authorId);
    if (userFound) {
      this.userName = userFound.username;
      this.authorPhotoURl =
        userFound.photoURL || 'img-placeholder/default-avatar.svg';
    }
  }

  /**
   * Formats message for display
   */
  private getAllMessages(msg: UserMessageInterface): void {
    if (!this.userName) return;

    this.allMessages.push({
      timestamp: this.msgTime,
      userMessageId: msg.userMessageId,
      author: this.userName,
      authorPhoto: this.authorPhotoURl,
      emojis: msg.emojis,
      message: msg.message,
      isOwnMessage: msg.authorId === this.currentAuthUser.uid,
      hours: this.msgTimeHours,
      minutes: this.msgTimeMins,
      authorId: msg.authorId
    });
  }

  /**
   * Sorts messages by timestamp
   */
  private sortMessagesByTime(): void {
    this.allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Groups messages by date
   */
  private groupMessagesByDate(): void {
    const today = new Date().setHours(0, 0, 0, 0);

    this.allMessages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).setHours(0, 0, 0, 0);
      const dateKey = msgDate === today ? 'HEUTE' : msgDate.toString();

      if (!this.groupedMessages[dateKey]) {
        this.groupedMessages[dateKey] = [];
      }

      if (
        !this.groupedMessages[dateKey].some(
          (existingMsg) => existingMsg.userMessageId === msg.userMessageId
        )
      ) {
        this.groupedMessages[dateKey].push(msg);
      }
    });

    this.moveToDateToEnd();
  }

  /**
   * Calculate total message count from all groups
   */
  private calculateTotalMessageCount(): void {
    this.totalMessageCount = Object.values(this.groupedMessages).reduce(
      (total, messages) => total + messages.length,
      0
    );
  }

  /**
   * Moves today's messages to end
   */
  private moveToDateToEnd(): void {
    if (this.groupedMessages['HEUTE']) {
      const todayMessages = this.groupedMessages['HEUTE'];
      delete this.groupedMessages['HEUTE'];
      this.groupedMessages['HEUTE'] = todayMessages;
    }
  }

  // onScroll-Methode ändern
  onScroll(): void {
    if (this.chatContainer) {
      this.scrollService.onScroll(this.chatContainer.nativeElement);
    }
  }

  // ngAfterViewChecked-Methode anpassen
  ngAfterViewChecked(): void {
    this.scrollService.handleNewMessages(
      this.chatContainer,
      this.totalMessageCount
    );
  }

  /**
   * Handles view initialization
   */
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    // Verzögerter Scroll für bessere Chancen
    setTimeout(() => {
      this.scrollService.scrollToBottom(this.chatContainer, true);
    }, 100);
  }

  /**
   * Cleans up subscriptions
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Emits thread open event
   */
  openThread(): void {
    this.openThreadEvent.emit();
  }

  /**
   * Gets current user's photo URL
   */
  getCurrentUserPhotoURL(): string {
    if (this.currentDirectUser) {
      return (
        this.currentDirectUser.photoURL || 'img-placeholder/default-avatar.svg'
      );
    }
    return (
      this.currentAuthUser?.photoURL || 'img-placeholder/default-avatar.svg'
    );
  }

  /**
   * Gets current user's name
   */
  getCurrentUserName(): string {
    if (this.currentDirectUser) {
      return (
        this.currentDirectUser.username ||
        this.currentDirectUser.displayName ||
        'Unnamed User'
      );
    }
    return this.currentAuthUser?.displayName || 'You';
  }

  /**
   * Gets current user's email
   */
  getCurrentUserEmail(): string {
    if (this.currentDirectUser) {
      return this.currentDirectUser.email || '';
    }
    return this.currentAuthUser?.email || '';
  }

  /**
   * Opens profile dialog
   */
  openProfileDialog(): void {
    if (this.isOwnProfile()) {
      this.openOwnProfileDialog();
    } else {
      this.openOtherProfileDialog();
    }
  }

  /**
   * Opens own profile dialog
   */
  private openOwnProfileDialog(): void {
    this.dialog.open(UserOverviewComponent, {
      panelClass: ['profile-dialog', 'right-aligned'],
      width: '400px',
    });
  }

  /**
   * Opens other user's profile dialog
   */
  private openOtherProfileDialog(): void {
    const userData = {
      username: this.currentDirectUser.username,
      email: this.currentDirectUser.email,
      photoURL:
        this.currentDirectUser.photoURL || 'img-placeholder/default-avatar.svg',
      uid: this.currentDirectUser.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: ['profile-dialog', 'center-aligned'],
      width: '400px',
    });
  }

  /**
   * Checks if current profile is own
   */
  isOwnProfile(): boolean {
    return (
      !this.currentDirectUser ||
      this.currentDirectUser.uid === this.currentAuthUser?.uid
    );
  }

  /**
   * Gets formatted creation time
   */
  getChannelCreationTime(createdAt: string): string {
    const creationDate = new Date(createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (creationDate >= today) return 'today';
    if (creationDate >= yesterday) return 'yesterday';

    return `on ${creationDate.getDate()}. ${
      this.months[creationDate.getMonth()]
    } ${creationDate.getFullYear()}`;
  }

  /**
   * Sets the active emoji picker for a message
   * @param messageId - ID of message with active picker, or null to close
   */
  setActiveEmojiPicker(messageId: string | null): void {
    this.activeEmojiPicker = messageId;
  }
}
