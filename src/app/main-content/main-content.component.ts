import { Component, ViewChild } from '@angular/core';
import { MainChatComponent } from './main-chat/main-chat.component';
import { ThreadComponent } from './thread/thread.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    SidebarComponent,
    MainChatComponent,
    ThreadComponent,
    CommonModule,
    MatSidenavModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  sidebarActive: boolean = false;

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
    this.drawer.toggle();
  }
}
