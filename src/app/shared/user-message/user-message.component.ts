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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmojiOverviewComponent } from '../emoji-overview/emoji-overview.component';
import { ThreadService } from '../../service/open-thread.service';
import { EmojiPickerService } from '../../service/emoji-picker.service';
import { UserInterface } from '../../models/user-interface';

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
  private boundMentionClick = this.handleMentionClick.bind(this);

  /**
   * Initializes component with required services
   */
  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private elementRef: ElementRef,
    private authService: AuthService,
    private emojiService: EmojiService,
    private recentEmojisService: RecentEmojisService,
    private sanitizer: DomSanitizer,
    private threadService: ThreadService,
    private emojiPickerService: EmojiPickerService
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
    document.addEventListener('mentionClick', this.boundMentionClick);
    document.addEventListener('click', this.handleGlobalClick, true);
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
   * Handles mention click events
   */
  private handleMentionClick(event: Event): void {
    if (event instanceof CustomEvent) {
      this.openMentionedProfile(event.detail);
    }
  }

  /**
   * Opens profile dialog
   */
  openProfile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const msg = this.allMessages[0];
    if (!msg || this.dialog.openDialogs.length > 0) return;

    const config = this.createDialogConfig(msg);
    this.openProfileDialog(msg, config);
  }

  /**
   * Creates dialog configuration
   */
  private createDialogConfig(msg: renderMessageInterface): any {
    return {
      width: '400px',
      hasBackdrop: true,
      panelClass: msg.isOwnMessage
        ? ['profile-dialog', 'right-aligned']
        : ['profile-dialog', 'center-aligned'],
      autoFocus: false,
      disableClose: false,
    };
  }

  /**
   * Opens appropriate profile dialog
   */
  private openProfileDialog(msg: renderMessageInterface, config: any): void {
    if (msg.isOwnMessage) {
      this.dialog.open(UserOverviewComponent, config);
    } else {
      this.dialog.open(ProfileOverviewComponent, {
        ...config,
        data: this.createProfileData(msg),
      });
    }
  }

  /**
   * Creates profile data object
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
   * Cleans up event listeners
   */
  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('mentionClick', this.boundMentionClick);
  }

  /**
   * Handles global click events
   */
  private handleGlobalClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const mentionElement = target.closest('.mention') as HTMLElement;

    if (mentionElement) {
      this.handleMentionElementClick(event, mentionElement);
    }
  };

  /**
   * Handles clicks on mention elements
   */
  private handleMentionElementClick(
    event: Event,
    mentionElement: HTMLElement
  ): void {
    const chatContainer = document.querySelector('.main-chat-body');
    if (chatContainer instanceof HTMLElement) {
      chatContainer.focus();
    }

    const username = mentionElement.getAttribute('data-username');
    if (username) {
      event.preventDefault();
      event.stopPropagation();
      this.openMentionedProfile(username);
    }
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
    this.activeEmojiPicker = null;
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
        this.activeEmojiPicker = null;
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
   * Formats message with mention highlights
   */
  formatMessageWithMentions(message: string): SafeHtml {
    const formattedMessage = message.replace(
      /@(\w+\s*\w*)/g,
      (match, username) => {
        const cleanUsername = username.trim();
        return `<span class="mention" data-username="${cleanUsername}">@${cleanUsername}</span>`;
      }
    );
    return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
  }

  /**
   * Opens mentioned user's profile
   */
  private openMentionedProfile(username: string): void {
    if (this.dialog.openDialogs.length > 0) return;

    const userData = this.user.find(
      (u) => u.username?.toLowerCase() === username.toLowerCase()
    );
    if (!userData) return;

    const config = this.createMentionProfileConfig(userData);
    this.openMentionProfileDialog(userData, config);
  }

  /**
   * Creates config for mention profile dialog
   */
  private createMentionProfileConfig(userData: any): any {
    return {
      width: '400px',
      hasBackdrop: true,
      panelClass:
        userData.localID === this.currentUser?.uid
          ? ['profile-dialog', 'right-aligned']
          : ['profile-dialog', 'center-aligned'],
      autoFocus: false,
      disableClose: false,
    };
  }

  /**
   * Opens appropriate dialog for mentioned profile
   */
  private openMentionProfileDialog(userData: any, config: any): void {
    if (userData.localID === this.currentUser?.uid) {
      this.dialog.open(UserOverviewComponent, config);
    } else {
      const profileData: UserInterface = {
        username: userData.username,
        email: userData.email,
        photoURL: userData.photoURL || 'img-placeholder/default-avatar.svg',
        localID: userData.localID,
        uid: userData.uid,
        online: false,
      };

      this.dialog.open(ProfileOverviewComponent, {
        ...config,
        data: profileData,
      });
    }
  }
}
