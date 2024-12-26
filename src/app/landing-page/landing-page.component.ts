import { Component } from '@angular/core';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { UserLoginComponent } from './user-login/user-login.component';
import { CreateAccountComponent } from "./create-account/create-account.component";
import { AvatarPickerComponent } from './avatar-picker/avatar-picker.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ImprintComponent } from './imprint/imprint.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterOutlet,
    LogoComponentComponent,
    MATERIAL_MODULES,
    UserLoginComponent,
    CreateAccountComponent,
    AvatarPickerComponent,
    PrivacyPolicyComponent,
    ImprintComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
