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
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserData } from '../../service/user-data.service';
import { MentionHighlightPipe } from '../pipes/mentionHighlight.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmojiPickerService } from '../../service/emoji-picker.service';

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

interface MentionedUser {
  uid: string;
  username: string;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
  start: number;
  end: number;
}

interface MentionTag {
  id: string;
  username: string;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
  start: number;
  end: number;
}

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    EmojiPickerComponent,
    MentionHighlightPipe,
  ],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef;
  @Input() isThreadMessage: boolean = false;
  @Input() parentMessageId: string | null = null;
  @Input() placeholder: string = 'Write message...';
  @Input() inputId: string = 'main-chat';

  messageText: string = '';
  private currentChannel: any;
  private currentUser: any;
  private currentDirectUser: any;
  private newMessageRecipient: SearchResult | null = null;
  private subscriptions: Subscription = new Subscription();
  private isNewMessage: boolean = false;
  showEmojiPicker: boolean = false;
  showMentionDropdown = false;
  mentionSearchResults: User[] = [];
  mentionedUsers: MentionedUser[] = [];
  mentionSearchTerm = '';
  cursorPosition = 0;
  mentionTags: MentionTag[] = [];
  plainText: string = '';

  /**
   * Initializes component with required services
   */
  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService,
    private elementRef: ElementRef,
    private userData: UserData,
    private sanitizer: DomSanitizer,
    private emojiPickerService: EmojiPickerService
  ) {
    this.emojiPickerService.activePickerId$.subscribe((id) => {
      if (id !== 'message-input') {
        this.showEmojiPicker = false;
      }
    });
  }

  /**
   * Handles document click events for focus management
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.handleDocumentClick(event);
  }

  /**
   * Updates input focus state based on click location
   */
  private handleDocumentClick(event: MouseEvent): void {
    const inputBox = this.elementRef.nativeElement;
    const isClickInside = inputBox.contains(event.target);

    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.dataset.focused = isClickInside
        ? 'true'
        : 'false';
    }

    if (!isClickInside) {
      this.showEmojiPicker = false;
      this.showMentionDropdown = false;
    }
  }

  /**
   * Toggles emoji picker visibility
   */
  toggleEmojiPicker(event: MouseEvent): void {
    event.stopPropagation();
    const newValue = this.showEmojiPicker ? null : 'message-input';
    this.showEmojiPicker = !this.showEmojiPicker;
    this.emojiPickerService.setActivePickerId(newValue);
  }

  /**
   * Handles emoji selection and insertion
   */
  handleEmojiSelected(emoji: any): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;

    this.messageText =
      this.messageText.substring(0, start) +
      emoji.emoji +
      this.messageText.substring(textarea.selectionEnd);

    setTimeout(() => {
      textarea.selectionStart = start + emoji.emoji.length;
      textarea.selectionEnd = start + emoji.emoji.length;
      textarea.focus();
    });

    this.showEmojiPicker = false;
  }

  /**
   * Initializes component and sets up subscriptions
   */
  ngOnInit(): void {
    this.setupUserSubscription();
    if (!this.isThreadMessage) {
      this.setupChannelSubscription();
      this.setupDirectMessageSubscription();
      this.setupNewMessageSubscription();
    }
  }

  /**
   * Sets up channel subscription
   */
  private setupChannelSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
        if (channel && !this.isNewMessage && !this.isThreadMessage) {
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
        if (user && !this.isNewMessage && !this.isThreadMessage) {
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
        this.messageInput.nativeElement.focus({ preventScroll: true });
        this.messageInput.nativeElement.dataset.focused = 'true';
      }
    }, 100);
  }

  /**
   * Handles key events for message input
   */
  onKeyDown(event: KeyboardEvent): void {
    if (this.isEnterToSend(event)) {
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === '@') {
      this.handleMentionTrigger();
    }
  }

  /**
   * Checks if enter key should trigger message send
   */
  private isEnterToSend(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && !event.shiftKey;
  }

  /**
   * Handles input changes and mention search
   */
  onInput(event: Event): void {
    const textarea = this.messageInput.nativeElement;
    this.cursorPosition = textarea.selectionStart;

    const hasAtSymbol = this.messageText.includes('@');

    if (!hasAtSymbol) {
      this.showMentionDropdown = false;
      this.mentionSearchResults = [];
      return;
    }

    if (!this.messageText.trim()) {
      this.resetMentions();
      return;
    }

    if (this.showMentionDropdown) {
      this.handleMentionSearch();
    }
  }

  /**
   * Resets mention data
   */
  private resetMentions(): void {
    this.mentionTags = [];
    this.mentionedUsers = [];
  }

  /**
   * Handles mention search based on input
   */
  private handleMentionSearch(): void {
    const lastIndex = this.messageText.lastIndexOf(
      '@',
      this.cursorPosition - 1
    );
    if (lastIndex >= 0) {
      const searchText = this.messageText.slice(
        lastIndex + 1,
        this.cursorPosition
      );
      if (searchText.includes(' ')) {
        this.showMentionDropdown = false;
        return;
      }
      this.mentionSearchTerm = searchText;
      this.searchUsers(this.mentionSearchTerm);
    } else {
      this.showMentionDropdown = false;
    }
  }

  /**
   * Searches users for mention suggestions
   */
  private async searchUsers(term: string): Promise<void> {
    if (!term.trim()) {
      await this.loadAllUsers();
      return;
    }

    await this.searchUsersByTerm(term);
  }

  /**
   * Loads initial users for mention suggestions
   */
  private async loadAllUsers(): Promise<void> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);
    this.mentionSearchResults = snapshot.docs
      .map(
        (doc) =>
          ({
            uid: doc.id,
            ...doc.data(),
          } as User)
      )
      .slice(0, 5);
  }

  /**
   * Searches users by term for mention suggestions
   */
  private async searchUsersByTerm(term: string): Promise<void> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef,
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff')
    );

    try {
      const snapshot = await getDocs(q);
      this.mentionSearchResults = snapshot.docs.map(
        (doc) =>
          ({
            uid: doc.id,
            ...doc.data(),
          } as User)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      this.mentionSearchResults = [];
    }
  }

  /**
   * Initiates mention functionality
   */
  handleMentionTrigger(): void {
    this.showMentionDropdown = true;
    this.searchUsers('');
  }

  /**
   * Handles user selection from mention dropdown
   */
  selectMention(user: User): void {
    const textarea = this.messageInput.nativeElement;
    const lastIndex = this.messageText.lastIndexOf(
      '@',
      this.cursorPosition - 1
    );
    const username = user.username || user.displayName || user.email || 'user';

    const mentionTag = this.createMentionTag(user, username, lastIndex);
    this.addMentionToText(mentionTag, textarea);
  }

  /**
   * Creates mention tag object
   */
  private createMentionTag(
    user: User,
    username: string,
    startIndex: number
  ): MentionTag {
    return {
      id: user.uid,
      username: username,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      start: startIndex,
      end: startIndex + username.length + 1,
    };
  }

  /**
   * Adds mention to text and updates state
   */
  private addMentionToText(
    mentionTag: MentionTag,
    textarea: HTMLTextAreaElement
  ): void {
    this.mentionTags.push(mentionTag);

    this.messageText =
      this.messageText.substring(0, mentionTag.start) +
      '@' +
      mentionTag.username +
      ' ';

    this.mentionedUsers.push({
      uid: mentionTag.id,
      username: mentionTag.username,
      displayName: mentionTag.displayName,
      photoURL: mentionTag.photoURL,
      start: mentionTag.start,
      end: mentionTag.end,
    });

    this.showMentionDropdown = false;
    this.mentionSearchResults = [];

    const newCursorPos = mentionTag.start + mentionTag.username.length + 2;
    this.updateCursorPosition(textarea, newCursorPos);
  }

  /**
   * Updates cursor position in textarea
   */
  private updateCursorPosition(
    textarea: HTMLTextAreaElement,
    position: number
  ): void {
    textarea.focus();
    setTimeout(() => {
      textarea.selectionStart = position;
      textarea.selectionEnd = position;
    });
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
   * Sets up new message recipient subscription
   */
  private setupNewMessageRecipientSubscription(): void {
    this.subscriptions.add(
      this.chatService.selectedSearchResult$.subscribe((recipient) => {
        this.newMessageRecipient = recipient;
        if (recipient) {
          this.updatePlaceholderForRecipient(recipient);
        } else {
          this.placeholder = 'Starte eine neue Nachricht';
        }
      })
    );
  }

  /**
   * Updates placeholder text for selected recipient
   */
  private updatePlaceholderForRecipient(recipient: SearchResult): void {
    this.placeholder = `Nachricht an ${
      recipient.type === 'channel' ? '#' : ''
    }${recipient.name}`;
  }

  /**
   * Gets display name for user
   */
  getDisplayName(user: User): string {
    if (!user) return 'Unnamed User';
    return user.username || user.displayName || user.email || 'Unnamed User';
  }

  /**
   * Creates message data object for sending
   */
  private createMessageData(): any {
    const baseMessage = {
      authorId: this.currentUser.uid,
      message: this.messageText.trim(),
      time: serverTimestamp(),
      comments: [],
      emojis: {},
      mentions: this.mentionedUsers.map((user) => ({
        uid: user.uid,
        username: user.username,
        start: user.start,
        end: user.end,
      })),
    };

    if (this.isNewMessage && this.newMessageRecipient) {
      return this.createNewMessageData(baseMessage);
    }

    return this.createExistingChatMessageData(baseMessage);
  }

  /**
   * Creates message data for new message
   */
  private createNewMessageData(baseMessage: any): any {
    return {
      ...baseMessage,
      channelId:
        this.newMessageRecipient?.type === 'channel'
          ? this.newMessageRecipient.id
          : null,
      directUserId:
        this.newMessageRecipient?.type === 'user'
          ? this.newMessageRecipient.id
          : null,
    };
  }

  /**
   * Creates message data for existing chat
   */
  private createExistingChatMessageData(baseMessage: any): any {
    return {
      ...baseMessage,
      channelId: this.currentChannel?.id || null,
      directUserId: this.currentDirectUser?.uid || null,
    };
  }

  /**
   * Sends message
   */
  async sendMessage(): Promise<void> {
    if (!this.isValidMessageState()) return;

    try {
      await this.processMessageSend();
      this.resetMessageState();
      await this.handlePostSend();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Checks if message can be sent
   */
  private isValidMessageState(): boolean {
    if (!this.messageText.trim() || !this.currentUser) return false;
    if (this.isNewMessage && !this.newMessageRecipient && !this.isThreadMessage)
      return false;
    return true;
  }

  /**
   * Processes message sending
   */
  private async processMessageSend(): Promise<void> {
    if (this.isThreadMessage && this.parentMessageId) {
      await this.userData.addThreadMessage(
        this.parentMessageId,
        this.messageText.trim(),
        this.currentUser.uid
      );
    } else {
      const messageData = this.createMessageData();
      const messagesRef = collection(this.firestore, 'userMessages');
      await addDoc(messagesRef, messageData);
    }
  }

  /**
   * Resets message state after sending
   */
  private resetMessageState(): void {
    this.messageText = '';
    this.mentionedUsers = [];
    this.mentionTags = [];
  }

  /**
   * Handles post-send actions
   */
  private async handlePostSend(): Promise<void> {
    if (
      this.isNewMessage &&
      this.newMessageRecipient &&
      !this.isThreadMessage
    ) {
      await this.handleNewMessageSent();
    }
  }

  /**
   * Handles actions after new message is sent
   */
  private async handleNewMessageSent(): Promise<void> {
    if (this.newMessageRecipient?.type === 'channel') {
      await this.chatService.selectChannel(this.newMessageRecipient.id);
    } else {
      await this.chatService.selectDirectMessage(
        this.newMessageRecipient?.id || ''
      );
    }
    this.chatService.messageWasSent();
  }

  /**
   * Cleans up subscriptions
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Inserts @ symbol at cursor position
   */
  insertAtSymbol(): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;

    this.messageText =
      this.messageText.substring(0, start) +
      '@' +
      this.messageText.substring(textarea.selectionEnd);

    setTimeout(() => {
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = start + 1;
      textarea.focus();
    });

    this.handleMentionTrigger();
  }

  /**
   * Gets formatted text with mention highlights
   */
  getFormattedText(): SafeHtml {
    let text = this.messageText;
    const sortedTags = [...this.mentionTags].sort((a, b) => b.start - a.start);

    sortedTags.forEach((tag) => {
      const mention = `@${tag.username}`;
      text =
        text.slice(0, tag.start) +
        `<span class="mention input-mention" data-user-id="${tag.id}">${mention}</span>` +
        text.slice(tag.end + 1);
    });

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}
