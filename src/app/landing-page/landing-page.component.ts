import { Component, inject } from '@angular/core';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { UserAccountInfoService } from '../service/user-account-info.service';

/**
 * The LandingPageComponent serves as the entry point for the application.
 * It displays a welcoming landing page with navigation options, a logo, 
 * and dynamic user notifications. The component also handles links to registration,
 * privacy policy, and imprint pages.
 * 
 * ### HTML Structure:
 * - **Header**: Contains the logo and a dynamic section that prompts new users to create an account 
 *   if they are on the `/` route.
 * - **User Authentication Section**: Displays a card for user authentication content provided 
 *   by the `RouterOutlet`.
 * - **Footer**: Shows links to the imprint and privacy policy if the user is on the `/` route.
 * - **User Info Overlay**: Dynamically displays messages from the `UserAccountInfoService` 
 *   with optional icons, depending on the current message type.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterOutlet,
    LogoComponentComponent,
    MATERIAL_MODULES,
    RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  /**
   * Router instance for navigation.
   * Used to programmatically navigate between routes and determine the current URL.
   * @type {Router}
   */
  router: Router = inject(Router);

  /**
   * UserAccountInfoService instance for managing user-related notifications
   * and messages displayed dynamically on the landing page.
   * @type {UserAccountInfoService}
   */
  userAccInfo: UserAccountInfoService = inject(UserAccountInfoService);
}