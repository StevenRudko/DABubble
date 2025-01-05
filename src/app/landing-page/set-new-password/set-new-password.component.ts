import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValidatorService } from '../../service/validator.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Auth } from '@angular/fire/auth';
import { UserAccountInfoService } from '../../service/user-account-info.service';

/**
 * The SetNewPasswordComponent allows users to set a new password after verifying
 * a password reset link sent to their email. It validates the reset code and ensures
 * the new password meets security requirements.
 */
@Component({
  selector: 'app-set-new-password',
  imports: [MATERIAL_MODULES, ReactiveFormsModule, RouterLink],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent {
  /**
   * FormBuilder instance for managing the reactive form.
   * @type {FormBuilder}
   */
  fb: FormBuilder = inject(FormBuilder);

  /**
   * ValidatorService instance for custom form validations, such as password strength
   * and matching passwords.
   * @type {ValidatorService}
   */
  validatorService: ValidatorService = inject(ValidatorService);

  /**
   * Firebase Auth instance for handling password reset verification.
   * @type {Auth}
   */
  auth: Auth = inject(Auth);

  /**
   * Router instance for navigating between routes.
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * ActivatedRoute instance to access query parameters from the URL, such as the
   * `oobCode` used for password reset verification.
   * @type {ActivatedRoute}
   */
  route: ActivatedRoute = inject(ActivatedRoute);

  /**
   * UserAccountInfoService instance for displaying user messages and feedback.
   * @type {UserAccountInfoService}
   */
  userAccInfo: UserAccountInfoService = inject(UserAccountInfoService);

  /**
   * Stores the email address associated with the password reset link.
   * @type {string | null}
   */
  email: string | null = null;

  /**
   * Reactive form group for setting a new password.
   * Fields:
   * - `password`: The new password (required, validated for strength).
   * - `confirmPassword`: Confirmation of the new password (required, must match `password`).
   * Includes a custom validator to ensure both passwords match.
   * @type {FormGroup}
   */
  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, this.validatorService.passwordValidator()]],
    confirmPassword: ['', [Validators.required, this.validatorService.passwordValidator()]],
  },
    { validators: this.validatorService.passwordMatchValidator() }
  );

  /**
   * Lifecycle hook that initializes the component.
   * - Verifies the `oobCode` from the URL to ensure the password reset link is valid.
   * - Retrieves the associated email address if the code is valid.
   * @returns {void}
   */
  ngOnInit(): void {
    const actionCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!actionCode) {
      console.log('Ungültiger Link.');
      return;
    };

    verifyPasswordResetCode(this.auth, actionCode)
      .then((email) => {
        this.email = email;
      })
      .catch((error) => {
        console.log('Der Link ist ungültig oder abgelaufen.', error);
      });
  }


  /**
   * Handles the form submission to set a new password.
   * - Validates the `oobCode` from the URL.
   * - Submits the new password using Firebase's `confirmPasswordReset` method.
   * - Displays a success message and redirects the user to the homepage.
   * - Handles errors if the password reset fails.
   * @returns {void}
   */
  onSubmit(): void {
    const actionCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!actionCode) {
      console.log('Ungültiger Link.');
      return;
    }

    const rawForm = this.form.getRawValue();
    confirmPasswordReset(this.auth, actionCode, rawForm.password)
      .then(() => {
        this.userAccInfo.showMessage(2)
        setTimeout(() => {
          this.router.navigate(['']);
        }, 1500)
      })
      .catch((error) => {
        console.log('Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.', error);
      });
  }
}
