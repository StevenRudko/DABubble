import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MATERIAL_MODULES } from '../material-imports';
import { HoverService } from '../../../service/hover.service';
import { Subscription } from 'rxjs';
import { MessageEmojisComponent } from '../message-emojis/message-emojis.component';

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [FormsModule, MATERIAL_MODULES, MessageEmojisComponent],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent {
  isHovered = false;
  private hoverStatusSubscription: Subscription | undefined;

  constructor(private hoverService: HoverService) {}

  onMouseEnter() {
    this.hoverService.setHoverStatus(true);
  }

  onMouseLeave() {
    this.hoverService.setHoverStatus(false);
  }
}
