import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages-edit-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './messages-edit-options.component.html',
  styleUrl: './messages-edit-options.component.scss',
})
export class MessagesEditOptionsComponent {
  @Output() mouseStateChange = new EventEmitter<boolean>();
  @Output() messageDeleted = new EventEmitter<string>();
  @Output() messageEdited = new EventEmitter<string>();
  @Input() userMsgId: string | undefined;
  @Input() isThreadMessage: boolean = false;
  @Input() parentMessageId: string | null = null;

  @Output() changeEditMessageState = new EventEmitter<boolean>();

  onEditedMessageStatusChanged() {
    this.changeEditMessageState.emit(true);
  }

  /**
   * Handles the mouseenter event on the edit options menu
   * @returns {void}
   */
  onMouseEnter(): void {
    this.mouseStateChange.emit(true);
  }

  /**
   * Handles the mouseleave event on the edit options menu
   * @returns {void}
   */
  onMouseLeave(): void {
    this.mouseStateChange.emit(false);
  }

  /**
   * Emits edit message event with message ID
   * @returns {void}
   */
  editUserMessage(): void {
    if (this.userMsgId) {
      this.messageEdited.emit(this.userMsgId);
    }
  }

  /**
   * Emits edit message event with message ID
   * @returns {void}
   */
  oldEditUserMessage(): void {
    if (this.userMsgId) {
      this.messageEdited.emit(this.userMsgId);
    }
  }

  /**
   * Emits delete message event with message ID
   * @returns {void}
   */
  deleteUserMessage(): void {
    if (this.userMsgId) {
      this.messageDeleted.emit(this.userMsgId);
    }
  }
}
