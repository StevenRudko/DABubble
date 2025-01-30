import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserData } from '../../service/user-data.service';

interface User {
  uid: string;
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface SearchResult {
  id: string;
  type: 'channel' | 'user';
  name: string;
  email?: string;
  photoURL?: string;
  description?: string;
  online?: boolean;
}

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmojiPickerComponent],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef;
  @Input() isThreadMessage: boolean = false;
  @Input() parentMessageId: string | null = null;
  @Input() placeholder: string = 'Nachricht schreiben...';

  messageText: string = '';
  private currentChannel: any;
  private currentUser: any;
  private currentDirectUser: any;
  private newMessageRecipient: SearchResult | null = null;
  private subscriptions: Subscription = new Subscription();
  private isNewMessage: boolean = false;
  showEmojiPicker: boolean = false;

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService,
    private elementRef: ElementRef,
    private userData: UserData
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showEmojiPicker = false;
    }
  }

  toggleEmojiPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  handleEmojiSelected(emoji: any): void {
    // Insert emoji at cursor position or at end
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.messageText =
      this.messageText.substring(0, start) +
      emoji.emoji +
      this.messageText.substring(end);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = start + emoji.emoji.length;
      textarea.selectionEnd = start + emoji.emoji.length;
      textarea.focus();
    });

    this.showEmojiPicker = false;
  }

  /**
   * Sets up subscriptions on init
   */
  ngOnInit(): void {
    this.setupChannelSubscription();
    this.setupDirectMessageSubscription();
    this.setupUserSubscription();
    this.setupNewMessageSubscription();
  }

  /**
   * Sets up channel subscription
   */
  private setupChannelSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
        if (channel && !this.isNewMessage) {
          this.placeholder = `Nachricht an #${channel.name}`;
          this.focusInput();
        }
      })
    );
  }

  /**
   * Sets up direct message subscription
   */
  private setupDirectMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentDirectUser$.subscribe((user) => {
        this.currentDirectUser = user;
        if (user && !this.isNewMessage) {
          this.placeholder = `Nachricht an ${this.getDisplayName(user)}`;
          this.focusInput();
        }
      })
    );
  }

  /**
   * Focuses input field
   */
  private focusInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.focus();
      }
    });
  }

  /**
   * Handles keydown events for textarea
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Sets up user subscription
   */
  private setupUserSubscription(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  /**
   * Sets up new message subscription
   */
  private setupNewMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.isNewMessage$.subscribe((isNew) => {
        this.isNewMessage = isNew;
        if (isNew) {
          this.setupNewMessageRecipientSubscription();
        } else {
          this.newMessageRecipient = null;
        }
      })
    );
  }

  /**
   * Sets up subscription for new message recipient
   */
  private setupNewMessageRecipientSubscription(): void {
    this.subscriptions.add(
      this.chatService.selectedSearchResult$.subscribe((recipient) => {
        this.newMessageRecipient = recipient;
        if (recipient) {
          this.placeholder = `Nachricht an ${
            recipient.type === 'channel' ? '#' : ''
          }${recipient.name}`;
        } else {
          this.placeholder = 'Wähle einen Empfänger aus...';
        }
      })
    );
  }

  /**
   * Gets display name for user
   */
  getDisplayName(user: User): string {
    if (!user) return 'Unbenannter Benutzer';
    if (user.username) return user.username;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email;
    return 'Unbenannter Benutzer';
  }

  /**
   * Creates message data object
   */
  private createMessageData(): any {
    const baseMessage = {
      authorId: this.currentUser.uid,
      message: this.messageText.trim(),
      time: serverTimestamp(),
      comments: [], // Änderung hier: Initialisierung als leeres Array statt {}
      emojis: {},
    };

    if (this.isNewMessage && this.newMessageRecipient) {
      return {
        ...baseMessage,
        channelId:
          this.newMessageRecipient.type === 'channel'
            ? this.newMessageRecipient.id
            : null,
        directUserId:
          this.newMessageRecipient.type === 'user'
            ? this.newMessageRecipient.id
            : null,
      };
    }

    return {
      ...baseMessage,
      channelId: this.currentChannel?.id || null,
      directUserId: this.currentDirectUser?.uid || null,
    };
  }

  /**
   * Sends message to firestore
   */
  async sendMessage(): Promise<void> {
    if (!this.messageText.trim() || !this.currentUser) return;
    if (this.isNewMessage && !this.newMessageRecipient && !this.isThreadMessage)
      return;

    try {
      if (this.isThreadMessage && this.parentMessageId) {
        // Thread-Nachricht senden
        await this.userData.addThreadMessage(
          this.parentMessageId,
          this.messageText.trim(),
          this.currentUser.uid
        );
      } else {
        // Normale Nachricht senden
        const messageData = this.createMessageData();
        const messagesRef = collection(this.firestore, 'userMessages');
        await addDoc(messagesRef, messageData);
      }

      this.messageText = '';

      if (
        this.isNewMessage &&
        this.newMessageRecipient &&
        !this.isThreadMessage
      ) {
        if (this.newMessageRecipient.type === 'channel') {
          await this.chatService.selectChannel(this.newMessageRecipient.id);
        } else {
          await this.chatService.selectDirectMessage(
            this.newMessageRecipient.id
          );
        }
        this.chatService.messageWasSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  insertAtSymbol(): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.messageText =
      this.messageText.substring(0, start) +
      '@' +
      this.messageText.substring(end);

    setTimeout(() => {
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = start + 1;
      textarea.focus();
    });
  }
}
