import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgIf, EmojiPickerComponent],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;
  @Input() messagesToday: { timestamp: number; userMessageId: string; author: string, message: string; emojis: string[]; hours: number; minutes: number }[] = [];
  @Input() messagesOld: { timestamp: number; userMessageId: string; author: string; message: string; emojis: string[]; hours: number; minutes: number }[] = [];

  hoverStateMap: { [userMessageId: string]: boolean } = {};
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor(private dialog: MatDialog) {}

  openThread() {
    this.openThreadEvent.emit();
  }

  onMouseEnter(msgId: string) {
    this.hoverStateMap[msgId] = true;
  }

  onMouseLeave(msgId: string) {
    this.hoverStateMap[msgId] = false;
  }

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}