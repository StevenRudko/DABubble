import { Component } from '@angular/core';
import { MainChatHeaderComponent } from './main-chat-header/main-chat-header.component';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [MainChatHeaderComponent],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss'
})
export class MainChatComponent {

}
