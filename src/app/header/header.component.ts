import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../service/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { UserInfosService } from '../service/user-infos.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MATERIAL_MODULES, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    public userInfo: UserInfosService
  ) {
    this.currentUser$ = this.authService.user$;    
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
