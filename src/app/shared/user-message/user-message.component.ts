import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  Inject,
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
    FormsModule,
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
  @Input() allMessages: DisplayMessageInterface[] = [];
  @Input() CurrentUserURL: any;
  hoverComponent: boolean = false;
  activeEmojiPicker: string | null = null;
  @Output() openThreadEvent = new EventEmitter<void>();
  private currentUser: any = null;
  emojiList: any[] = [];
  editStatusMessage: boolean = false;

  currentEditingMessageId: string | null = null;  // Speichert die ID der bearbeiteten Nachricht
  originalMessageContent: string = '';  // Speichert den ursprünglichen Text der bearbeiteten Nachricht
  

  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private elementRef: ElementRef,
    private authService: AuthService,
    private emojiService: EmojiService,
    private recentEmojisService: RecentEmojisService
  ) {
    this.emojiList = this.emojiService.emojiList;

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

getEditMessageStatus(status: boolean, userMessageId: string) {
  if (status) {
    const messageToEdit = this.allMessages.find(msg => msg.userMessageId === userMessageId);
    if (messageToEdit) {
      this.currentEditingMessageId = userMessageId;
      this.originalMessageContent = messageToEdit.message;  // Ursprünglichen Text speichern
    }
  } else {
    this.currentEditingMessageId = null;
    this.originalMessageContent = '';
  }
  this.editStatusMessage = status;
}

  // onSave wird nun die editMessage Methode aufrufen und den Text aus der textarea übergeben
  onSave(): void {
    if (this.currentEditingMessageId) {
      this.editMessage(this.currentEditingMessageId, this.allMessages[0]?.message);
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
      const currentUser = await firstValueFrom(this.authService.user$);
      if (currentUser) {
        await this.userData.addEmojiReaction(
          messageId,
          emoji.name,
          currentUser.uid
        );
        // Aktualisiere die Recent Emojis
        await this.recentEmojisService.updateRecentEmoji(emoji);
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

  editMessage(userMessageId: string, updatedMessage?: string) {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );
    if (!messageToEdit) return;
    this.originalMessageContent = messageToEdit.message;     // Ursprünglichen Text speichern
    const newMessage = updatedMessage || messageToEdit.message; // Wenn ein aktualisierter Text übergeben wurde (z. B. aus der textarea), verwenden wir diesen

    this.userData     // Aktualisieren der Nachricht mit dem neuen Text (wird erst bei „Speichern“ durchgeführt)
      .updateMessage(userMessageId, { message: newMessage })
      .then(() => {
        console.log('Nachricht erfolgreich aktualisiert');
        this.editStatusMessage = false; // Bearbeitungsmodus beenden
      })
      .catch((error) => {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
      });
  }

  onCancel(): void {
    this.editStatusMessage = false;
  
    if (this.currentEditingMessageId) {
      const message = this.allMessages.find(msg => msg.userMessageId === this.currentEditingMessageId);
      if (message) {
        message.message = this.originalMessageContent;  // Zurücksetzen der Nachricht auf den ursprünglichen Text
      }
    }
  }

  getEmojiSymbol(emojiData: string | EmojiReaction): string {
    const emojiName = this.isEmojiReaction(emojiData)
      ? emojiData.name
      : emojiData;
    return this.emojiList.find((e) => e.name === emojiName)?.emoji || '';
  }
}
