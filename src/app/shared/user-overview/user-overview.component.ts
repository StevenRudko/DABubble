import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../service/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-user-overview',
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent {
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.user$;
  }

  close() {}
}
