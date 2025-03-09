import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { UserMsgOptionsComponent } from '../user-msg-options/user-msg-options.component';
import { UserData } from '../../service/user-data.service';
import { AuthService } from '../../service/auth.service';
import { firstValueFrom } from 'rxjs';
import {
  EmojiReaction,
  renderMessageInterface,
  ThreadInfo,
} from '../../models/user-message';
import { UniquePipe } from '../pipes/unique.pipe';
import { EmojiService } from '../../service/emoji.service';
import { RecentEmojisService } from '../../service/recent-emojis.service';
import { FormsModule } from '@angular/forms';
import { ProfileOverviewComponent } from '../profile-overview/profile-overview.component';
import { UserOverviewComponent } from '../../shared/user-overview/user-overview.component';
import { EmojiOverviewComponent } from '../emoji-overview/emoji-overview.component';
import { ThreadService } from '../../service/open-thread.service';
import { EmojiPickerService } from '../../service/emoji-picker.service';
import { UserInterface } from '../../models/user-interface';
import { UserInfosService } from '../../service/user-infos.service';
import { ChatService } from '../../service/chat.service';
import { ChannelInfoDialogComponent } from '../../main-content/main-chat/main-chat-header/channel-info-dialog/channel-info-dialog.component';

/**
 * Component for displaying and interacting with user messages.
 * - Supports emoji reactions, tagging, and threaded messages.
 * - Provides UI interactions such as editing, deleting, and replying to messages.
 * - Manages user message options and profile dialogs.
 */
