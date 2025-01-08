import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserAccountInfoService } from '../../service/user-account-info.service';
import { AuthService } from '../../service/auth.service';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

/**
 * The ResetPasswordComponent allows users to reset their password by providing their email address.
 * A password reset link is sent to the email if it is valid and registered.
 */
@Component({
  selector: 'app-reset-password',
  imports: [MATERIAL_MODULES, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  /**
   * FormBuilder instance for creating the reactive form.
   * @type {FormBuilder}
   */
  fb: FormBuilder = inject(FormBuilder);

  /**
   * Router instance for navigating between pages.
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * UserAccountInfoService instance for displaying status messages to the user.
   * @type {UserAccountInfoService}
   */
  userAccInfo: UserAccountInfoService = inject(UserAccountInfoService);

  /**
   * Error flag for the email field.
   * - Set to `false` when the email field gains focus.
   * @type {boolean}
   */
  emailError: boolean = false;

  /**
   * Stores a list of email addresses retrieved from the Firestore database.
   * - Populated during the `ngOnInit` lifecycle hook.
   * @type {string[]}
   */
  emails: string[] = [];

  /**
   * Reactive form group for the email input.
   * Fields:
   * - `email`: The email address of the user (required, must be a valid email format).
   * @type {FormGroup}
   */
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /**
   * Initializes the component with the necessary services.
   * @param {AuthService} authService - The authentication service for managing user authentication.
   * @param {Firestore} firestore - The Firestore instance for database operations.
   */
  constructor(
    private authService: AuthService,
    private firestore: Firestore
  ) { }

  /**
   * Lifecycle hook that initializes the component.
   * - Fetches all user email addresses from the Firestore `users` collection.
   * - Updates the `emails` property with the list of retrieved email addresses.
   * @returns {Promise<void>} - A promise that resolves when the email addresses are successfully fetched.
   */
  async ngOnInit(): Promise<void> {
    const colRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(colRef);
    this.emails = snapshot.docs.map((doc) => doc.data()['email']);
  }

  /**
   * Handles the form submission for password reset.
   * - Validates the form and sends a password reset email using `AuthService`.
   * - Displays a success message and navigates to the homepage after a short delay.
   * - Catches errors during the process and displays an alert with the error message.
   * @returns {void}
   */
  onSubmit(): void {
    if (this.form.invalid) { return; }
    const email = this.form.value.email!;
    if (this.emails.includes(email)) {
      this.authService
        .sendPasswordResetMail(email)
        .then(() => {
          this.userAccInfo.showMessage(1);
          setTimeout(() => {
            this.router.navigate(['']);
          }, 1500);
        })
        .catch((error) => {
          console.error('Fehler beim Zurücksetzen des Passworts:', error);
          alert('Fehler: ' + error.message);
        });
    } else {
      this.emailError = true;
    }
  }

  /**
   * Resets the email error flag when the email field gains focus.
   * - Typically called on the `focus` event of the email input field.
   * @returns {void}
   */
  onEmailFocus(): void {
    this.emailError = false;
  }
}
