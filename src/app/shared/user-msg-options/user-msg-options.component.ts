import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    NgIf,
    EmojiPickerComponent,
    MessagesEditOptionsComponent,
  ],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss',
})
export class UserMsgOptionsComponent {
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

  /**
   * Handles mouseenter events for buttons
   * @param {string} type - Type of popup to show
   */
  onMouseEnter(type: string): void {
    this.isMouseOverButton = true;
    this.activePopup =
      type === 'tag_face' ? 'emoji' : type === 'edit' ? 'edit' : 'none';
  }

  /**
   * Handles mouseleave events for buttons
   * @param {string} type - Type of popup being left
   */
  onMouseLeave(type: string): void {
    this.isMouseOverButton = false;
    // Verzögerung um zu prüfen, ob die Maus über dem Popup ist
    setTimeout(() => {
      if (!this.isMouseOverPopup && !this.isMouseOverButton) {
        this.activePopup = 'none';
      }
    }, 100);
  }

  /**
   * Handles mouse state changes from emoji picker
   * @param {boolean} isOver - Whether mouse is over the picker
   */
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

  /**
   * Handles mouse state changes from edit options
   * @param {boolean} isOver - Whether mouse is over the options
   */
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

  /**
   * Handles edit message request
   */
  onEditMessage(): void {
    this.editMessageEvent.emit();
    this.activePopup = 'none';
  }

  /**
   * Handles delete message request
   */
  onDeleteMessage(): void {
    this.deleteMessageEvent.emit();
    this.activePopup = 'none';
  }

  /**
   * Forwards delete message event to parent
   * @param {string} messageId - ID of message to delete
   */
  forwardDeleteMessage(messageId: string): void {
    this.messageDeleted.emit(messageId);
    this.activePopup = 'none';
  }

  /**
   * Forwards edit message event to parent
   * @param {string} messageId - ID of message to edit
   */
  forwardEditMessage(messageId: string): void {
    this.messageEdited.emit(messageId);
    this.activePopup = 'none';
  }

  onEmojiSelect(emoji: any): void {
    if (this.userMessageId) {
      this.emojiSelected.emit({ emoji, messageId: this.userMessageId });
    }
    this.activePopup = 'none';
  }
}
