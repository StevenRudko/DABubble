import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';
import { RecentEmojisService } from '../../service/recent-emojis.service';
import { ThreadService } from '../../service/open-thread.service';

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
  @Output() changeEditMessageState = new EventEmitter<boolean>();

  @Input() userMessageId: string | undefined;
  @Input() showAllOptions: boolean = false;
  @Input() isThreadMessage: boolean = false;
  @Input() parentMessageId: string | null = null;

  activePopup: 'none' | 'emoji' | 'edit' = 'none';
  isMouseOverButton: boolean = false;
  isMouseOverPopup: boolean = false;
  recentEmojis: any[] = [];

  /**
   * Initializes component with required services
   */
  constructor(
    private recentEmojisService: RecentEmojisService,
    private threadService: ThreadService
  ) {}

  /**
   * Sets up recent emojis subscription
   */
  ngOnInit(): void {
    this.recentEmojisService.recentEmojis$.subscribe((emojis) => {
      this.recentEmojis = emojis;
    });
  }

  /**
   * Emits edit message state change
   */
  onHoverStateChange(status: boolean): void {
    this.changeEditMessageState.emit(status);
  }

  /**
   * Handles mouse enter on option buttons
   */
  onMouseEnter(type: string): void {
    this.isMouseOverButton = true;
    setTimeout(() => {
      this.activePopup =
        type === 'tag_face' ? 'emoji' : type === 'edit' ? 'edit' : 'none';
    }, 100);
  }

  /**
   * Handles mouse leave on option buttons
   */
  onMouseLeave(type: string): void {
    this.isMouseOverButton = false;
    setTimeout(() => {
      if (!this.isMouseOverPopup && !this.isMouseOverButton) {
        this.activePopup = 'none';
      }
    }, 100);
  }

  /**
   * Handles emoji picker mouse state
   */
  onEmojiPickerMouseState(isOver: boolean): void {
    this.handlePopupMouseState(isOver);
  }

  /**
   * Handles edit options mouse state
   */
  onEditOptionsMouseState(isOver: boolean): void {
    this.handlePopupMouseState(isOver);
  }

  /**
   * Common handler for popup mouse states
   */
  private handlePopupMouseState(isOver: boolean): void {
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
   * Emits edit message event
   */
  onEditMessage(): void {
    this.editMessageEvent.emit();
    this.activePopup = 'none';
  }

  /**
   * Emits delete message event
   */
  onDeleteMessage(): void {
    this.deleteMessageEvent.emit();
    this.activePopup = 'none';
  }

  /**
   * Forwards delete message event
   */
  forwardDeleteMessage(messageId: string): void {
    this.messageDeleted.emit(messageId);
    this.activePopup = 'none';
  }

  /**
   * Forwards edit message event
   */
  forwardEditMessage(messageId: string): void {
    this.messageEdited.emit(messageId);
    this.activePopup = 'none';
  }

  /**
   * Handles emoji selection
   */
  onEmojiSelect(emoji: any): void {
    if (this.userMessageId) {
      this.emojiSelected.emit({ emoji, messageId: this.userMessageId });
      this.recentEmojisService.updateRecentEmoji(emoji);
    }
    this.activePopup = 'none';
  }

  /**
   * Handles recent emoji click
   */
  onRecentEmojiClick(emoji: any): void {
    this.onEmojiSelect(emoji);
  }

  /**
   * Opens thread view
   */
  onOpenThread(): void {
    if (this.userMessageId) {
      this.threadService.openThread(this.userMessageId);
    }
  }
}
