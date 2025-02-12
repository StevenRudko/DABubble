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

  // Public properties
  public isMobile: boolean = window.innerWidth <= 1024;
  public isChatActive: boolean = false;
  public isChatActive$ = new BehaviorSubject<boolean>(false);
  public sidebarActive: boolean = false;
  public threadVisible: boolean = false;
  public currentThreadMessageId: string | null = null;
  public onlineUsers: string[] = [];
  public navigationState: NavigationState = {
    showChat: false,
    showThread: false,
  };

  constructor(
    private authService: AuthService,
    private presenceService: PresenceService
  ) {
    this.checkScreenSize();
    this.initializeAuthListener();
  }

  private initializeAuthListener(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        console.log('User Data:', user);
      } else {
        console.log('No user logged in');
      }
    });
  }

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

  ngOnInit(): void {
    this.presenceService.setOnlineStatus();
    if (this.isMobile) {
      this.sidebarActive = true;
    }
  }

  ngAfterViewInit(): void {
    if (this.isMobile) {
      this.drawer?.open();
    }
  }

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

  public toggleSidebar(): void {
    if (!this.isMobile) {
      this.sidebarActive = !this.sidebarActive;
      this.drawer?.toggle();
    }
  }

  onOpenThread(messageId: string): void {
    this.navigationState.showThread = true;
    this.threadVisible = true;
    this.currentThreadMessageId = messageId;
  }
}
