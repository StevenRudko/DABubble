import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  imports: [CommonModule, MATERIAL_MODULES, NgIf, UserMsgOptionsComponent],
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
    isOwnMessage: boolean;
    message: string;
    emojis: string[];
    hours: number;
    minutes: number;
  }[] = [];

  hoverComponent: boolean = false;
  hoverFaceTag: boolean = false;
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor(private dialog: MatDialog, private userData: UserData) {}

  openThread() {
    this.openThreadEvent.emit();
  }

  onMouseEnter(msgId: string) {
    this.hoverComponent = true;
    this.hoverFaceTag = true;
  }

  onMouseLeave(msgId: string) {
    this.hoverComponent = false;
  }

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      backdropClass: 'custom-backdrop',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log('The dialog was closed');
    });
  }

  // Event-Handler, der beim Löschen einer Nachricht aufgerufen wird
  deleteMessage(messageId: string) {

    this.userData.deleteMessage(messageId)
    .then(() => {
      console.log('Nachricht erfolgreich gelöscht');
    })
    .catch((error) => {
      console.error('Fehler beim Löschen der Nachricht:', error);
    });

  }

  editMessage(userMessageId: string) {
    // Finde die Nachricht basierend auf der userMessageId aus allMessages (oder einer anderen Quelle)
    const messageToEdit = this.allMessages.find(msg => msg.userMessageId === userMessageId);
  
    if (!messageToEdit) {
      console.error('Nachricht nicht gefunden');
      return;
    }
  
    // Öffnen des Dialogs und Übergeben der Nachricht zur Bearbeitung
    const dialogRef = this.dialog.open(EditMessageComponent, {
      data: { message: messageToEdit.message },  // Übergebe den Text der Nachricht
      backdropClass: 'custom-backdrop',
    });
  
    // Wenn der Dialog geschlossen wird (nach dem Speichern oder Abbrechen)
    dialogRef.afterClosed().subscribe((editedMessage: string) => {
      if (editedMessage !== null && editedMessage !== messageToEdit.message) {
        console.log(editedMessage);
        // Wenn die Nachricht geändert wurde, rufe die Update-Funktion auf
        this.userData.updateMessage(userMessageId, { message: editedMessage })
          .then(() => {
            console.log('Nachricht erfolgreich aktualisiert');
          })
          .catch((error) => {
            console.error('Fehler beim Aktualisieren der Nachricht:', error);
          });
      }
    });
}

}