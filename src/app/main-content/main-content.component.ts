import { Component } from '@angular/core';
import { MainChatComponent } from './main-chat/main-chat.component';
import { ThreadComponent } from './thread/thread.component';
// import { SidebarComponent } from "./sidebar/sidebar.component";

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MainChatComponent, ThreadComponent ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}
