import { Component, inject, ViewChild } from '@angular/core';
import { MainChatComponent } from './main-chat/main-chat.component';
import { ThreadComponent } from './thread/thread.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../service/auth.service';
import { PresenceService } from '../service/presence.service';

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
    HeaderComponent,
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent {
  @ViewChild('drawer') drawer!: MatSidenav;

  onlineUsers: string[] = [];
  sidebarActive: boolean = false;
  threadVisible: boolean = true;

  constructor(
    private authService: AuthService,
    private presenceService: PresenceService
  ) {
    this.authService.user$.subscribe((user) => {
      console.log('USER DATEN:', user);
      if (user) {
        console.log('Email:', user.email);
        console.log('Name:', user.displayName);
        console.log('Photo URL:', user.photoURL);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  ngOnInit(): void {
    this.presenceService.onlineUsers$.subscribe((statusData) => {
      this.onlineUsers = Object.keys(statusData || {}).filter(
        (uid) => statusData[uid] === 'online'
      );
      console.log('Gefilterte Online-Benutzer:', this.onlineUsers);
    });
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
    this.drawer.toggle();
  }
}
