import { Component, signal } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import {ErrorStateMatcher, ShowOnDirtyErrorStateMatcher} from '@angular/material/core';
import { FormControl, FormGroupDirective, FormsModule, NgForm, Validators, ReactiveFormsModule,} from '@angular/forms';
import { UserAuth } from '../../models/user-auth';

@Component({
  selector: 'app-user-login',
  imports: [MATERIAL_MODULES, FormsModule, ReactiveFormsModule],
  providers: [{ provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent {

  userAuth: UserAuth = new UserAuth();
  loading: boolean = false;
}