import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HoverService } from '../../../service/hover.service';
import { MessageEmojisComponent } from '../message-emojis/message-emojis.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [MessageEmojisComponent, NgIf],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() showBottomRow: boolean = true;
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor(private hoverService: HoverService) {}

  onMouseEnter() {
    this.hoverService.setHoverStatus(true);
  }

  onMouseLeave() {
    this.hoverService.setHoverStatus(false);
  }

  openThread() {
    this.openThreadEvent.emit();
  }
}
