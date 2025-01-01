import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {
  errorMessages: string = '';

  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';

      if (value.length < 6) {
        this.errorMessages = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      } else if (!/[a-z]/.test(value)) {
        this.errorMessages = 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten.';
      } else if (!/[A-Z]/.test(value)) {
        this.errorMessages = 'Das Passwort muss mindestens einen Großbuchstaben enthalten.';
      } else if (!/\d/.test(value)) {
        this.errorMessages = 'Das Passwort muss mindestens eine Zahl enthalten.';
      } else if (!/[@$!%*?&]/.test(value)) {
        this.errorMessages = 'Das Passwort muss mindestens ein Sonderzeichen enthalten.';
      } else {
        this.errorMessages = '';
      }
      return this.errorMessages.length > 0 ? { passwordErrors: this.errorMessages } : null;
    };
  }

  passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const passwordConfirm = group.get('confirmPassword')?.value;

      return password === passwordConfirm ? null : { passwordsMismatch: true };
    };
  }
}
