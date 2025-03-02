import { Component, inject } from '@angular/core';
import { UserInfosService } from '../../service/user-infos.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-avatar-picker-overlay',
  imports: [],
  templateUrl: './avatar-picker-overlay.component.html',
  styleUrl: './avatar-picker-overlay.component.scss'
})
export class AvatarPickerOverlayComponent {
  /**
   * Reference to the Material Dialog used to display this component.
   * @type {MatDialogRef<AvatarPickerOverlayComponent>}
   */
  readonly dialogRef = inject(MatDialogRef<AvatarPickerOverlayComponent>);

  /**
   * AuthService for registering new users
   * @type {AuthService}
   */
  authService: AuthService = inject(AuthService);

  /**
     * A list of available avatar image paths.
     * Each avatar is represented by its image file path.
     * @type {string[]}
     */
  avatarPath: string[] = [
    'img-placeholder/elias.svg',
    'img-placeholder/elise.svg',
    'img-placeholder/frederik.svg',
    'img-placeholder/noah.svg',
    'img-placeholder/sofia.svg',
    'img-placeholder/steffen.svg',
  ];

  /**
   * The path of the currently selected user avatar.
   * Defaults to a placeholder image.
   * @type {string}
   */
  selectedUserAvatar: string = '';

  /**
   * Indicates whether the "Create Account" button is disabled.
   * @type {boolean}
   */
  disabled: boolean = true;

  /**
   * Status flag to indicate whether avatars can be selected.
   * @type {boolean}
   */
  status: boolean = true;

  constructor(
    public userInfo: UserInfosService,
  ) {
    this.selectedUserAvatar = this.userInfo.currentUser.photoURL ?? 'img/person.png';
  }

  /**
   * Sets the selected avatar if the status allows.
   * Enables the "Create Account" button.
   * @param path - The path of the selected avatar image.
   */
  selectedAvatar(path: string): void {
    if (this.status) {
      this.selectedUserAvatar = path;
      this.disabled = false;
    }
  }

  /**
   * Updates the user's avatar and saves the changes to Firestore.
   * - Calls `updateUserProfile()` to update the user's profile information.
   * - Calls `saveUserInfoToFirestore()` to persist the updated profile in Firestore.
   * - Refreshes the user information by calling `getUserInfo()`.
   * - Closes the dialog or UI component after updating.
   * 
   * @async
   * @returns {Promise<void>} - Resolves when the avatar update process is complete.
   */
  async setNewAvatar() {
    await this.authService.updateUserProfile(
      this.userInfo.currentUser,
      this.userInfo.displayName,
      this.selectedUserAvatar
    )
    await this.authService.saveUserInfoToFirestore(this.userInfo.currentUser);
    this.userInfo.getUserInfo();
    this.close();
  }

  /**
   * Closes the Material Dialog without making any changes.
   * @returns {void}
   */
  close(): void {
    this.dialogRef.close();
  }
}
