import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HeaderComponent } from './header/header.component';
import { CreateAccountComponent } from './landing-page/create-account/create-account.component';
import { AvatarPickerComponent } from './landing-page/avatar-picker/avatar-picker.component';
import { LogoComponentComponent } from './shared/logo-component/logo-component.component';
import { UserLoginComponent } from './landing-page/user-login/user-login.component';
import { MainContentComponent } from './main-content/main-content.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent,
        children: [
            {
                path: '',
                component: UserLoginComponent, // Wird im Standard-RouterOutlet gerendert
            },
            {
                path: 'reg',
                component: CreateAccountComponent, // Wird im Standard-RouterOutlet gerendert
            },
            {
                path: 'avat',
                component: AvatarPickerComponent, // Wird im benannten "sidebar"-RouterOutlet gerendert
                outlet: 'sidebar',
            }
        ]
    },
    { path: 'login', component: MainContentComponent },
];

