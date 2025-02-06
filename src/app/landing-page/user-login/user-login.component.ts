import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import {
  FormsModule,
  Validators,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink } from '@angular/router';

/**
 * The UserLoginComponent handles user authentication by providing login functionality
 * via email/password, Google Sign-In, or guest access.
 */
@Component({
  selector: 'app-user-login',
  standalone:true,
  imports: [MATERIAL_MODULES, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss',
})
export class UserLoginComponent {
  /**
   * Indicates if there was an error during login.
   * Used to display error messages in the UI.
   * @type {boolean}
   */
  error: boolean = false;

  /**
   * FormBuilder instance for managing the reactive form.
   * @type {FormBuilder}
   */
  fb: FormBuilder = inject(FormBuilder);

  /**
   * AuthService instance for handling authentication actions.
   * @type {AuthService}
   */
  authService: AuthService = inject(AuthService);

  /**
   * Router instance for navigating between routes after successful login.
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * Reactive form group for user login.
   * Fields:
   * - `email`: The user's email address (required, must be in a valid email format).
   * - `password`: The user's password (required).
   * @type {FormGroup}
   */
  form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: ['', Validators.required],
  });

  /**
   * Handles form submission for user login.
   * - Sends the email and password to the AuthService for authentication.
   * - Navigates to the main success page on success.
   * - Displays an error message on failure.
   * @returns {void}
   */
  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authService.login(rawForm.email, rawForm.password).subscribe({
      next: () => {
        this.router.navigateByUrl('/main');
      },
      error: (error) => {
        this.error = true;
        console.error('Email/Password Sign-In error:', error);
      },
    });
  }

  /**
   * Initiates Google Sign-In for user authentication.
   * - On success, navigates to the main success page.
   * - Logs any errors to the console.
   * @returns {void}
   */
  async onGoogleSignIn(): Promise<void> {
    try {
      await this.authService.googleLogin();
      this.router.navigateByUrl('/main');
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  }
  

  /**
   * Enables a guest login by auto-filling the form with default credentials
   * and submitting the form automatically if valid.
   * - Prevents memory leaks by unsubscribing from the form valueChanges listener.
   * @returns {void}
   */
  guestLogin(): void {
    const values = { email: 'max-musterman@mail.com', password: '1234ABcd@' };
    this.form.patchValue(values);
    const subscription = this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        subscription.unsubscribe();
        this.onSubmit();
      }
    });
  }
}