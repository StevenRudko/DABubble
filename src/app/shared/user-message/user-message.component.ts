import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';

interface MessageInterface {
  timestamp: number;
  userMessageId: string;
  author: string;
  message: string;
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;
  @Input() messagesToday: MessageInterface[] = [];
  @Input() messagesOld: MessageInterface[] = [];

  isHoveredActive: boolean = false;
  isThreadContext: boolean = false;
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor() {}

  openThread() {
    this.openThreadEvent.emit();
  }

  onMouseEnter() {
    this.isHoveredActive = true;
    this.showReactionEmojis = true;
  }

  onMouseLeave() {
    this.isHoveredActive = false;
    this.showReactionEmojis = false;
  }
}
