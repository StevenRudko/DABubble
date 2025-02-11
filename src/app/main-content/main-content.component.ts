import { Component, ViewChild, HostListener } from '@angular/core';
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
  threadVisible: boolean = false;
  currentThreadMessageId: string | null = null;
  isMobile: boolean = window.innerWidth <= 1024;

  /**
   * Initializes the main content component
   * @param authService Service for handling authentication
   * @param presenceService Service for handling user presence
   */
  constructor(
    private authService: AuthService,
    private presenceService: PresenceService
  ) {
    this.checkScreenSize();
    this.initializeAuthListener();
  }

  /**
   * Initializes the authentication listener
   */
  private initializeAuthListener(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        console.log('User Data:', user);
      } else {
        console.log('No user logged in');
      }
    });
  }

  /**
   * Listens for window resize events and adjusts the sidebar accordingly
   */
  @HostListener('window:resize')
  checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 1024;

    if (!wasMobile && this.isMobile) {
      this.sidebarActive = true;
      if (this.drawer) {
        this.drawer.open();
      }
    }
  }

  /**
   * Initializes component and sets user's online status
   */
  ngOnInit(): void {
    this.presenceService.setOnlineStatus();
    if (this.isMobile) {
      this.sidebarActive = true;
    }
  }

  /**
   * Initializes the view and opens sidebar if on mobile
   */
  ngAfterViewInit(): void {
    if (this.isMobile) {
      this.drawer.open();
    }
  }

  /**
   * Toggles the sidebar visibility state on desktop only
   */
  toggleSidebar(): void {
    if (!this.isMobile) {
      this.sidebarActive = !this.sidebarActive;
      this.drawer.toggle();
    }
  }

  /**
   * Opens the thread view with the selected message
   * @param messageId - ID of the message to show in thread
   */
  onOpenThread(messageId: string): void {
    this.threadVisible = true;
    this.currentThreadMessageId = messageId;
  }
}
