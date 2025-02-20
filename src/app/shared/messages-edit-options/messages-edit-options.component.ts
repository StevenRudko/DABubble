import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component for handling message editing options in both thread and main chat views
 * @component
 */
@Component({
  selector: 'app-messages-edit-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, MatIconModule, MatButtonModule],
  templateUrl: './messages-edit-options.component.html',
  styleUrl: './messages-edit-options.component.scss',
})
export class MessagesEditOptionsComponent {
  /** Emits when mouse state changes over the component */
  @Output() mouseStateChange = new EventEmitter<boolean>();

  /** Emits when a message is deleted with the message ID */
  @Output() messageDeleted = new EventEmitter<string>();

  /** Emits when a message is edited with the message ID */
  @Output() messageEdited = new EventEmitter<string>();

  /** The ID of the message being edited */
  @Input() userMsgId: string | undefined;

  /** Flag indicating if the component is being used in a thread view */
  @Input() isThreadMessage: boolean = false;

  /** ID of the parent message if in a thread */
  @Input() parentMessageId: string | null = null;

  /** Emits when edit message state changes */
  @Output() changeEditMessageState = new EventEmitter<boolean>();

  /**
   * Handles the state change when message editing is initiated
   * Emits true to indicate edit mode has been activated
   * @returns {void}
   */
  onEditedMessageStatusChanged(): void {
    this.changeEditMessageState.emit(true);
  }

  /**
   * Handles mouse enter event on the component
   * Emits true to indicate mouse is over the component
   * @returns {void}
   */
  onMouseEnter(): void {
    this.mouseStateChange.emit(true);
  }

  /**
   * Handles mouse leave event on the component
   * Emits false to indicate mouse has left the component
   * @returns {void}
   */
  onMouseLeave(): void {
    this.mouseStateChange.emit(false);
  }

  /**
   * Initiates the message editing process
   * Emits the message ID when edit is requested
   * @returns {void}
   */
  editUserMessage(): void {
    if (this.userMsgId) {
      this.messageEdited.emit(this.userMsgId);
    }
  }

  /**
   * Initiates the message deletion process
   * Emits the message ID when deletion is requested
   * @returns {void}
   */
  deleteUserMessage(): void {
    if (this.userMsgId) {
      this.messageDeleted.emit(this.userMsgId);
    }
  }
}
