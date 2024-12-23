import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent, MessageInputBoxComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  replyCount: number = 0;
}
