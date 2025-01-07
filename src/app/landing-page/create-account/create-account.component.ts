import { Component, inject } from '@angular/core';
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
  /**
   * Indicates whether the user is hovering over form elements.
   * @type {boolean}
   */
  isHovered: boolean = false;

  /**
   * Tracks whether the user has agreed to the privacy policy.
   * This value is bound to a checkbox in the form.
   * @type {boolean}
   */
  privatPolicy: boolean = false;

  /**
   * A FormBuilder instance for constructing the reactive form.
   * @type {FormBuilder}
   */
  fb: FormBuilder = inject(FormBuilder);

  /**
   * Router instance used for navigating between pages.
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * ValidatorService instance for applying custom form validation rules.
   * @type {ValidatorService}
   */
  validatorService: ValidatorService = inject(ValidatorService);

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
