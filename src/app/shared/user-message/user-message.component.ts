import { Component, Input } from '@angular/core';
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

  constructor(private hoverService: HoverService) {}

  onMouseEnter() {
    this.hoverService.setHoverStatus(true);
  }

  onMouseLeave() {
    this.hoverService.setHoverStatus(false);
  }
}
