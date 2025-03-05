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
   * Initializes subscriptions to reactive properties from various services.
   * - Listens for changes in `showResult$` from `showHiddeService` and updates `showResult`.
   * - Listens for changes in `borderTrigger$` from `showHiddeService` and updates `borderTrigger`.
   * - Listens for `isChatActive$` from `mainContent` and triggers change detection.
   * - Calls `cdr.detectChanges()` to ensure the UI updates when values change.
   *
   * @private
   * @returns {void}
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
   * Checks the screen size on window resize and updates the `isMobile` flag accordingly.
   * - Uses the `@HostListener` decorator to listen for `resize` events on the window.
   * - Determines whether the screen width is `<= 1024px` and updates `isMobile`.
   * - If the `isMobile` state has changed, triggers change detection using `cdr.detectChanges()`.
   *
   * @returns {void}
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
   * Handles clicks outside the search bar container to hide the search results.
   * - Uses the `@HostListener` decorator to listen for `mousedown` events on the document.
   * - Checks if the clicked target is inside the `.searchbar-container`.
   * - If the click occurs outside, it hides the search results via `showHiddeService.setShowResult(false)`.
   *
   * @param {MouseEvent} event - The mouse event triggered by a user click.
   * @returns {void}
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchbar-container')) {
      this.showHiddeService.setShowResult(false);
    }
  }

  /**
   * Opens the user menu dialog.
   * - Uses Angular Material's `MatDialog` to open the `UserMenuComponent`.
   * - Configures the dialog with a fixed width of 300px and a custom panel class.
   *
   * @returns {void}
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {
      width: '300px',
      panelClass: 'user-menu-dialog',
    });
  }
}
