import { Component, inject, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ValidatorService } from '../../service/validator.service';

/**
 * The CreateAccountComponent allows users to create an account by filling out a form.
 * The form validates user input, such as username, email, and password,
 * and ensures the user agrees to the terms and conditions before submission.
 */
@Component({
  selector: 'app-create-account',
  imports: [
    MATERIAL_MODULES,
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccountComponent {
  isHovered: boolean = false;
  privatPolicy: boolean = false;
  fb: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);
  validatorService: ValidatorService = inject(ValidatorService);

  /**
   * Stores error details related to the email field.
   * - Populated when there is an issue during registration (e.g., invalid email or email already in use).
   * - Retrieved from the navigation state passed via the router.
   * @type {any}
   */
  emailError: any;

  /**
   * Reactive form group for user account creation.
   * Fields:
   * - `username`: Full name (first and last name, min. 2 characters each, required).
   * - `email`: Valid email address (required).
   * - `password`: Strong password validated by a custom validator (required).
   * - `agreeToTerms`: Checkbox to confirm agreement to terms (required).
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
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: [
      '',
      [Validators.required, this.validatorService.passwordValidator()],
    ],
    agreeToTerms: [false, Validators.requiredTrue],
  });

  /**
   * Initializes the component by checking for navigation state.
   * - Retrieves `form` and `emailError` data from the navigation state, if available.
   * - Prefills the form with the retrieved data.
   * - Sets the `emailError` property if an error is passed through the state.
   * @constructor
   */
  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { form: any, emailError: any };
    if (state?.form) {
      this.form.patchValue(state.form);
    } if (state?.emailError) {
      this.emailError = state.emailError;
    }
  }

  /**
   * Handles form submission.
   * Navigates to the avatar-picker selection page if the form is valid.
   * Passes form data as state to the next route.
   * @returns {void}
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.router.navigateByUrl('/avatar-picker', {
        state: { formData: this.form.value },
      });
    }
  }
}
