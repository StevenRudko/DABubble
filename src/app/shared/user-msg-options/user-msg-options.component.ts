import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    EmojiPickerComponent,
    MessagesEditOptionsComponent,
  ],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss',
})
export class UserMsgOptionsComponent {
  @Output() editMessageEvent = new EventEmitter<void>();
  @Output() deleteMessageEvent = new EventEmitter<void>();
  @Output() messageDeleted = new EventEmitter<string>(); // EventEmitter für die Elternkomponente
  @Input() userMessageId: string | undefined;  

  hoverFaceTag: boolean = false;
  hoverEdit: boolean = false;

  constructor() {}

  /**
   * Handles mouseenter events for different interactive elements
   * @param {string} obj - Identifier of the hovered element
   */
  onMouseEnter(obj: string) {
    this.hoverFaceTag = false;
    this.hoverEdit = false;

    if (obj === 'tag_face') {
      this.hoverFaceTag = true;
    } else if (obj === 'edit') {
      this.hoverEdit = true;
    }
  }

  onMouseLeave(obj: string) {
    if (obj === 'tag_face' && !this.hoverFaceTag) {
      this.hoverFaceTag = false;
    } else if (obj === 'edit' && !this.hoverEdit) {
      this.hoverEdit = false;
    }
  }

  onEmojiPickerMouseState(isOver: boolean) {
    this.hoverFaceTag = isOver;
    if (isOver) {
      this.hoverEdit = false;
    }
  }

  onEditOptionsMouseState(isOver: boolean) {
    this.hoverEdit = isOver;
    if (isOver) {
      this.hoverFaceTag = false;
    }
  }

  /**
   * Handle edit message request from edit options menu
   */
  onEditMessage(): void {
    this.editMessageEvent.emit();
    console.log('edit');
    this.hoverEdit = false;
  }

  /**
   * Handle delete message request from edit options menu
   */
  onDeleteMessage(): void {
    this.deleteMessageEvent.emit();
    console.log('edit');
    this.hoverEdit = false;
  }

  // Methode, um das Event an die Elternkomponente weiterzuleiten
  forwardDeleteMessage(messageId: string) {
    this.messageDeleted.emit(messageId);
  }

  
}
