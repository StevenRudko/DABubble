import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AuthService } from '../../service/auth.service';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { UserInfosService } from '../../service/user-infos.service';
import { AvatarPickerOverlayComponent } from '../avatar-picker-overlay/avatar-picker-overlay.component';

/**
 * The UserOverviewComponent allows the user to view and update their profile information,
 * including their display name and profile picture. It uses Angular Material Dialog for UI interactions.
 */
@Component({
  selector: 'app-user-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss',
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
    public userInfoService: UserInfosService,
    private dialog: MatDialog,
    public userInfo: UserInfosService
  ) {
    this.userInfoService.getUserInfo();
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
    this.authService
      .updateUserProfile(
        this.userInfoService.currentUser,
        this.form.controls.username.value,
        this.userInfoService.photoURL
      )
      .then(() => {
        this.authService.updateUserNameInFirestore(
          this.userInfoService.uId,
          this.form.controls.username.value
        );
        this.userInfo.getUserInfo();
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

  openEdit() {
    this.edit = true;
    this.patchNameInInput();
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
  patchNameInInput(): void {
    this.form.patchValue({
      username: this.userInfoService.displayName,
    });
  }

  openDialog(): void {
      const dialogRef = this.dialog.open(AvatarPickerOverlayComponent, {});
      dialogRef.afterClosed().subscribe(() => {
        console.log('The dialog was closed');
      });
    }
}
