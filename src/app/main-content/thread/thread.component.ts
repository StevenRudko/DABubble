import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { MatIconModule } from '@angular/material/icon';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { UserInterface } from '../../models/user-interface';
import {
  renderMessageInterface,
  EmojiReaction,
  UserMessageInterface,
} from '../../models/user-message';
import { Subscription } from 'rxjs';
import { ChatService } from '../../service/chat.service';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    UserMessageComponent,
    MessageInputBoxComponent,
  ],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Input() messageId: string | null = null;
  @Output() closeThreadEvent = new EventEmitter<void>();
  @Input() threadData!: { messageId: string; emojiAuthors: string[] };

  parentMessage: renderMessageInterface[] | null = null;
  threadMessages: renderMessageInterface[] = [];
  replyCount: number = 0;
  currentUser: any;
  isMobile: boolean = window.innerWidth <= 1024;
  currentChannelName: string = '';
  allUsers: UserInterface[] = [];
  activeEmojiPicker: string | null = null;

  private isUserScrolled = false;
  private subscriptions: Subscription = new Subscription();
  private lastMessageCount = 0;

  /**
   * Initialize component and setup required services
   */
  constructor(
    private userData: UserData,
    private authService: AuthService,
    private chatService: ChatService,
    private firestore: Firestore
  ) {
    this.initializeSubscriptions();
    this.checkScreenSize();
    this.loadAllUsers();
  }

  /**
   * Updates mobile view state on window resize
   */
  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  /**
   * Handles the emoji picker toggle state for thread messages
   * @param messageId - The ID of the message for which the emoji picker should be shown, or null to close
   */
  handleEmojiPicker(messageId: string | null): void {
    this.activeEmojiPicker = messageId;
  }

  /**
   * Sets up subscriptions for user and thread state
   */
  private initializeSubscriptions(): void {
    this.setupAuthSubscription();
    this.setupThreadSubscription();
    this.setupChannelSubscription();
    this.setupDirectMessageSubscription();
  }

  /**
   * Sets up authentication subscription
   */
  private setupAuthSubscription(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => (this.currentUser = user))
    );
  }

  /**
   * Sets up thread state subscription
   */
  private setupThreadSubscription(): void {
    this.subscriptions.add(
      this.chatService.threadOpen$.subscribe((isOpen) => {
        if (!isOpen) this.closeThread();
      })
    );
  }

  /**
   * Sets up channel subscription
   */
  private setupChannelSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        if (channel) {
          this.currentChannelName = channel.name;
        }
      })
    );
  }

  /**
   * Sets up direct message subscription
   */
  private setupDirectMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentDirectUser$.subscribe(async (directUser) => {
        if (directUser) {
          await this.updateDirectUserChannelName(directUser);
        } else {
          this.currentChannelName = '';
        }
      })
    );
  }

  /**
   * Updates channel name for direct message user
   */
  private async updateDirectUserChannelName(directUser: any): Promise<void> {
    try {
      const userData = (await this.userData.getUserById(
        directUser.uid
      )) as UserInterface;
      this.currentChannelName =
        userData?.username || directUser.displayName || 'Unnamed User';
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.currentChannelName = directUser.displayName || 'Unnamed User';
    }
  }

  /**
   * Initializes component and loads messages
   */
  ngOnInit(): void {
    if (this.messageId) {
      this.loadParentMessage(this.messageId);
      this.loadThreadMessages(this.messageId);
      this.setupMessageUpdates();
    }
  }

  /**
   * Sets up real-time message updates
   */
  private setupMessageUpdates(): void {
    this.subscriptions.add(
      this.userData.userMessages$.subscribe(() => {
        if (this.messageId) this.loadThreadMessages(this.messageId);
      })
    );
  }

  /**
   * Handles scrolling to bottom for new messages
   */
  ngAfterViewChecked(): void {
    if (this.threadMessages.length > this.lastMessageCount) {
      this.scrollToBottom();
      this.lastMessageCount = this.threadMessages.length;
    }
  }

  /**
   * Cleans up subscriptions
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Handles message container scroll events
   */
  onScroll(event: any): void {
    const element = this.messagesContainer.nativeElement;
    const atBottom =
      Math.abs(
        element.scrollHeight - element.scrollTop - element.clientHeight
      ) < 50;
    this.isUserScrolled = !atBottom;
  }

  /**
   * Scrolls to bottom of message container
   */
  private scrollToBottom(): void {
    try {
      if (!this.isUserScrolled && this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Retrieves user data from Firestore
   */
  private async getUserData(authorId: string): Promise<UserInterface> {
    return (await this.userData.getUserById(authorId)) as UserInterface;
  }

  /**
   * Creates message metadata from timestamp
   */
  private createMessageMetadata(time: any) {
    const timestamp = this.calculateTimestamp(time);
    return {
      timestamp,
      date: new Date(timestamp),
    };
  }

  /**
   * Builds author information object
   */
  private buildAuthorInfo(user: UserInterface) {
    return {
      author: user?.username || 'Unknown',
      authorPhoto: user?.photoURL || 'img-placeholder/default-avatar.svg',
    };
  }

  /**
   * Formats Firestore message data
   */
  private async formatMessage(
    messageData: any,
    messageId: string
  ): Promise<renderMessageInterface | null> {
    if (!messageData || !messageData.authorId) return null;

    const user = await this.getUserData(messageData.authorId);
    const { timestamp, date } = this.createMessageMetadata(messageData.time);
    const { author, authorPhoto } = this.buildAuthorInfo(user);

    return {
      timestamp,
      userMessageId: messageId,
      author,
      authorPhoto,
      message: messageData.message,
      isOwnMessage: messageData.authorId === this.currentUser?.uid,
      emojis: messageData.emojis || [],
      hours: date.getHours(),
      minutes: date.getMinutes(),
    };
  }

  /**
   * Calculates timestamp from Firestore time
   */
  private calculateTimestamp(time: any): number {
    if (time && typeof time === 'object' && 'seconds' in time) {
      return time.seconds * 1000 + (time.nanoseconds || 0) / 1000000;
    }
    return typeof time === 'number' ? time : Date.now();
  }

  /**
   * Loads and formats parent message
   */
  private async loadParentMessage(messageId: string): Promise<void> {
    try {
      const rawMessage = await this.userData.getMessage(messageId);
      if (!rawMessage) return;

      const messageData = { ...rawMessage, userMessageId: messageId };
      const formattedMessage = await this.formatMessage(messageData, messageId);

      if (formattedMessage) {
        this.parentMessage = [formattedMessage];
      }
    } catch (error) {
      console.error('Error loading parent message:', error);
    }
  }

  /**
   * Loads and formats thread messages
   */
  private async loadThreadMessages(parentId: string): Promise<void> {
    try {
      const rawComments = await this.userData.getThreadMessages(parentId);
      this.replyCount = rawComments.length;

      const messages = await this.formatThreadMessages(rawComments);
      this.threadMessages = messages.filter(
        (msg): msg is renderMessageInterface => msg !== null
      );
    } catch (error) {
      console.error('Error loading thread messages:', error);
    }
  }

  /**
   * Formats array of thread messages
   */
  private async formatThreadMessages(
    comments: any[]
  ): Promise<(renderMessageInterface | null)[]> {
    return Promise.all(
      comments.map(async (comment) => {
        if (!comment || !comment.authorId) return null;
        return this.formatMessage(
          comment,
          comment.id || comment.userMessageId || ''
        );
      })
    );
  }

  /**
   * Closes thread and emits event
   */
  closeThread(): void {
    this.closeThreadEvent.emit();
  }

  /**
   * Loads all users from Firestore
   */
  private async loadAllUsers(): Promise<void> {
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      this.allUsers = usersSnapshot.docs.map(
        (doc) =>
          ({
            username: doc.data()['username'] || doc.data()['displayName'] || '',
            email: doc.data()['email'] || '',
            photoURL: doc.data()['photoURL'] || null,
            localID: doc.id,
            uid: doc.id,
            online: false,
          } as UserInterface)
      );
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
}
