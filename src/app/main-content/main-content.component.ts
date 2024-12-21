import { Component } from '@angular/core';
import { MainChatComponent } from './main-chat/main-chat.component';
import { ThreadComponent } from './thread/thread.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    SidebarComponent,
    MainChatComponent,
    ThreadComponent,
    NgIf,
    CommonModule,
    MATERIAL_MODULES,
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent {
  sidebarActive:boolean = false;

  openSidebar() {
    this.sidebarActive = !this.sidebarActive;
  }
}
