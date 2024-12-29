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
      // const errorMessages: string[] = [];
  
      if (value.length < 6) {
        this.errorMessages = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
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
}
