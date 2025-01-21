import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../service/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SearchBarComponent } from "./search-bar/search-bar.component";
import { FormsModule } from '@angular/forms';
import { UserInfosService } from '../service/user-infos.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MATERIAL_MODULES, CommonModule, SearchBarComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;
  borderTrigger: boolean = false;
  searchQuery: string = '';
  showResult: boolean = false;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public userInfo: UserInfosService
  ) {
    this.currentUser$ = this.authService.user$;
  }

  onBorderTriggerChange(newValue: boolean): void {
    this.borderTrigger = newValue;
    this.cdr.detectChanges();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchbar-container')) {
      this.showResult = false;
    }
  }
}
