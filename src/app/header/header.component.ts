import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { FormsModule } from '@angular/forms';
import { UserInfosService } from '../service/user-infos.service';
import { ShowHiddeResultsService } from '../service/show-hidde-results.service';
import { MainContentComponent } from '../main-content/main-content.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    LogoComponentComponent,
    MATERIAL_MODULES,
    CommonModule,
    SearchBarComponent,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  public borderTrigger: boolean = false;
  public searchQuery: string = '';
  public showResult: boolean = false;
  public isMobile: boolean = window.innerWidth <= 1024;

  /**
   * Initializes component with required services
   */
  constructor(
    private dialog: MatDialog,
    public userInfo: UserInfosService,
    public showHiddeService: ShowHiddeResultsService,
    private cdr: ChangeDetectorRef,
    public mainContent: MainContentComponent
  ) {
    this.checkScreenSize();
  }

  /**
   * Initializes component subscriptions
   */
  ngOnInit(): void {
    this.initializeSubscriptions();
  }

  /**
   * Sets up service subscriptions
   */
  private initializeSubscriptions(): void {
    this.showHiddeService.showResult$.subscribe((value) => {
      this.showResult = value;
      this.cdr.detectChanges();
    });

    this.showHiddeService.borderTrigger$.subscribe((value) => {
      this.borderTrigger = value;
      this.cdr.detectChanges();
    });

    this.mainContent.isChatActive$.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  /**
   * Monitors window resize events
   */
  @HostListener('window:resize')
  checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 1024;

    if (wasMobile !== this.isMobile) {
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles document click events for search visibility
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchbar-container')) {
      this.showHiddeService.setShowResult(false);
    }
  }

  /**
   * Opens the user menu dialog
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {
      width: '300px',
      panelClass: 'user-menu-dialog',
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('The dialog was closed');
    });
  }
}
