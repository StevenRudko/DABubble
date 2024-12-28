import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { CreateAccountComponent } from './landing-page/create-account/create-account.component';
import { AvatarPickerComponent } from './landing-page/avatar-picker/avatar-picker.component';
import { UserLoginComponent } from './landing-page/user-login/user-login.component';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './landing-page/privacy-policy/privacy-policy.component';
import { ImprintComponent } from './landing-page/imprint/imprint.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent,
        children: [
            {
                path: '',
                component: UserLoginComponent, 
            },
            {
                path: 'reg',
                component: CreateAccountComponent, 
            },
            {
                path: 'avat',
                component: AvatarPickerComponent,
            },
            {
                path: 'imprint',
                component: ImprintComponent,
            },
            {
                path: 'privacy-policy',
                component: PrivacyPolicyComponent,
            },
        ]
    },
    { path: 'login', component: MainContentComponent },
];

