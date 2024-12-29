import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { HeaderComponent } from '../header.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
})
export class ProfileOverviewComponent {
  readonly dialogRef = inject(MatDialogRef<HeaderComponent>);
  authService = inject(AuthService)
  router = inject(Router);

  logOut(): void {
    this.authService.logout();
    this.dialogRef.close();
    this.router.navigateByUrl('');
  }
}
