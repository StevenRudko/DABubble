import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';
import { RecentEmojisService } from '../../service/recent-emojis.service';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    NgIf,
    NgFor,
    EmojiPickerComponent,
    MessagesEditOptionsComponent,
  ],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss',
})
export class UserMsgOptionsComponent implements OnInit {
  @Output() editMessageEvent = new EventEmitter<void>();
  @Output() deleteMessageEvent = new EventEmitter<void>();
  @Output() messageDeleted = new EventEmitter<string>();
  @Output() messageEdited = new EventEmitter<string>();
  @Output() emojiSelected = new EventEmitter<any>();

  @Input() userMessageId: string | undefined;
  @Input() showAllOptions: boolean = false;

  activePopup: 'none' | 'emoji' | 'edit' = 'none';
  isMouseOverButton: boolean = false;
  isMouseOverPopup: boolean = false;
  recentEmojis: any[] = [];

  constructor(private recentEmojisService: RecentEmojisService) {}

  ngOnInit() {
    this.recentEmojisService.recentEmojis$.subscribe((emojis) => {
      this.recentEmojis = emojis;
    });
  }

  onMouseEnter(type: string): void {
    this.isMouseOverButton = true;
    this.activePopup =
      type === 'tag_face' ? 'emoji' : type === 'edit' ? 'edit' : 'none';
  }

  onMouseLeave(type: string): void {
    this.isMouseOverButton = false;
    setTimeout(() => {
      if (!this.isMouseOverPopup && !this.isMouseOverButton) {
        this.activePopup = 'none';
      }
    }, 100);
  }

  onEmojiPickerMouseState(isOver: boolean): void {
    this.isMouseOverPopup = isOver;
    if (!isOver && !this.isMouseOverButton) {
      setTimeout(() => {
        if (!this.isMouseOverButton) {
          this.activePopup = 'none';
        }
      }, 100);
    }
  }

  onEditOptionsMouseState(isOver: boolean): void {
    this.isMouseOverPopup = isOver;
    if (!isOver && !this.isMouseOverButton) {
      setTimeout(() => {
        if (!this.isMouseOverButton) {
          this.activePopup = 'none';
        }
      }, 100);
    }
  }

  onEditMessage(): void {
    this.editMessageEvent.emit();
    this.activePopup = 'none';
  }

  onDeleteMessage(): void {
    this.deleteMessageEvent.emit();
    this.activePopup = 'none';
  }

  forwardDeleteMessage(messageId: string): void {
    this.messageDeleted.emit(messageId);
    this.activePopup = 'none';
  }

  forwardEditMessage(messageId: string): void {
    this.messageEdited.emit(messageId);
    this.activePopup = 'none';
  }

  onEmojiSelect(emoji: any): void {
    if (this.userMessageId) {
      this.emojiSelected.emit({ emoji, messageId: this.userMessageId });
      this.recentEmojisService.updateRecentEmoji(emoji);
    }
    this.activePopup = 'none';
  }

  onRecentEmojiClick(emoji: any): void {
    this.onEmojiSelect(emoji);
  }
}
