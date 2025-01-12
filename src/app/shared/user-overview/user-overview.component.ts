import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../service/auth.service';
import { map, Observable, switchMap, take } from 'rxjs';
import { User } from 'firebase/auth';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-user-overview',
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent {
  currentUser!: User; //| null = null;
  displayName: string | null = null;
  photoURL: string | null = null;
  email: string | null = null;

  currentUser$!: Observable<User | null>;




  constructor(
    private authService: AuthService,
  ) {
    this.currentUser$ = this.authService.user$;
    this.getUserInfo();
  }

  saveNewDisplayName() {
    this.authService.updateUserProfile(this.currentUser, 'Harald Glöckler', this.photoURL);

    // this.currentUser$
      // .pipe(
      //   take(1),
      //   switchMap(user => {
      //     if (user) {
      //       const photoURL = user.photoURL || '';
      //       return this.authService.updateUserProfile(user, 'Harald Glöckler', photoURL);
      //     } else {
      //       return Promise.reject('Kein Benutzer angemeldet');
      //     }
      //   })
      // )
      // .subscribe({
      //   next: () => console.log('Benutzerprofil erfolgreich aktualisiert'),
      //   error: err => console.error('Fehler beim Aktualisieren des Benutzerprofils:', err),
      // });
  }

  close() { }

  getUserInfo() {
    this.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.displayName = user.displayName
        this.photoURL = user.photoURL
        this.email = user.email
        console.log(this.displayName, this.photoURL, this.email, this.currentUser);
        
      } else {
        console.log('Kein Benutzer angemeldet.');
      }
    });
  }
}
