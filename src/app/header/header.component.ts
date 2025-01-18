import { Component } from '@angular/core';
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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MATERIAL_MODULES, CommonModule, SearchBarComponent, SearchBarComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;

  searchQuery: string = '';

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.user$;    
  }

  onSearch() {
    console.log('Aktuelle Suchanfrage:', this.searchQuery);
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
