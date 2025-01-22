import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';
import { UserMsgOptionsComponent } from '../user-msg-options/user-msg-options.component';
import { UserData } from '../../service/user-data.service';
import { EditMessageComponent } from '../edit-message/edit-message.component';
import { AuthService } from '../../service/auth.service';
import { firstValueFrom } from 'rxjs';
import { UserMessageInterface, EmojiReaction } from '../../models/user-message';
import { UniquePipe } from '../pipes/unique.pipe';

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
  ],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;
  // @Input() allMessages: DisplayMessageInterface[] = [];
  @Input() allMessages: {
    timestamp: number;
    userMessageId: string;
    author: string;
    authorPhoto: any;
    isOwnMessage: boolean;
    message: string;
    emojis: string[];
    hours: number;
    minutes: number;
  }[] = [];
  @Input() CurrentUserURL: any;

  hoverComponent: boolean = false;
  activeEmojiPicker: string | null = null;
  @Output() openThreadEvent = new EventEmitter<void>();

  private currentUser: any = null;

  emojiList: any[] = [
    { name: 'smile', emoji: '😊' },
    { name: 'thumbs_up', emoji: '👍' },
    { name: 'heart', emoji: '❤️' },
    { name: 'rocket', emoji: '🚀' },
    { name: 'laughing', emoji: '😂' },
    { name: 'clap', emoji: '👏' },
    { name: 'fire', emoji: '🔥' },
    { name: 'star', emoji: '⭐' },
    { name: 'sunglasses', emoji: '😎' },
    { name: 'thinking', emoji: '🤔' },
    { name: 'wink', emoji: '😉' },
    { name: 'crying', emoji: '😭' },
    { name: 'kiss', emoji: '😘' },
    { name: 'celebrate', emoji: '🎉' },
    { name: 'party', emoji: '🥳' },
    { name: 'confetti', emoji: '🎊' },
    { name: 'thumbs_down', emoji: '👎' },
    { name: 'ok_hand', emoji: '👌' },
    { name: 'prayer', emoji: '🙏' },
    { name: 'praise', emoji: '🙌' },
    { name: 'check', emoji: '✅' },
  ];

  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private elementRef: ElementRef,
    private authService: AuthService
  ) {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeEmojiPicker = null;
    }
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  onMouseEnter(msgId: string) {
    if (!this.activeEmojiPicker) {
      this.hoverComponent = true;
    }
  }

  onMouseLeave(msgId: string) {
    this.hoverComponent = false;
  }

  toggleEmojiPicker(messageId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeEmojiPicker =
      this.activeEmojiPicker === messageId ? null : messageId;
    this.hoverComponent = !this.activeEmojiPicker;
  }

  async handleEmojiSelected(emoji: any, messageId: string): Promise<void> {
    try {
      console.log('Handling emoji selection:', { emoji, messageId });
      const currentUser = await firstValueFrom(this.authService.user$);
      console.log('Current user:', currentUser);

      if (currentUser) {
        await this.userData.addEmojiReaction(
          messageId,
          emoji.name,
          currentUser.uid
        );
        console.log('Emoji reaction successfully handled');
        this.activeEmojiPicker = null;
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Emoji-Reaktion:', error);
    }
  }

  private isEmojiReaction(
    emoji: string | EmojiReaction
  ): emoji is EmojiReaction {
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

  editMessage(userMessageId: string) {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );

    if (!messageToEdit) return;

    const dialogRef = this.dialog.open(EditMessageComponent, {
      data: { message: messageToEdit.message },
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((editedMessage: string) => {
      if (editedMessage !== null && editedMessage !== messageToEdit.message) {
        this.userData
          .updateMessage(userMessageId, { message: editedMessage })
          .then(() => {})
          .catch((error) => {
            console.error('Fehler beim Aktualisieren der Nachricht:', error);
          });
      }
    });
  }

  getEmojiSymbol(emojiData: string | EmojiReaction): string {
    const emojiName = this.isEmojiReaction(emojiData)
      ? emojiData.name
      : emojiData;
    return this.emojiList.find((e) => e.name === emojiName)?.emoji || '';
  }
}
