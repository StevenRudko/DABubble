import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';

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
  @Input() messagesToday: { timestamp: number; userId: number; message: string; hours: number; minutes: number }[] = [];
  @Input() messagesOld: { timestamp: number; userId: number; message: string; hours: number; minutes: number }[] = [];

  
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
