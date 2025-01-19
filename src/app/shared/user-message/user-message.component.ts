import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';
import { UserMsgOptionsComponent } from '../user-msg-options/user-msg-options.component';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgIf],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;
  @Input() allMessages: { timestamp: number; userMessageId: string; author: string, isOwnMessage: boolean; message: string; emojis: string[]; hours: number; minutes: number }[] = [];

  hoverStateMap: { [userMessageId: string]: boolean } = {};
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor(private dialog: MatDialog) {}

  openThread() {
    this.openThreadEvent.emit();
  }

  onMouseEnter(msgId: string) {
    this.hoverStateMap[msgId] = true;
  
    // Öffne den Dialog zur Anzeige der Optionen
    const dialogRef = this.dialog.open(UserMsgOptionsComponent, {
      backdropClass: 'custom-backdrop',  // Dies kann je nach deinem Design geändert werden
      data: { userMessageId: msgId }    // Hier kannst du beliebige Daten übergeben, z.B. die Message-ID
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      // Hier kannst du etwas tun, wenn der Dialog geschlossen wird
      // console.log('Der Dialog wurde geschlossen');
    });
  
  }

  openEditOptions(msgId: string): void {
    const dialogRef = this.dialog.open(MessagesEditOptionsComponent, {
      data: { userMessageId: msgId }  // Hier kannst du beliebige Daten übergeben
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      // Hier kannst du etwas tun, wenn der Dialog geschlossen wird
      // console.log('Der Dialog wurde geschlossen');
    });
  }

  onMouseLeave(msgId: string) {
    this.hoverStateMap[msgId] = false;
  }

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {backdropClass: 'custom-backdrop'});
    dialogRef.afterClosed().subscribe((result) => {
      // console.log('The dialog was closed');
    });
  }

}