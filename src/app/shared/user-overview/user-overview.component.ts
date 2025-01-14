import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../service/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';

/**
 * The UserOverviewComponent allows the user to view and update their profile information,
 * including their display name and profile picture. It uses Angular Material Dialog for UI interactions.
 */
@Component({
  selector: 'app-user-overview',
  imports: [CommonModule, MatIconModule, MatDialogModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent {
  /**
  * Reference to the Material Dialog used to display this component.
  * @type {MatDialogRef<UserOverviewComponent>}
  */
  readonly dialogRef = inject(MatDialogRef<UserOverviewComponent>);

  /**
   * A FormBuilder instance for constructing the reactive form.
   * @type {FormBuilder}
   */
  fb: FormBuilder = inject(FormBuilder);

  /**
   * The currently authenticated user.
   * @type {User}
   */
  currentUser!: User; //| null = null;

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

  /**
   * Observable for monitoring the authentication state of the user.
   * @type {Observable<User | null>}
   */
  currentUser$!: Observable<User | null>;

  /**
   * Flag to toggle the edit mode for updating the user's profile.
   * @type {boolean}
   */
  edit: boolean = false;

  /**
   * Reactive form for updating the user's display name.
   * @type {FormGroup}
   */
  form = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[A-Za-zÄÖÜäöüß]{2,}\s[A-Za-zÄÖÜäöüß]{2,}$/),
      ],
    ],
  });

  /**
   * Initializes the component and retrieves the current user information.
   * @param {AuthService} authService - The authentication service for managing user authentication.
   */
  constructor(
    private authService: AuthService,
  ) {
    this.currentUser$ = this.authService.user$;
    this.getUserInfo();
  }

  /**
   * Submits the updated user profile information.
   * - Updates the user's display name in Firebase Authentication.
   * - Updates the display name in Firestore.
   * - Closes the dialog upon successful update.
   * 
   * @returns {void}
   */
  onSubmit(): void {
    this.authService.updateUserProfile(this.currentUser, this.form.controls.username.value, this.photoURL)
      .then(() => {
        this.authService.updateUserNameInFirestore(this.uId, this.form.controls.username.value)
        this.dialogRef.close();
      })
      .catch((error) => {
        console.error('Fehler beim ändern des Namens', error);
        alert('Fehler: ' + error);
      });
  }

  /**
   * Closes the Material Dialog without making any changes.
   * @returns {void}
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Retrieves and sets the current user's profile information.
   * - Updates the component properties with user details such as `displayName`, `photoURL`, `email`, and `uId`.
   * - Logs the user details to the console.
   * 
   * @returns {void}
   */
  getUserInfo(): void {
    this.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.displayName = user.displayName;
        this.photoURL = user.photoURL;
        this.email = user.email;
        this.uId = user.uid;
        this.patchNameInInput();
      } else {
        console.log('Kein Benutzer angemeldet.');
      }
    });
  }

  /**
   * Retrieves and sets the current user's profile information.
   * - Subscribes to the `currentUser$` observable to monitor authentication state.
   * - If a user is authenticated:
   *   - Sets the `currentUser`, `displayName`, `photoURL`, `email`, and `uId` properties.
   *   - Calls `patchNameInInput` to update the form's `username` field with the user's display name.
   * - Logs a message if no user is authenticated.
   *
   * @returns {void}
   */
  patchNameInInput() {
    this.form.patchValue({
      username: this.displayName,
    });
  }
}