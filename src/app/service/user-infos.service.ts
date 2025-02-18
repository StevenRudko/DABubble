import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UserInfosService {
  /**
   * The currently authenticated user.
   * @type {User}
   */
  currentUser!: User;

  /**
   * The display name of the currently authenticated user.
   * @type {string | null}
   */
  displayName: string | any = '';

  /**
   * The profile photo URL of the currently authenticated user.
   * @type {any}
   */
  photoURL: any;

  /**
   * The email address of the currently authenticated user.
   * @type {string | null}
   */
  email: string | null = null;

  /**
   * The unique identifier (UID) of the currently authenticated user.
   * @type {any}
   */
  uId: any = '';

  constructor(private authService: AuthService) {
    this.getUserInfo();
  }

  /**
   * Retrieves and sets the current user's profile information.
   * - Updates the component properties with user details such as `displayName`, `photoURL`, `email`, and `uId`.
   * - Logs the user details to the console.
   *
   * @returns {void}
   */
  getUserInfo(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.displayName = user.displayName;
        this.photoURL = user.photoURL;
        this.email = user.email;
        this.uId = user.uid;
      } else {
        console.log('Kein Benutzer angemeldet.');
      }
    });
  }
}
