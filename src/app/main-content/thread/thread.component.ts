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
} from '../../models/user-message';
import { Subscription } from 'rxjs';
import { ChatService } from '../../service/chat.service';

interface FirestoreMessage {
  authorId: string;
  message: string;
  time: {
    seconds: number;
    nanoseconds: number;
  };
  comments?: string[];
  channelId?: string;
  directUserId?: string;
  emojis?: EmojiReaction[];
  id?: string;
}

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

  private isUserScrolled = false;
  private subscriptions: Subscription = new Subscription();
  private lastMessageCount = 0;

  constructor(
    private userData: UserData,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    this.initializeSubscriptions();
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  /**
   * Initialize component subscriptions for user and thread state
   */
  private initializeSubscriptions(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => (this.currentUser = user))
    );

    this.subscriptions.add(
      this.chatService.threadOpen$.subscribe((isOpen) => {
        if (!isOpen) this.closeThread();
      })
    );
  }

  /**
   * Initialize thread component and load messages
   */
  ngOnInit(): void {
    if (this.messageId) {
      this.loadParentMessage(this.messageId);
      this.loadThreadMessages(this.messageId);
      this.setupMessageUpdates();
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  private setupMessageUpdates(): void {
    this.subscriptions.add(
      this.userData.userMessages$.subscribe(() => {
        if (this.messageId) this.loadThreadMessages(this.messageId);
      })
    );
  }

  /**
   * Check and scroll to bottom when new messages arrive
   */
  ngAfterViewChecked(): void {
    if (this.threadMessages.length > this.lastMessageCount) {
      this.scrollToBottom();
      this.lastMessageCount = this.threadMessages.length;
    }
  }

  /**
   * Clean up subscriptions on component destruction
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Handle scroll events in the message container
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
   * Scroll to bottom of message container if user hasn't scrolled up
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
   * Get user data from Firestore
   */
  private async getUserData(authorId: string): Promise<UserInterface> {
    return (await this.userData.getUserById(authorId)) as UserInterface;
  }

  /**
   * Create message metadata with timestamp and date
   */
  private createMessageMetadata(time: {
    seconds: number;
    nanoseconds: number;
  }) {
    const timestamp = this.calculateTimestamp(time);
    return {
      timestamp,
      date: new Date(timestamp),
    };
  }

  /**
   * Build message author information
   */
  private buildAuthorInfo(user: UserInterface) {
    return {
      author: user?.username || 'Unknown',
      authorPhoto: user?.photoURL || 'img-placeholder/default-avatar.svg',
    };
  }

  /**
   * Convert raw Firestore message to formatted message interface
   */
  private async formatMessage(
    messageData: FirestoreMessage,
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
   * Calculate timestamp from Firestore time object
   */
  private calculateTimestamp(time: {
    seconds: number;
    nanoseconds: number;
  }): number {
    return time.seconds * 1000 + time.nanoseconds / 1000000;
  }

  /**
   * Load and format parent message
   */
  private async loadParentMessage(messageId: string): Promise<void> {
    try {
      const rawMessage = await this.userData.getMessage(messageId);
      if (!rawMessage) return;

      const messageData = { ...rawMessage, id: messageId } as FirestoreMessage;
      const formattedMessage = await this.formatMessage(messageData, messageId);

      if (formattedMessage) {
        this.parentMessage = [formattedMessage];
      }
    } catch (error) {
      console.error('Error loading parent message:', error);
    }
  }

  /**
   * Load and format thread messages
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
   * Format array of thread messages
   */
  private async formatThreadMessages(
    comments: any[]
  ): Promise<(renderMessageInterface | null)[]> {
    return Promise.all(
      comments.map(async (comment) => {
        if (!comment || !comment.authorId) return null;
        return this.formatMessage(comment, comment.id || '');
      })
    );
  }

  /**
   * Close thread and emit event
   */
  closeThread(): void {
    this.closeThreadEvent.emit();
  }
}
