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

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    NgIf,
    UserMsgOptionsComponent,
    EmojiPickerComponent,
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

  constructor(
    private dialog: MatDialog,
    private userData: UserData,
    private elementRef: ElementRef
  ) {}

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
    // Nur hover-Optionen anzeigen wenn kein Emoji-Picker aktiv ist
    if (!this.activeEmojiPicker) {
      this.hoverComponent = true;
    }
  }

  onMouseLeave(msgId: string) {
    this.hoverComponent = false;
  }

  toggleEmojiPicker(messageId: string, event: MouseEvent): void {
    event.stopPropagation();
    // Direkte Zuweisung: Entweder null oder die neue messageId
    this.activeEmojiPicker =
      this.activeEmojiPicker === messageId ? null : messageId;

    // Hover-Optionen ausblenden wenn ein Picker aktiv ist
    this.hoverComponent = !this.activeEmojiPicker;
  }

  handleEmojiSelected(emoji: any, messageId: string): void {
    const messageIndex = this.allMessages.findIndex(
      (msg) => msg.userMessageId === messageId
    );
    if (messageIndex !== -1) {
      if (!this.allMessages[messageIndex].emojis) {
        this.allMessages[messageIndex].emojis = [];
      }
      this.allMessages[messageIndex].emojis.push(emoji.emoji);
      this.activeEmojiPicker = null;
    }
  }

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      backdropClass: 'custom-backdrop',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log('The dialog was closed');
    });
  }

  deleteMessage(messageId: string) {
    this.userData
      .deleteMessage(messageId)
      .then(() => {
        // console.log('Nachricht erfolgreich gelöscht');
      })
      .catch((error) => {
        // console.error('Fehler beim Löschen der Nachricht:', error);
      });
  }

  editMessage(userMessageId: string) {
    const messageToEdit = this.allMessages.find(
      (msg) => msg.userMessageId === userMessageId
    );

    if (!messageToEdit) {
      // console.error('Nachricht nicht gefunden');
      return;
    }

    const dialogRef = this.dialog.open(EditMessageComponent, {
      data: { message: messageToEdit.message },
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((editedMessage: string) => {
      if (editedMessage !== null && editedMessage !== messageToEdit.message) {
        this.userData
          .updateMessage(userMessageId, { message: editedMessage })
          .then(() => {
            // console.log('Nachricht erfolgreich aktualisiert');
          })
          .catch((error) => {
            // console.error('Fehler beim Aktualisieren der Nachricht:', error);
          });
      }
    });
  }

}
