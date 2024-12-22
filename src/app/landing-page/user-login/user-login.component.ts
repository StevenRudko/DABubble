import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import {ErrorStateMatcher} from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

@Component({
  selector: 'app-user-login',
  imports: [MATERIAL_MODULES],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