@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    NgIf,
    UserMsgOptionsComponent,
    EmojiPickerComponent,
    UniquePipe,
    FormsModule,
    EmojiOverviewComponent,
  ],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;

  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;
  @Input() allMessages: renderMessageInterface[] = [];
  @Input() CurrentUserURL: any;
  @Input() user: UserInterface[] = [];
  @Input() parentMessageId: string | null = null;
  @Input() isInThreadView: boolean = false;
  @Input() activeEmojiPicker: string | null = null;
  @Output() setActiveEmojiPicker = new EventEmitter<string | null>();

  public currentUser: any = null;
  emojiList: any[] = [];
  editStatusMessage: boolean = false;
  currentEditingMessageId: string | null = null;
  originalMessageContent: string = '';
  threadInfo: ThreadInfo | null = null;
  hoverComponent: boolean = false;
  hoverComponentEmojiOverviewMap: { [key: string]: boolean } = {};
  emojiAuthors: string[] = [];
  taggedUser: string = '';
  taggedChannel: string = '';

  /**
   * Initializes component with required services
   */
  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private authService: AuthService,
    private emojiService: EmojiService,
    private recentEmojisService: RecentEmojisService,
    private threadService: ThreadService,
    private emojiPickerService: EmojiPickerService,
    private userInfoService: UserInfosService,
    private chatService: ChatService
  ) {
    this.initializeComponent();
    this.emojiPickerService.activePickerId$.subscribe((id) => {
      if (id && id !== this.activeEmojiPicker) {
        this.setActiveEmojiPicker.emit(null);
        this.hoverComponent = false;
      }
    });
  }

  /**
   * Sets up initial component state
   */
  private initializeComponent(): void {
    this.emojiList = this.emojiService.emojiList;
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Initializes component and sets up event listeners
   */
  ngOnInit(): void {
    this.loadThreadInfo();
    this.setupEventListeners();
  }

  /**
   * Sets up document event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener('click', (e: MouseEvent) =>
      this.handleEmojiPickerClick(e)
    );
  }

  /**
   * Handles click events for emoji picker
   */
  private handleEmojiPickerClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('mat-icon') && !target.closest('app-emoji-picker')) {
      this.activeEmojiPicker = null;
    }
  }

  /**
   * Opens a profile dialog.
   * - If the message is from the current user, opens the `UserOverviewComponent`.
   * - Otherwise, opens `openProfileDialog` function with the user's data.
   *
   * @param {renderMessageInterface} msg - The message whose author profile should be displayed.
   */
  openProfile(msg: renderMessageInterface): void {
    if (msg.isOwnMessage) {
      this.dialog.open(UserOverviewComponent);
    } else {
      this.openProfileDialog(msg);
    }
  }

  /**
   * Starts openMentionProfileDialog function for a tagged user.
   * - Searches for the user in the `this.user` array by matching their username.
   * - If the user is found, calls `openMentionProfileDialog` to display their profile.
   * - If no matching user is found, the function exits without any action.
   *
   * @param {string} name - The username of the tagged user.
   * @returns {void}
   */
  openTaggedProfile(name: string): void {
    const userData = this.user.find((user) => user.username == name);
    if (userData) {
      this.openMentionProfileDialog(userData);
    } else {
      return;
    }
  }

  /**
   * Opens channel info dialog for a tagged channel.
   * - Gets channel information and opens ChannelInfoDialogComponent
   *
   * @param {string} name - The name of the tagged channel.
   * @returns {void}
   */
  async openTaggedChannel(name: string): Promise<void> {
    try {
      const channel = await this.chatService.getChannelByName(name);
      if (channel) {
        this.dialog.open(ChannelInfoDialogComponent, {
          data: {
            channelId: channel.id,
            name: channel.name,
            description: channel.description,
            userId: this.currentUser?.uid,
          },
          maxWidth: '100vw',
          width: '800px',
          panelClass: ['channel-dialog', 'wide-dialog'],
        });
      }
    } catch (error) {
      console.error('Error opening channel dialog:', error);
    }
  }

  /**
   * Opens a profile dialog for the given message author.
   * - Calls `createProfileData(msg)` to retrieve the necessary UserInterface data.
   * - Opens `ProfileOverviewComponent` as a dialog with the user's profile information.
   *
   * @private
   * @param {renderMessageInterface} msg - The message containing the author's details.
   * @returns {void}
   */
  private openProfileDialog(msg: renderMessageInterface): void {
    this.dialog.open(ProfileOverviewComponent, {
      data: this.createProfileData(msg),
    });
  }

  /**
   * Opens the profile dialog for a mentioned user.
   * - If the mentioned user is the current user (`localID === this.userInfoService.uId`),
   *   opens the `UserOverviewComponent`.
   * - Otherwise, opens the `ProfileOverviewComponent` with the provided user data.
   *
   * @private
   * @param {UserInterface} userData - The user data of the mentioned user.
   * @returns {void}
   */
  private openMentionProfileDialog(userData: UserInterface): void {
    if (userData.localID === this.userInfoService.uId) {
      this.dialog.open(UserOverviewComponent);
    } else {
      this.dialog.open(ProfileOverviewComponent, {
        data: userData,
      });
    }
  }

  /**
   * Creates a user profile data object based on the message author.
   * - Returns a `UserInterface` object with fallback values if no user is found.
   *
   * @private
   * @param {renderMessageInterface} msg - The message containing the author's username.
   * @returns {UserInterface} - A user profile object with the extracted or default data.
   */
  private createProfileData(msg: renderMessageInterface): UserInterface {
    const userData = this.user.find((u) => u.username === msg.author);
    return {
      username: userData?.username || '',
      email: userData?.email || '',
      photoURL: userData?.photoURL || 'img-placeholder/default-avatar.svg',
      localID: userData?.localID || '',
      uid: userData?.uid || '',
      online: false,
    };
  }

  /**
   * Loads thread information
   */
  private async loadThreadInfo(): Promise<void> {
    if (!this.allMessages || this.allMessages.length === 0) return;

    try {
      const message = this.allMessages[0];
      const comments = await this.userData.getThreadMessages(
        message.userMessageId
      );
      this.updateThreadInfo(comments);
    } catch (error) {
      console.error('Error loading thread info:', error);
      this.threadInfo = { replyCount: 0 };
    }
  }

  /**
   * Updates thread info with comment data
   */
  private updateThreadInfo(comments: any[]): void {
    if (comments && comments.length > 0) {
      const sortedComments = this.sortCommentsByTime(comments);
      const lastComment = sortedComments[0];
      const lastCommentTime = this.getCommentTime(lastComment);

      this.threadInfo = {
        replyCount: comments.length,
        lastReplyTime: {
          hours: lastCommentTime.getHours(),
          minutes: lastCommentTime.getMinutes(),
        },
      };
    } else {
      this.threadInfo = { replyCount: 0 };
    }
  }

  /**
   * Sorts comments by timestamp
   */
  private sortCommentsByTime(comments: any[]): any[] {
    return comments.sort((a, b) => {
      const timeA = a.time.seconds * 1000 + a.time.nanoseconds / 1000000;
      const timeB = b.time.seconds * 1000 + b.time.nanoseconds / 1000000;
      return timeB - timeA;
    });
  }

  /**
   * Gets comment timestamp
   */
  private getCommentTime(comment: any): Date {
    return new Date(
      comment.time.seconds * 1000 + comment.time.nanoseconds / 1000000
    );
  }

  /**
   * Updates message edit status
   */
  getEditMessageStatus(status: boolean, userMessageId: string): void {
    if (status) {
      this.startEditing(userMessageId);
    } else {
      this.stopEditing();
    }
    this.editStatusMessage = status;
  }

  /**
   * Starts message editing
   */
  private startEditing(userMessageId: string): void {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );
    if (messageToEdit) {
      this.currentEditingMessageId = userMessageId;
      this.originalMessageContent = messageToEdit.message;
    }
  }

  /**
   * Stops message editing
   */
  private stopEditing(): void {
    this.currentEditingMessageId = null;
    this.originalMessageContent = '';
  }

  /**
   * Saves edited message
   */
  onSave(): void {
    if (this.currentEditingMessageId) {
      this.editMessage(
        this.currentEditingMessageId,
        this.allMessages[0]?.message
      );
    }
  }

  /**
   * Handles opening the thread from the message
   */
  openThread(): void {
    if (this.allMessages && this.allMessages.length > 0) {
      const messageId = this.allMessages[0].userMessageId;
      if (messageId) {
        this.threadService.openThread(messageId);
      }
    }
  }

  /**
   * Handles mouse enter on message
   */
  onMouseEnter(msgId: string): void {
    if (!this.activeEmojiPicker) {
      this.hoverComponent = true;
    }
  }

  /**
   * Handles mouse leave on message
   */
  onMouseLeave(msgId: string): void {
    this.hoverComponent = false;
  }

  /**
   * Handles mouse enter on reaction icon
   */
  onMouseEnterReactionIcon(emojiId: string): void {
    this.hoverComponentEmojiOverviewMap[emojiId] = true;
  }

  /**
   * Handles mouse leave on reaction icon
   */
  onMouseLeaveReactionIcon(emojiId: string): void {
    this.hoverComponentEmojiOverviewMap[emojiId] = false;
  }

  /**
   * Handles emoji picker toggle for a message
   */
  toggleEmojiPicker(messageId: string, event: MouseEvent): void {
    event.stopPropagation();
    setTimeout(() => {
      const newValue = this.activeEmojiPicker === messageId ? null : messageId;
      this.emojiPickerService.setActivePickerId(newValue);
      this.setActiveEmojiPicker.emit(newValue);
      this.hoverComponent = !newValue;
    }, 100);
  }
  /**
   * Handles document click events for emoji picker
   */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-emoji-picker') && !target.closest('button')) {
      this.setActiveEmojiPicker.emit(null);
      this.hoverComponent = false;
    }
  }

  /**
   * Handles emoji selection
   */
  handleEmojiSelected(emoji: any, messageId: string): void {
    if (this.editStatusMessage) {
      this.insertEmojiIntoMessage(emoji, messageId);
    } else {
      this.handleEmojiReaction(emoji, messageId);
    }
    this.setActiveEmojiPicker.emit(null);
    this.activeEmojiPicker = null;
    this.hoverComponent = false;
  }

  /**
   * Inserts emoji into message text
   */
  private insertEmojiIntoMessage(emoji: any, messageId: string): void {
    const textarea = this.messageTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const message = this.allMessages.find(
      (msg) => msg.userMessageId === messageId
    );

    if (message) {
      message.message =
        message.message.substring(0, start) +
        emoji.emoji +
        message.message.substring(end);

      setTimeout(() => {
        textarea.selectionStart = start + emoji.emoji.length;
        textarea.selectionEnd = start + emoji.emoji.length;
        textarea.focus();
      });
    }
  }

  /**
   * Handles emoji reaction to message
   */
  async handleEmojiReaction(emoji: any, messageId: string): Promise<void> {
    try {
      const currentUser = await firstValueFrom(this.authService.user$);
      if (currentUser) {
        await this.userData.addEmojiReaction(
          messageId,
          emoji.name,
          currentUser.uid
        );
        await this.recentEmojisService.updateRecentEmoji(emoji);
        this.emojiPickerService.setActivePickerId(null);
      }
    } catch (error) {
      console.error('Error adding emoji reaction:', error);
    }
  }

  /**
   * Checks if emoji is reaction object
   */
  private isEmojiReaction(
    emoji: string | EmojiReaction
  ): emoji is EmojiReaction {
    return typeof emoji === 'object' && emoji !== null && 'name' in emoji;
  }

  /**
   * Gets emoji count for message
   */
  getEmojiCount(message: renderMessageInterface, emojiName: string): number {
    return (message.emojis || []).filter((reaction) => {
      if (this.isEmojiReaction(reaction)) {
        return reaction.name === emojiName;
      }
      return reaction === emojiName;
    }).length;
  }

  /**
   * Checks if user has reacted with emoji
   */
  hasUserReacted(message: renderMessageInterface, emojiName: string): boolean {
    if (!this.currentUser) return false;

    return (message.emojis || []).some((reaction) => {
      if (this.isEmojiReaction(reaction)) {
        return (
          reaction.user === this.currentUser?.uid && reaction.name === emojiName
        );
      }
      return false;
    });
  }

  /**
   * Opens emoji picker dialog
   */
  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      backdropClass: 'custom-backdrop',
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  /**
   * Deletes message
   */
  deleteMessage(messageId: string): void {
    this.userData.deleteMessage(messageId).catch((error) => {
      console.error('Error deleting message:', error);
    });
  }

  /**
   * Updates message content
   */
  editMessage(userMessageId: string, updatedMessage?: string): void {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );
    if (!messageToEdit) return;

    this.originalMessageContent = messageToEdit.message;
    const newMessage = updatedMessage || messageToEdit.message;

    this.userData
      .updateMessage(userMessageId, { message: newMessage })
      .then(() => {
        this.editStatusMessage = false;
      })
      .catch((error) => {
        console.error('Error updating message:', error);
      });
  }

  /**
   * Cancels message editing
   */
  onCancel(): void {
    this.editStatusMessage = false;

    if (this.currentEditingMessageId) {
      const message = this.allMessages.find(
        (msg) => msg.userMessageId === this.currentEditingMessageId
      );
      if (message) {
        message.message = this.originalMessageContent;
      }
    }
  }

  /**
   * Gets emoji author names
   */
  getEmojiAuthorName(msg: any, emojiData: string | EmojiReaction): string[] {
    this.emojiAuthors = [];
    const emojiName = this.isEmojiReaction(emojiData)
      ? emojiData.name
      : emojiData;

    if (this.isEmojiReaction(emojiData)) {
      this.collectEmojiAuthors(msg, emojiName);
    } else {
      this.addSingleEmojiAuthor(emojiData);
    }
    return this.emojiAuthors;
  }

  /**
   * Collects authors who reacted with emoji
   */
  private collectEmojiAuthors(msg: any, emojiName: string): void {
    msg.emojis.forEach((reaction: EmojiReaction) => {
      if (reaction.name === emojiName) {
        const user = this.user.find((u) => u.localID === reaction.user);
        if (user) {
          this.emojiAuthors.push(user.username);
        }
      }
    });
  }

  /**
   * Adds single emoji author
   */
  private addSingleEmojiAuthor(emojiData: string): void {
    const user = this.user.find((u) => u.localID === emojiData);
    if (user) {
      this.emojiAuthors.push(user.username);
    }
  }

  /**
   * Gets emoji symbol
   */
  getEmojiSymbol(emojiData: string | EmojiReaction): string {
    const emojiName = this.isEmojiReaction(emojiData)
      ? emojiData.name
      : emojiData;
    return this.emojiList.find((e) => e.name === emojiName)?.emoji || '';
  }

  /**
   * Checks if a message contains a tagged user mention.
   * - Uses a regular expression to detect mentions in the format `@Firstname Lastname`.
   * - Supports uppercase and lowercase letters, including German umlauts (`ÄÖÜäöüß`).
   * - Returns `true` if at least one mention is found, otherwise `false`.
   *
   * @param {string} message - The message text to check for mentions.
   * @returns {boolean} - `true` if the message contains a mention, otherwise `false`.
   */
  checkTagging(message: string): boolean {
    const mentionRegex = /(@[A-ZÄÖÜa-zäöüß]+\s[A-ZÄÖÜa-zäöüß]+)/g;
    if (mentionRegex.test(message)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if a message contains a tagged channel mention.
   * - Uses a regular expression to detect channel mentions in the format `#channelname`.
   * - Supports uppercase and lowercase letters, including German umlauts.
   * - Returns `true` if at least one channel mention is found, otherwise `false`.
   *
   * @param {string} message - The message text to check for channel mentions.
   * @returns {boolean} - `true` if the message contains a channel mention, otherwise `false`.
   */
  checkChannelTagging(message: string): boolean {
    const channelRegex = /(#[A-ZÄÖÜa-zäöüß0-9_-]+)/g;
    return channelRegex.test(message);
  }

  /**
   * Splits a text string around a detected mention (`@Firstname Lastname`).
   * - Uses a regular expression to find the first user mention.
   * - Extracts and returns either the text before the mention, the mention itself, or the text after.
   * - Stores the mention in `this.taggedUser` without the `@` symbol.
   *
   * @param {string} message - The text to analyze for a mention.
   * @param {string} part - Specifies which part of the text to return (`"beforeText"`, `"mention"`, or `"afterText"`).
   * @returns {string | string[] | null} - The requested text part, or `null` if no mention is found.
   */
  splitTextAroundRegexDeclaration(
    message: string,
    part: string
  ): string | string[] | null {
    const mentionRegex = /(@[A-ZÄÖÜa-zäöüß]+\s[A-ZÄÖÜa-zäöüß]+)/g;
    const mention = message.match(mentionRegex);

    if (!mention) {
      return null;
    }
    const firstMention: string = mention[0];
    const index = message.indexOf(firstMention);

    const beforeText: string =
      index > 0 ? message.substring(0, index).trim() : '';
    const afterText: string = message
      .substring(index + firstMention.length)
      .trim();
    this.taggedUser = mention[0].replace('@', '');

    if (part === 'beforeText') {
      return beforeText;
    } else if (part === 'mention') {
      return mention;
    } else if (part === 'afterText') {
      return afterText;
    }
    return null;
  }

  /**
   * Splits a text string around a detected channel mention (`#channelname`).
   * - Uses a regular expression to find the first channel mention.
   * - Extracts and returns either the text before the mention, the mention itself, or the text after.
   * - Stores the channel name in `this.taggedChannel` without the `#` symbol.
   *
   * @param {string} message - The text to analyze for a channel mention.
   * @param {string} part - Specifies which part of the text to return.
   * @returns {string | string[] | null} - The requested text part, or `null` if no channel mention is found.
   */
  splitTextAroundChannelMention(
    message: string,
    part: string
  ): string | string[] | null {
    const channelRegex = /(#[A-ZÄÖÜa-zäöüß0-9_-]+)/g;
    const mention = message.match(channelRegex);

    if (!mention) {
      return null;
    }
    const firstMention: string = mention[0];
    const index = message.indexOf(firstMention);

    const beforeText: string =
      index > 0 ? message.substring(0, index).trim() : '';
    const afterText: string = message
      .substring(index + firstMention.length)
      .trim();
    this.taggedChannel = mention[0].replace('#', '');

    if (part === 'beforeText') {
      return beforeText;
    } else if (part === 'mention') {
      return mention;
    } else if (part === 'afterText') {
      return afterText;
    }
    return null;
  }
}
