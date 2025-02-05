import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { UserMsgOptionsComponent } from '../user-msg-options/user-msg-options.component';
import { UserData } from '../../service/user-data.service';
import { AuthService } from '../../service/auth.service';
import { firstValueFrom } from 'rxjs';
import { EmojiReaction } from '../../models/user-message';
import { UniquePipe } from '../pipes/unique.pipe';
import { EmojiService } from '../../service/emoji.service';
import { RecentEmojisService } from '../../service/recent-emojis.service';
import { FormsModule } from '@angular/forms';
import { ProfileOverviewComponent } from '../profile-overview/profile-overview.component';
import { UserOverviewComponent } from '../../shared/user-overview/user-overview.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmojiOverviewComponent } from '../emoji-overview/emoji-overview.component';

interface DisplayMessageInterface {
  timestamp: number;
  userMessageId: string;
  author: string;
  isOwnMessage: boolean;
  message: string;
  emojis: EmojiReaction[] | string[];
  hours: number;
  minutes: number;
}

interface UserProfileData {
  username: string;
  email: string;
  photoURL: string;
  status: 'active' | 'offline';
  uid: string;
}

interface ThreadInfo {
  replyCount: number;
  lastReplyTime?: {
    hours: number;
    minutes: number;
  };
}

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
  @Input() allMessages: DisplayMessageInterface[] = [];
  @Input() CurrentUserURL: any;
  hoverComponent: boolean = false;
  hoverComponentEmojiOverviewMap: { [key: string]: boolean } = {};
  activeEmojiPicker: string | null = null;
  @Input() user: any[] = [];
  @Input() parentMessageId: string | null = null;
  @Output() openThreadEvent = new EventEmitter<void>();
  @Output() openThreadWithMessage = new EventEmitter<string>();

  private currentUser: any = null;
  emojiList: any[] = [];
  editStatusMessage: boolean = false;

  currentEditingMessageId: string | null = null;
  originalMessageContent: string = '';
  threadInfo: ThreadInfo | null = null;

  private boundMentionClick = (event: Event) => {
    if (event instanceof CustomEvent) {
      this.openMentionedProfile(event.detail);
    }
  };
  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private elementRef: ElementRef,
    private authService: AuthService,
    private emojiService: EmojiService,
    private recentEmojisService: RecentEmojisService,
    private sanitizer: DomSanitizer
  ) {
    this.emojiList = this.emojiService.emojiList;
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadThreadInfo();
    document.addEventListener('mentionClick', this.boundMentionClick);
    document.addEventListener('click', this.handleGlobalClick, true);

    // Neuer Listener für Emoji-Picker
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('mat-icon') && !target.closest('app-emoji-picker')) {
        this.activeEmojiPicker = null;
      }
    });
  }

  openProfile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const msg = this.allMessages[0];
    if (!msg) return;

    if (this.dialog.openDialogs.length > 0) return; // Verhindert mehrfaches Öffnen

    const config = {
      width: '400px',
      hasBackdrop: true,
      panelClass: msg.isOwnMessage
        ? ['profile-dialog', 'right-aligned']
        : ['profile-dialog', 'center-aligned'],
      autoFocus: false,
      disableClose: false,
    };

    if (msg.isOwnMessage) {
      this.dialog.open(UserOverviewComponent, config);
    } else {
      this.dialog.open(ProfileOverviewComponent, {
        ...config,
        data: this.createProfileData(msg),
      });
    }
  }

  private createProfileData(msg: DisplayMessageInterface): UserProfileData {
    const userData = this.user.find((u) => u.username === msg.author);
    return {
      username: userData?.username || '',
      email: userData?.email || '',
      photoURL: userData?.photoURL || 'img-placeholder/default-avatar.svg',
      status: 'offline',
      uid: userData?.localID || '',
    };
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('mentionClick', this.boundMentionClick);
  }

  private handleGlobalClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.closest('.mention')) {
      const chatContainer = document.querySelector('.main-chat-body');
      if (chatContainer instanceof HTMLElement) {
        chatContainer.focus();
      }

      const mentionElement = target.closest('.mention') as HTMLElement;
      const username = mentionElement.getAttribute('data-username');
      if (username) {
        event.preventDefault();
        event.stopPropagation();
        this.openMentionedProfile(username);
      }
    }
  };

  private async loadThreadInfo() {
    if (!this.allMessages || this.allMessages.length === 0) return;

    const message = this.allMessages[0];
    try {
      const comments = await this.userData.getThreadMessages(
        message.userMessageId
      );

      if (comments && comments.length > 0) {
        const sortedComments = comments.sort((a, b) => {
          const timeA = a.time.seconds * 1000 + a.time.nanoseconds / 1000000;
          const timeB = b.time.seconds * 1000 + b.time.nanoseconds / 1000000;
          return timeB - timeA;
        });

        const lastComment = sortedComments[0];
        const lastCommentTime = new Date(
          lastComment.time.seconds * 1000 +
            lastComment.time.nanoseconds / 1000000
        );

        this.threadInfo = {
          replyCount: comments.length,
          lastReplyTime: {
            hours: lastCommentTime.getHours(),
            minutes: lastCommentTime.getMinutes(),
          },
        };
      } else {
        this.threadInfo = {
          replyCount: 0,
        };
      }
    } catch (error) {
      console.error('Error loading thread info:', error);
      this.threadInfo = {
        replyCount: 0,
      };
    }
  }

  getEditMessageStatus(status: boolean, userMessageId: string) {
    if (status) {
      const messageToEdit = this.allMessages.find(
        (msg) => msg.userMessageId === userMessageId
      );
      if (messageToEdit) {
        this.currentEditingMessageId = userMessageId;
        this.originalMessageContent = messageToEdit.message;
      }
    } else {
      this.currentEditingMessageId = null;
      this.originalMessageContent = '';
    }
    this.editStatusMessage = status;
  }

  onSave(): void {
    if (this.currentEditingMessageId) {
      this.editMessage(
        this.currentEditingMessageId,
        this.allMessages[0]?.message
      );
    }
  }

  openThread() {
    if (this.allMessages && this.allMessages.length > 0) {
      const messageId = this.allMessages[0].userMessageId;
      this.openThreadWithMessage.emit(messageId);
    }
  }

  onMouseEnter(msgId: string) {
    if (!this.activeEmojiPicker) {
      this.hoverComponent = true;
    }
  }

  onMouseLeave(msgId: string) {
    this.hoverComponent = false;
  }

  onMouseEnterReactionIcon(emojiId: string): void {
    this.hoverComponentEmojiOverviewMap[emojiId] = true;
  }
  
  onMouseLeaveReactionIcon(emojiId: string): void {
    this.hoverComponentEmojiOverviewMap[emojiId] = false;
  }

  toggleEmojiPicker(messageId: string, event: MouseEvent): void {
    event.stopPropagation();
    setTimeout(() => {
      this.activeEmojiPicker =
        this.activeEmojiPicker === messageId ? null : messageId;
      this.hoverComponent = !this.activeEmojiPicker;
    }, 100);
  }

  handleEmojiSelected(emoji: any, messageId: string): void {
    if (this.editStatusMessage) {
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
      this.activeEmojiPicker = null;
    } else {
      this.handleEmojiReaction(emoji, messageId);
      this.activeEmojiPicker = null;
    }
  }

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
      console.error('Fehler beim Hinzufügen der Emoji-Reaktion:', error);
    }
  }

  private isEmojiReaction(emoji: string | EmojiReaction): emoji is EmojiReaction {
    return typeof emoji === 'object' && emoji !== null && 'name' in emoji;
  }

  getEmojiCount(message: DisplayMessageInterface, emojiName: string): number {
    return (message.emojis || []).filter((reaction) => {
      if (this.isEmojiReaction(reaction)) {
        return reaction.name === emojiName;
      }
      return reaction === emojiName;
    }).length;
  }

  hasUserReacted(message: DisplayMessageInterface, emojiName: string): boolean {
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

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      backdropClass: 'custom-backdrop',
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  deleteMessage(messageId: string) {
    this.userData
      .deleteMessage(messageId)
      .then(() => {})
      .catch((error) => {
        console.error('Fehler beim Löschen der Nachricht:', error);
      });
  }

  editMessage(userMessageId: string, updatedMessage?: string) {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );
    if (!messageToEdit) return;
    this.originalMessageContent = messageToEdit.message;
    const newMessage = updatedMessage || messageToEdit.message;

    this.userData
      .updateMessage(userMessageId, { message: newMessage })
      .then(() => {
        console.log('Nachricht erfolgreich aktualisiert');
        this.editStatusMessage = false;
      })
      .catch((error) => {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
      });
  }

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

  getEmojiAuthorName(msg: any, emojiData: string | EmojiReaction): string[] {
    const emojiAuthors: string[] = [];
    const emojiName = this.isEmojiReaction(emojiData) ? emojiData.name : emojiData;
  
    if (this.isEmojiReaction(emojiData)) {
      // Durchlaufe alle Reaktionen, um die Autoren zu finden, die auf dieses Emoji reagiert haben
      msg.emojis.forEach((reaction: EmojiReaction) => {
        if (reaction.name === emojiName) {
          const user = this.user.find((u) => u.localID === reaction.user);
          if (user) {
            emojiAuthors.push(user.username);
          }
        }
      });
    } else {
      // Wenn es keine Emoji-Reaktion gibt, füge den ersten Benutzer hinzu, der das Emoji verwendet hat
      const user = this.user.find((u) => u.localID === emojiData);
      if (user) {
        emojiAuthors.push(user.username);
      }
    }
  
    // Rückgabe eines Arrays von Benutzernamen
    return emojiAuthors;
  }

  getEmojiSymbol(emojiData: string | EmojiReaction): string {
    const emojiName = this.isEmojiReaction(emojiData)
      ? emojiData.name
      : emojiData;
    return this.emojiList.find((e) => e.name === emojiName)?.emoji || '';
  }

  formatMessageWithMentions(message: string): SafeHtml {
    const formattedMessage = message.replace(
      /@(\w+\s*\w*)/g,
      (match, username) => {
        const cleanUsername = username.trim();
        // Statt onclick einen data-username Attribut verwenden
        return `<span class="mention" data-username="${cleanUsername}">@${cleanUsername}</span>`;
      }
    );
    return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
  }

  private openMentionedProfile(username: string): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    const userData = this.user.find(
      (u) => u.username?.toLowerCase() === username.toLowerCase()
    );

    if (!userData) return;

    const config = {
      width: '400px',
      hasBackdrop: true,
      panelClass:
        userData.localID === this.currentUser?.uid
          ? ['profile-dialog', 'right-aligned']
          : ['profile-dialog', 'center-aligned'],
      autoFocus: false,
      disableClose: false,
    };

    if (userData.localID === this.currentUser?.uid) {
      this.dialog.open(UserOverviewComponent, config);
    } else {
      const profileData: UserProfileData = {
        username: userData.username,
        email: userData.email,
        photoURL: userData.photoURL || 'img-placeholder/default-avatar.svg',
        status: 'offline',
        uid: userData.localID,
      };

      this.dialog.open(ProfileOverviewComponent, {
        ...config,
        data: profileData,
      });
    }
  }

  onOpenThread(messageId: string): void {
    this.openThreadWithMessage.emit(messageId);
  }
}
