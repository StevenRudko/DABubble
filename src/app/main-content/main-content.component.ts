import { Component, ViewChild, HostListener, ElementRef } from '@angular/core';
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
import { BehaviorSubject } from 'rxjs';
import { ThreadService } from '../service/open-thread.service';

export interface NavigationState {
  showChat: boolean;
  showThread: boolean;
}

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
  @ViewChild('contentWrapper') contentWrapper!: ElementRef;

  public isMobile: boolean = window.innerWidth <= 1024;
  public isChatActive: boolean = false;
  public isChatActive$ = new BehaviorSubject<boolean>(false);
  public sidebarActive: boolean = true;
  public threadVisible: boolean = false;
  public currentThreadMessageId: string | null = null;
  public onlineUsers: string[] = [];
  public navigationState: NavigationState = {
    showChat: false,
    showThread: false,
  };

  /**
   * Initializes auth state monitoring and UI state subscriptions.
   */
  constructor(
    private authService: AuthService,
    private presenceService: PresenceService,
    private threadService: ThreadService
  ) {
    this.checkScreenSize();
    this.initializeAuthListener();
    this.threadService.threadVisible$.subscribe((visible) => {
      this.threadVisible = visible;
      this.navigationState.showThread = visible;
    });

    this.threadService.currentThreadMessageId$.subscribe((messageId) => {
      this.currentThreadMessageId = messageId;
    });
  }

  /**
   * Monitors auth state changes and logs user status.
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
   * Updates mobile view state on window resize.
   * Opens drawer when transitioning to mobile view.
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
   * Initializes user presence and mobile view settings.
   */
  ngOnInit(): void {
    this.presenceService.setOnlineStatus();
    if (this.isMobile) {
      this.sidebarActive = true;
    }
  }

  /**
   * Sets up initial mobile view drawer state.
   */
  ngAfterViewInit(): void {
    if (this.isMobile) {
      this.drawer?.open();
    }
  }

  /**
   * Handles navigation between thread, chat and sidebar views.
   * Updates UI state and visibility flags.
   */
  handleBack(): void {
    if (this.navigationState.showThread) {
      this.navigationState.showThread = false;
      this.threadVisible = false;
    } else if (this.navigationState.showChat) {
      this.navigationState.showChat = false;
      this.showChat(false);
    }
    this.isChatActive = this.navigationState.showChat;
    this.isChatActive$.next(this.navigationState.showChat);
  }

  /**
   * Controls chat view visibility and updates mobile UI.
   * @param show - Toggle chat view visibility
   */
  showChat(show: boolean) {
    this.navigationState.showChat = show;
    this.isChatActive = show;
    this.isChatActive$.next(show);

    if (this.isMobile) {
      if (show) {
        this.drawer.close();
        if (this.contentWrapper) {
          this.contentWrapper.nativeElement.classList.add('chat-active');
        }
      } else {
        this.drawer.open();
        if (this.contentWrapper) {
          this.contentWrapper.nativeElement.classList.remove('chat-active');
        }
      }
    }
  }

  /**
   * Toggles sidebar visibility in desktop view only.
   */
  public toggleSidebar(): void {
    if (!this.isMobile) {
      this.sidebarActive = !this.sidebarActive;
      this.drawer?.toggle();
    }
  }

  /**
   * Opens thread view for a message.
   * @param messageId - ID of message to show thread for
   */
  onOpenThread(messageId: string): void {
    this.threadService.openThread(messageId);
  }
}
