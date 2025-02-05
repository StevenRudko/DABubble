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

// Direkte Firestore Datenstruktur
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

  parentMessage: renderMessageInterface[] | null = null;
  threadMessages: renderMessageInterface[] = [];
  replyCount: number = 0;
  currentUser: any;
  private isUserScrolled = false;
  private subscriptions: Subscription = new Subscription();
  private lastMessageCount = 0;

  constructor(
    private userData: UserData,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    // Initialize user subscription
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );

    // Subscribe to thread state changes
    this.subscriptions.add(
      this.chatService.threadOpen$.subscribe((isOpen) => {
        if (!isOpen) {
          this.closeThread();
        }
      })
    );
  }

  ngOnInit() {
    if (this.messageId) {
      this.loadParentMessage(this.messageId);
      this.loadThreadMessages(this.messageId);

      // Echtzeit-Updates für Thread-Nachrichten
      this.subscriptions.add(
        this.userData.userMessages$.subscribe(() => {
          if (this.messageId) {
            this.loadThreadMessages(this.messageId);
          }
        })
      );
    }
  }

  ngAfterViewChecked() {
    // Nur scrollen wenn neue Nachrichten hinzugekommen sind
    if (this.threadMessages.length > this.lastMessageCount) {
      this.scrollToBottom();
      this.lastMessageCount = this.threadMessages.length;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onScroll(event: any): void {
    const element = this.messagesContainer.nativeElement;
    const atBottom =
      Math.abs(
        element.scrollHeight - element.scrollTop - element.clientHeight
      ) < 50;
    this.isUserScrolled = !atBottom;
  }

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

  private async loadParentMessage(messageId: string) {
    try {
      const rawMessage = await this.userData.getMessage(messageId);
      if (!rawMessage) return;

      const messageData = { ...rawMessage, id: messageId } as FirestoreMessage;

      if (messageData && messageData.authorId) {
        const user = (await this.userData.getUserById(
          messageData.authorId
        )) as UserInterface;
        const timestamp =
          messageData.time.seconds * 1000 +
          messageData.time.nanoseconds / 1000000;
        const messageDate = new Date(timestamp);

        const formattedMessage: renderMessageInterface = {
          timestamp,
          userMessageId: messageId,
          author: user?.username || 'Unknown',
          authorPhoto: user?.photoURL || 'img-placeholder/default-avatar.svg',
          message: messageData.message,
          isOwnMessage: messageData.authorId === this.currentUser?.uid,
          emojis: messageData.emojis || [],
          hours: messageDate.getHours(),
          minutes: messageDate.getMinutes(),
        };

        this.parentMessage = [formattedMessage];
      }
    } catch (error) {
      console.error('Error loading parent message:', error);
    }
  }

  private async loadThreadMessages(parentId: string) {
    try {
      const rawComments = await this.userData.getThreadMessages(parentId);
      this.replyCount = rawComments.length;

      const formattedMessages = await Promise.all(
        rawComments.map(async (comment) => {
          if (!comment || !comment.authorId) return null;

          const user = (await this.userData.getUserById(
            comment.authorId
          )) as UserInterface;
          const timestamp =
            comment.time.seconds * 1000 + comment.time.nanoseconds / 1000000;
          const commentDate = new Date(timestamp);

          return {
            timestamp,
            userMessageId: comment.id || '',
            author: user?.username || 'Unknown',
            authorPhoto: user?.photoURL || 'img-placeholder/default-avatar.svg',
            message: comment.message,
            isOwnMessage: comment.authorId === this.currentUser?.uid,
            emojis: comment.emojis || [],
            hours: commentDate.getHours(),
            minutes: commentDate.getMinutes(),
          } as renderMessageInterface;
        })
      );

      this.threadMessages = formattedMessages.filter(
        (msg): msg is renderMessageInterface => msg !== null
      );
    } catch (error) {
      console.error('Error loading thread messages:', error);
    }
  }

  closeThread() {
    this.closeThreadEvent.emit();
  }
}
