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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmojiPickerService } from '../../service/emoji-picker.service';
import { SearchResult } from '../../models/search-result';
import { UserInterface } from '../../models/user-interface';
import { DirectUser } from '../../models/chat.interfaces';
import { MentionedUser, MentionTag } from '../../models/user-message';
import { ChannelInterface } from '../../models/channel-interface';

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
  @Input() placeholder: string = 'Write message...';
  @Input() inputId: string = 'main-chat';

  messageText: string = '';
  private currentChannel: any;
  private currentUser: UserInterface | null = null;
  private currentDirectUser: DirectUser | null = null;
  private newMessageRecipient: SearchResult | null = null;
  private subscriptions: Subscription = new Subscription();
  private isNewMessage: boolean = false;
  showEmojiPicker: boolean = false;
  showMentionDropdown = false;
  showChannelDropdown = false;
  mentionSearchResults: UserInterface[] = [];
  channelSearchResults: ChannelInterface[] = [];
  mentionedUsers: MentionedUser[] = [];
  mentionedChannels: any[] = [];
  mentionSearchTerm = '';
  channelSearchTerm = '';
  cursorPosition = 0;
  mentionTags: MentionTag[] = [];
  channelTags: any[] = [];
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
      this.showChannelDropdown = false;
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

    this.updateCursorPosition(textarea, start + emoji.emoji.length);
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
    } else if (event.key === '#') {
      this.handleChannelTrigger();
    }
  }

  /**
   * Checks if enter key should trigger message send
   */
  private isEnterToSend(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && !event.shiftKey;
  }

  /**
   * Handles input changes and search for mentions/channels
   */
  onInput(event: Event): void {
    const textarea = this.messageInput.nativeElement;
    this.cursorPosition = textarea.selectionStart;

    const hasAtSymbol = this.messageText.includes('@');
    const hasHashSymbol = this.messageText.includes('#');

    if (!hasAtSymbol && !hasHashSymbol) {
      this.resetSearchUI();
      return;
    }

    if (!this.messageText.trim()) {
      this.resetMentionsAndChannels();
      return;
    }

    this.processInputSearches();
  }

  /**
   * Resets search UI elements
   */
  private resetSearchUI(): void {
    this.showMentionDropdown = false;
    this.showChannelDropdown = false;
    this.mentionSearchResults = [];
    this.channelSearchResults = [];
  }

  /**
   * Processes searches based on active dropdown
   */
  private processInputSearches(): void {
    if (this.showMentionDropdown) {
      this.handleMentionSearch();
    }

    if (this.showChannelDropdown) {
      this.handleChannelSearch();
    }
  }

  /**
   * Resets mention and channel data
   */
  private resetMentionsAndChannels(): void {
    this.mentionTags = [];
    this.mentionedUsers = [];
    this.channelTags = [];
    this.mentionedChannels = [];
  }

  /**
   * Handles mention search based on input
   */
  private handleMentionSearch(): void {
    const lastIndex = this.messageText.lastIndexOf(
      '@',
      this.cursorPosition - 1
    );
    if (lastIndex < 0) {
      this.showMentionDropdown = false;
      return;
    }

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
  }

  /**
   * Handles channel search based on input
   */
  private handleChannelSearch(): void {
    const lastIndex = this.messageText.lastIndexOf(
      '#',
      this.cursorPosition - 1
    );
    if (lastIndex < 0) {
      this.showChannelDropdown = false;
      return;
    }

    const searchText = this.messageText.slice(
      lastIndex + 1,
      this.cursorPosition
    );
    if (searchText.includes(' ')) {
      this.showChannelDropdown = false;
      return;
    }

    this.channelSearchTerm = searchText;
    this.searchChannels(this.channelSearchTerm);
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
   * Searches channels for suggestions
   */
  private async searchChannels(term: string): Promise<void> {
    if (!term.trim()) {
      await this.loadAllChannels();
      return;
    }

    await this.searchChannelsByTerm(term);
  }

  /**
   * Loads initial channels for suggestions
   */
  private async loadAllChannels(): Promise<void> {
    const channelsRef = collection(this.firestore, 'channels');
    const snapshot = await getDocs(channelsRef);
    this.mapChannelSearchResults(snapshot, 5);
  }

  /**
   * Maps channel documents to search results
   */
  private mapChannelSearchResults(snapshot: any, limit?: number): void {
    const results = snapshot.docs.map(
      (doc: any) =>
        ({
          channelId: doc.id,
          id: doc.id,
          name: doc.data()['name'] || '',
          description: doc.data()['description'] || '',
          members: doc.data()['members'] || {},
          createdAt: doc.data()['createdAt'] || '',
          updatedAt: doc.data()['updatedAt'] || '',
          createdBy: doc.data()['createdBy'] || '',
          type: doc.data()['type'] || '',
        } as ChannelInterface)
    );

    this.channelSearchResults = limit ? results.slice(0, limit) : results;
  }

  /**
   * Searches channels by term
   */
  private async searchChannelsByTerm(term: string): Promise<void> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(
      channelsRef,
      where('name', '>=', term),
      where('name', '<=', term + '\uf8ff')
    );

    try {
      const snapshot = await getDocs(q);
      this.mapChannelSearchResults(snapshot);
    } catch (error) {
      console.error('Error searching channels:', error);
      this.channelSearchResults = [];
    }
  }

  /**
   * Loads initial users for mention suggestions
   */
  private async loadAllUsers(): Promise<void> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);
    this.mapUserSearchResults(snapshot, 5);
  }

  /**
   * Maps user documents to search results
   */
  private mapUserSearchResults(snapshot: any, limit?: number): void {
    const results = snapshot.docs.map(
      (doc: any) =>
        ({
          uid: doc.id,
          localID: doc.id,
          username: doc.data()['username'] || '',
          email: doc.data()['email'] || '',
          photoURL: doc.data()['photoURL'] || null,
          online: false,
        } as UserInterface)
    );

    this.mentionSearchResults = limit ? results.slice(0, limit) : results;
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
      this.mapUserSearchResults(snapshot);
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
    this.showChannelDropdown = false;
    this.searchUsers('');
  }

  /**
   * Initiates channel mention functionality
   */
  handleChannelTrigger(): void {
    this.showChannelDropdown = true;
    this.showMentionDropdown = false;
    this.searchChannels('');
  }

  /**
   * Handles user selection from mention dropdown
   */
  selectMention(user: UserInterface): void {
    const textarea = this.messageInput.nativeElement;
    const lastIndex = this.messageText.lastIndexOf(
      '@',
      this.cursorPosition - 1
    );
    const username = user.username || user.email || 'user';

    const mentionTag = this.createMentionTag(user, username, lastIndex);
    this.addMentionToText(mentionTag, textarea);
  }

  /**
   * Handles channel selection from dropdown
   */
  selectChannel(channel: ChannelInterface): void {
    const textarea = this.messageInput.nativeElement;
    const lastIndex = this.messageText.lastIndexOf(
      '#',
      this.cursorPosition - 1
    );
    const channelName = channel.name || 'channel';

    const channelTag = this.createChannelTag(channel, channelName, lastIndex);
    this.addChannelToText(channelTag, textarea);
  }

  /**
   * Creates mention tag object
   */
  private createMentionTag(
    user: UserInterface,
    username: string,
    startIndex: number
  ): MentionTag {
    return {
      id: user.uid || user.localID,
      username: username,
      displayName: null,
      photoURL: user.photoURL,
      start: startIndex,
      end: startIndex + username.length + 1,
    };
  }

  /**
   * Creates channel tag object
   */
  private createChannelTag(
    channel: ChannelInterface,
    channelName: string,
    startIndex: number
  ): any {
    return {
      id: channel.id || channel.channelId,
      channelId: channel.id || channel.channelId,
      name: channelName,
      description: channel.description,
      start: startIndex,
      end: startIndex + channelName.length + 1,
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

    this.updateTextWithMention(mentionTag, '@');
    this.saveMentionUser(mentionTag);

    this.showMentionDropdown = false;
    this.mentionSearchResults = [];

    const newCursorPos = mentionTag.start + mentionTag.username.length + 2;
    this.updateCursorPosition(textarea, newCursorPos);
  }

  /**
   * Saves mention user to state
   */
  private saveMentionUser(mentionTag: MentionTag): void {
    this.mentionedUsers.push({
      uid: mentionTag.id,
      username: mentionTag.username,
      displayName: mentionTag.displayName,
      photoURL: mentionTag.photoURL,
      start: mentionTag.start,
      end: mentionTag.end,
    });
  }

  /**
   * Updates text with a mention
   */
  private updateTextWithMention(tag: MentionTag, prefix: string): void {
    this.messageText =
      this.messageText.substring(0, tag.start) + prefix + tag.username + ' ';
  }

  /**
   * Adds channel mention to text and updates state
   */
  private addChannelToText(
    channelTag: any,
    textarea: HTMLTextAreaElement
  ): void {
    this.channelTags.push(channelTag);

    this.updateTextWithChannel(channelTag);
    this.saveChannelMention(channelTag);

    this.showChannelDropdown = false;
    this.channelSearchResults = [];

    const newCursorPos = channelTag.start + channelTag.name.length + 2;
    this.updateCursorPosition(textarea, newCursorPos);
  }

  /**
   * Updates text with channel mention
   */
  private updateTextWithChannel(channelTag: any): void {
    this.messageText =
      this.messageText.substring(0, channelTag.start) +
      '#' +
      channelTag.name +
      ' ';
  }

  /**
   * Saves channel mention to state
   */
  private saveChannelMention(channelTag: any): void {
    this.mentionedChannels.push({
      channelId: channelTag.channelId,
      name: channelTag.name,
      description: channelTag.description,
      start: channelTag.start,
      end: channelTag.end,
    });
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
        if (user) {
          this.setCurrentUser(user);
        } else {
          this.currentUser = null;
        }
      })
    );
  }

  /**
   * Sets current user information
   */
  private setCurrentUser(user: any): void {
    this.currentUser = {
      uid: user.uid,
      localID: user.uid,
      username: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
      photoURL: user.photoURL,
      online: true,
    };
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
        this.updateMessagePlaceholder(recipient);
      })
    );
  }

  /**
   * Updates message placeholder based on recipient
   */
  private updateMessagePlaceholder(recipient: SearchResult | null): void {
    if (recipient) {
      this.updatePlaceholderForRecipient(recipient);
    } else {
      this.placeholder = 'Starte eine neue Nachricht';
    }
  }

  /**
   * Updates placeholder text for selected recipient
   */
  private updatePlaceholderForRecipient(recipient: SearchResult): void {
    const name = this.getRecipientName(recipient);
    this.placeholder = `Nachricht an ${
      recipient.type === 'channel' ? '#' : ''
    }${name}`;
  }

  /**
   * Gets recipient name from search result
   */
  private getRecipientName(recipient: SearchResult): string {
    return recipient.type === 'channel'
      ? recipient.channelName
      : recipient.username;
  }

  /**
   * Gets display name for user
   */
  getDisplayName(user: UserInterface | DirectUser): string {
    if (!user) return 'Unnamed User';

    if ('username' in user && user.username) {
      return user.username;
    }

    if ('displayName' in user && user.displayName) {
      return user.displayName;
    }

    if (user.email) {
      return user.email;
    }

    return 'Unnamed User';
  }

  /**
   * Creates message data object for sending
   */
  private createMessageData(): any {
    const baseMessage = this.createBaseMessageData();

    if (this.isNewMessage && this.newMessageRecipient) {
      return this.createNewMessageData(baseMessage);
    }

    return this.createExistingChatMessageData(baseMessage);
  }

  /**
   * Creates base message data with content and mentions
   */
  private createBaseMessageData(): any {
    return {
      authorId: this.currentUser?.uid || '',
      message: this.messageText.trim(),
      time: serverTimestamp(),
      comments: [],
      emojis: {},
      mentions: this.formatMentionsForMessage(),
      channelMentions: this.formatChannelMentionsForMessage(),
    };
  }

  /**
   * Formats user mentions for message data
   */
  private formatMentionsForMessage(): any[] {
    return this.mentionedUsers.map((user) => ({
      uid: user.uid,
      username: user.username,
      start: user.start,
      end: user.end,
    }));
  }

  /**
   * Formats channel mentions for message data
   */
  private formatChannelMentionsForMessage(): any[] {
    return this.mentionedChannels.map((channel) => ({
      channelId: channel.channelId,
      name: channel.name,
      start: channel.start,
      end: channel.end,
    }));
  }

  /**
   * Creates message data for new message
   */
  private createNewMessageData(baseMessage: any): any {
    return {
      ...baseMessage,
      channelId:
        this.newMessageRecipient?.type === 'channel'
          ? this.newMessageRecipient.channelId
          : null,
      directUserId:
        this.newMessageRecipient?.type === 'user'
          ? this.newMessageRecipient.localID
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
      await this.sendThreadMessage();
    } else {
      await this.sendRegularMessage();
    }
  }

  /**
   * Sends thread message
   */
  private async sendThreadMessage(): Promise<void> {
    await this.userData.addThreadMessage(
      this.parentMessageId!,
      this.messageText.trim(),
      this.currentUser?.uid || ''
    );
  }

  /**
   * Sends regular message
   */
  private async sendRegularMessage(): Promise<void> {
    const messageData = this.createMessageData();
    const messagesRef = collection(this.firestore, 'userMessages');
    await addDoc(messagesRef, messageData);
  }

  /**
   * Resets message state after sending
   */
  private resetMessageState(): void {
    this.messageText = '';
    this.mentionedUsers = [];
    this.mentionTags = [];
    this.mentionedChannels = [];
    this.channelTags = [];
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
    await this.navigateToRecipient();
    this.chatService.messageWasSent();
  }

  /**
   * Navigates to the proper chat after message is sent
   */
  private async navigateToRecipient(): Promise<void> {
    if (this.newMessageRecipient?.type === 'channel') {
      await this.chatService.selectChannel(this.newMessageRecipient.channelId);
    } else {
      await this.chatService.selectDirectMessage(
        this.newMessageRecipient?.localID || ''
      );
    }
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
    this.insertSymbolAtCursor('@');
    this.handleMentionTrigger();
  }

  /**
   * Inserts # symbol at cursor position
   */
  insertHashSymbol(): void {
    this.insertSymbolAtCursor('#');
    this.handleChannelTrigger();
  }

  /**
   * Inserts a symbol at cursor position
   */
  private insertSymbolAtCursor(symbol: string): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;

    this.messageText =
      this.messageText.substring(0, start) +
      symbol +
      this.messageText.substring(textarea.selectionEnd);

    this.updateCursorPosition(textarea, start + 1);
  }

  /**
   * Gets formatted text with mention and channel highlights
   */
  getFormattedText(): SafeHtml {
    let text = this.messageText;

    const allTags = this.getAllFormattedTags();

    for (const tag of allTags) {
      text = this.applyTagFormatting(text, tag);
    }

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  /**
   * Gets all tags sorted for formatting
   */
  private getAllFormattedTags(): any[] {
    return [
      ...this.mentionTags.map((tag) => ({
        ...tag,
        isChannel: false,
      })),
      ...this.channelTags.map((tag) => ({
        ...tag,
        isChannel: true,
      })),
    ].sort((a, b) => b.start - a.start);
  }

  /**
   * Applies formatting for a tag in text
   */
  private applyTagFormatting(text: string, tag: any): string {
    const prefix = tag.isChannel ? '#' : '@';
    const name = tag.isChannel ? tag.name : tag.username;
    const className = tag.isChannel ? 'channel-mention' : 'mention';
    const dataAttr = tag.isChannel ? 'data-channel-id' : 'data-user-id';

    return (
      text.slice(0, tag.start) +
      `<span class="${className} input-mention" ${dataAttr}="${tag.id}">${prefix}${name}</span>` +
      text.slice(tag.end + 1)
    );
  }
}
