import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { UserAccountInfoService } from '../../service/user-account-info.service';

/**
 * The AvatarPickerComponent allows users to select an avatar from a predefined list
 * and create an account using the selected avatar.
 */
@Component({
  selector: 'app-avatar-picker',
  imports: [MATERIAL_MODULES],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss',
})
export class AvatarPickerComponent {
  /**
   * AuthService for registering new users
   * @type {AuthService}
   */
  authService: AuthService = inject(AuthService);

  /**
   * Router for navigating between pages
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * UserAccountInfoService for displaying status messages
   * @type {UserAccountInfoService}
   */
  userAccInfo: UserAccountInfoService = inject(UserAccountInfoService);

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
  selectedUserAvatar: string = 'img/person.png';

  /**
   Contains form data passed via navigation state.
   * If no data is available, the user is redirected to the homepage.
   * @type {any}
   */
  formData: any;

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

  /**
   * Loads form data from the navigation state or redirects to the homepage
   * if no data is available.
   * @constructor
   */
  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras?.state?.['formData'] || null;
    if (!this.formData) {
      this.router.navigateByUrl('');
    }
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
   * Creates a new user account.
   * - Disables the form and updates the status to prevent duplicate submissions.
   * - Registers the user via the `AuthService` using the provided form data and avatar.
   * @returns {void}
   */
  createAccount(): void {
    this.disabled = true;
    this.status = false;
    this.authService
      .register(
        this.formData.email,
        this.formData.username,
        this.formData.password,
        this.selectedUserAvatar
      )
      .subscribe({
        next: () => {
          this.userAccInfo.showMessage(0);
          setTimeout(() => {
            this.router.navigateByUrl('/main');
          }, 1500);
        },
        error: (error) => {
          console.error('Show error', error);
          this.router.navigateByUrl('/register', {
            state: { form: this.formData, emailError: error },
          });
        },
      });
  }

  /**
   * Navigates back to the registration form.
   * - Redirects the user to the `/register` route.
   * - Passes the `formData` as state to prefill the registration form.
   *
   * @returns {void}
   */
  backToForm() {
    this.router.navigateByUrl('/register', {
      state: { form: this.formData },
    });
  }
}
