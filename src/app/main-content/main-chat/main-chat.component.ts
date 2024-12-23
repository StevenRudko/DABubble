import { Component, Output, EventEmitter } from '@angular/core';
import { MainChatHeaderComponent } from './main-chat-header/main-chat-header.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { MainChatDailyMessagesComponent } from '../main-chat-daily-messages/main-chat-daily-messages.component';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    MainChatHeaderComponent,
    UserMessageComponent,
    MessageInputBoxComponent,
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent {
  @Output() openThreadEvent = new EventEmitter<void>();

  openThread() {
    this.openThreadEvent.emit();
  }
}
