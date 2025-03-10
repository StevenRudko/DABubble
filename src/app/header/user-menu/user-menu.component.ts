import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { HeaderComponent } from '../header.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserOverviewComponent } from '../../shared/user-overview/user-overview.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  readonly dialogRef = inject(MatDialogRef<HeaderComponent>);
  router = inject(Router);

  constructor(private dialog: MatDialog, private authService: AuthService) {}

  /**
   * Opens a dialog displaying the UserOverviewComponent.
   * Closes the current dialog after opening the new one.
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(UserOverviewComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
    });
    this.dialogRef.close();
  }

  /**
   * Logs out the current user, closes the dialog, and navigates to the home page.
   */
  logOut(): void {
    this.authService.logout();
    this.dialogRef.close();
    this.router.navigateByUrl('');
  }
}
