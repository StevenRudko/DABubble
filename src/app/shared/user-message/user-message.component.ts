import { Component } from '@angular/core';
import { HoverService } from '../../../assets/service/hover.service';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [],
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
