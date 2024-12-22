import { Component } from '@angular/core';
import { HoverService } from '../../../assets/service/hover.service';
import { MessageEmojisComponent } from '../message-emojis/message-emojis.component';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [MessageEmojisComponent],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  constructor(private hoverService: HoverService) {}

  onMouseEnter() {
    this.hoverService.setHoverStatus(true);
  }

  onMouseLeave() {
    this.hoverService.setHoverStatus(false);
  }
}
