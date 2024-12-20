import { Component } from '@angular/core';
import { MainChatHeaderComponent } from './main-chat-header/main-chat-header.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [MainChatHeaderComponent, MessageInputBoxComponent],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss'
})
export class MainChatComponent {

}
