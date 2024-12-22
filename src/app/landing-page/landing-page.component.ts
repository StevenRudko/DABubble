import { Component } from '@angular/core';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { UserLoginComponent } from './user-login/user-login.component';
import { CreateAccountComponent } from "./create-account/create-account.component";
import { AvatarPickerComponent } from './avatar-picker/avatar-picker.component';

@Component({
  selector: 'app-landing-page',
  imports: [LogoComponentComponent, MATERIAL_MODULES, UserLoginComponent, CreateAccountComponent, AvatarPickerComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
