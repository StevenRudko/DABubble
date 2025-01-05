import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * The ValidatorService provides custom validation logic for Angular forms,
 * including password strength validation and password match validation.
 */
@Injectable({
  providedIn: 'root',
})
export class ValidatorService {
  /**
   * Stores the most recent error message for password validation.
   * Used to provide detailed feedback to the user.
   * @type {string}
   */
  errorMessages: string = '';

  /**
   * Validator function to ensure a password meets specific strength requirements.
   * - Password must be at least 6 characters long.
   * - Must contain at least one lowercase letter.
   * - Must contain at least one uppercase letter.
   * - Must contain at least one digit.
   * - Must contain at least one special character (`@$!%*?&`).
   *
   * If the password fails any of these checks, an error object is returned with
   * a detailed error message.
   *
   * @returns {ValidatorFn} - A validator function for password strength validation.
   */
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';

      if (value.length < 6) {
        this.errorMessages =
          'Das Passwort muss mindestens 6 Zeichen lang sein.';
      } else if (!/[a-z]/.test(value)) {
        this.errorMessages =
          'Das Passwort muss mindestens einen Kleinbuchstaben enthalten.';
      } else if (!/[A-Z]/.test(value)) {
        this.errorMessages =
          'Das Passwort muss mindestens einen Großbuchstaben enthalten.';
      } else if (!/\d/.test(value)) {
        this.errorMessages =
          'Das Passwort muss mindestens eine Zahl enthalten.';
      } else if (!/[@$!%*?&]/.test(value)) {
        this.errorMessages =
          'Das Passwort muss mindestens ein Sonderzeichen enthalten.';
      } else {
        this.errorMessages = '';
      }
      return this.errorMessages.length > 0
        ? { passwordErrors: this.errorMessages }
        : null;
    };
  }

  /**
   * Validator function to ensure that two passwords match.
   * - Compares the `password` and `confirmPassword` fields within a form group.
   *
   * If the passwords do not match, an error object is returned with a `passwordsMismatch` error.
   *
   * @returns {ValidatorFn} - A validator function for password matching validation.
   */
  passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const passwordConfirm = group.get('confirmPassword')?.value;

      return password === passwordConfirm ? null : { passwordsMismatch: true };
    };
  }
}
